"""API client for Blaze PowerZone Connect amplifiers."""

# pylint: disable=too-many-public-methods
from __future__ import annotations

import asyncio
import logging
from typing import Any

_LOGGER = logging.getLogger(__name__)

DEFAULT_PORT = 7621
CONNECTION_TIMEOUT = 10
READ_TIMEOUT = 5
MAX_RECONNECT_DELAY = 60


class BlazeApiError(Exception):
    """Exception for Blaze API errors."""


class BlazeConnectionError(BlazeApiError):
    """Exception for connection errors."""


class BlazeApi:
    """API client for Blaze PowerZone Connect amplifiers using raw TCP socket."""

    def __init__(self, host: str, port: int = DEFAULT_PORT) -> None:
        """Initialize the API client."""
        self._host = host
        self._port = port
        self._reader: asyncio.StreamReader | None = None
        self._writer: asyncio.StreamWriter | None = None
        self._lock = asyncio.Lock()
        self._connected = False

    async def _connect_with_backoff(self) -> None:
        """Try to connect using exponential backoff (1s -> 2s -> 4s ... max 60s)."""
        delay = 1
        last_error: Exception | None = None

        for attempt in range(1, 7):
            try:
                self._reader, self._writer = await asyncio.wait_for(
                    asyncio.open_connection(self._host, self._port),
                    timeout=CONNECTION_TIMEOUT,
                )
                self._connected = True
                _LOGGER.debug(
                    "Connected to Blaze amplifier at %s:%s (attempt %s)",
                    self._host,
                    self._port,
                    attempt,
                )
                return
            except (asyncio.TimeoutError, OSError, ConnectionRefusedError) as err:
                last_error = err
                self._connected = False
                if attempt >= 6:
                    break
                _LOGGER.warning(
                    "Connection attempt %s failed for %s:%s (%s), retrying in %ss",
                    attempt,
                    self._host,
                    self._port,
                    err,
                    delay,
                )
                await asyncio.sleep(delay)
                delay = min(delay * 2, MAX_RECONNECT_DELAY)

        raise BlazeConnectionError(
            f"Failed to connect to {self._host}:{self._port}: {last_error}"
        ) from last_error

    @property
    def host(self) -> str:
        """Return the host address."""
        return self._host

    @property
    def port(self) -> int:
        """Return the port number."""
        return self._port

    @property
    def connected(self) -> bool:
        """Return connection status."""
        return self._connected

    async def connect(self) -> None:
        """Connect to the amplifier."""
        await self._connect_with_backoff()

    async def disconnect(self) -> None:
        """Disconnect from the amplifier."""
        if self._writer:
            try:
                self._writer.close()
                await self._writer.wait_closed()
            except (OSError, RuntimeError):
                pass
        self._reader = None
        self._writer = None
        self._connected = False
        _LOGGER.debug("Disconnected from Blaze amplifier")

    async def _ensure_connection(self) -> None:
        """Ensure we are connected."""
        if not self._connected or self._writer is None or self._reader is None:
            await self.disconnect()
            await self.connect()

    async def _send_command(self, command: str) -> list[str]:
        """Send a command and return response lines."""
        async with self._lock:
            await self._ensure_connection()
            assert self._reader is not None
            assert self._writer is not None

            try:
                # Send command
                cmd = f"{command}\n"
                self._writer.write(cmd.encode())
                await self._writer.drain()

                # Read response lines
                responses: list[str] = []
                while True:
                    try:
                        line = await asyncio.wait_for(
                            self._reader.readline(),
                            timeout=READ_TIMEOUT,
                        )
                        if not line:
                            break
                        decoded = line.decode().strip()
                        if not decoded:
                            continue
                        responses.append(decoded)
                        # Command acknowledgment starts with *
                        if decoded.startswith("*"):
                            break
                        # Error starts with #
                        if decoded.startswith("#"):
                            raise BlazeApiError(f"API error: {decoded[1:]}")
                    except asyncio.TimeoutError:
                        break

                return responses

            except (OSError, ConnectionError) as err:
                self._connected = False
                raise BlazeConnectionError(f"Communication error: {err}") from err

    async def send_raw_command(self, command: str) -> list[str]:
        """Send a raw command to the amplifier and return all response lines."""
        if not command or not command.strip():
            raise BlazeApiError("Command cannot be empty")
        return await self._send_command(command.strip())

    def _parse_register_value(self, line: str) -> tuple[str, str]:
        """Parse a register response line into (register, value)."""
        # Lines like: +REGISTER value or +REGISTER "string value"
        if not line.startswith("+"):
            return ("", "")
        content = line[1:]  # Remove the +
        parts = content.split(" ", 1)
        register = parts[0]
        value = parts[1] if len(parts) > 1 else ""
        # Strip quotes from string values
        if value.startswith('"') and value.endswith('"'):
            value = value[1:-1]
        return (register, value)

    async def get_register(self, register: str) -> str:
        """Get a single register value."""
        responses = await self._send_command(f"GET {register}")
        for line in responses:
            if line.startswith("+"):
                _, value = self._parse_register_value(line)
                return value
        return ""

    async def get_registers(self, pattern: str) -> dict[str, str]:
        """Get multiple registers using wildcard pattern."""
        responses = await self._send_command(f"GET {pattern}")
        result: dict[str, str] = {}
        for line in responses:
            if line.startswith("+"):
                register, value = self._parse_register_value(line)
                if register:
                    result[register] = value
        return result

    async def set_register(self, register: str, value: Any) -> bool:
        """Set a register value."""
        # Quote string values that contain spaces
        if isinstance(value, str) and " " in value:
            value = f'"{value}"'
        responses = await self._send_command(f"SET {register} {value}")
        for line in responses:
            if line.startswith("*"):
                return True
        return False

    async def inc_register(self, register: str, value: float) -> str:
        """Increment a register value."""
        responses = await self._send_command(f"INC {register} {value}")
        for line in responses:
            if line.startswith("+"):
                _, new_value = self._parse_register_value(line)
                return new_value
        return ""

    async def subscribe(self, mode: str = "", frequency: float | None = None) -> bool:
        """Subscribe to updates.

        mode can be '', '*', 'REG', or 'DYN'. frequency is optional.
        """
        mode_norm = mode.strip().upper()
        parts = ["SUBSCRIBE"]
        if mode_norm:
            parts.append(mode_norm)
        if frequency is not None:
            parts.append(str(frequency))

        responses = await self._send_command(" ".join(parts))
        return any(line.startswith("*SUBSCRIBE") for line in responses)

    async def unsubscribe(self, mode: str = "") -> bool:
        """Unsubscribe from updates.

        mode can be '', '*', 'REG', or 'DYN'.
        """
        mode_norm = mode.strip().upper()
        command = "UNSUBSCRIBE" if not mode_norm else f"UNSUBSCRIBE {mode_norm}"
        responses = await self._send_command(command)
        return any(line.startswith("*UNSUBSCRIBE") for line in responses)

    async def power_on(self) -> bool:
        """Turn on the amplifier."""
        responses = await self._send_command("POWER_ON")
        return any(line.startswith("*POWER_ON") for line in responses)

    async def power_off(self) -> bool:
        """Turn off the amplifier."""
        responses = await self._send_command("POWER_OFF")
        return any(line.startswith("*POWER_OFF") for line in responses)

    async def get_all_registers(self) -> dict[str, str]:
        """Get all register values."""
        return await self.get_registers("*")

    async def get_device_info(self) -> dict[str, str]:
        """Get device information."""
        info: dict[str, str] = {}
        registers = await self.get_registers("SYSTEM.DEVICE.*")
        info.update(registers)
        return info

    async def get_system_status(self) -> dict[str, str]:
        """Get system status."""
        return await self.get_registers("SYSTEM.STATUS.*")

    async def get_zone_count(self) -> int:
        """Get number of zones."""
        val = await self.get_register("ZONE.COUNT")
        try:
            return int(val)
        except (ValueError, TypeError):
            return 0

    async def get_output_count(self) -> int:
        """Get number of output channels."""
        val = await self.get_register("OUT.COUNT")
        try:
            return int(val)
        except (ValueError, TypeError):
            return 0

    async def get_input_count(self) -> int:
        """Get number of input channels."""
        val = await self.get_register("IN.COUNT")
        try:
            return int(val)
        except (ValueError, TypeError):
            return 0

    async def test_connection(self) -> dict[str, str]:
        """Test connection and return device info."""
        await self.connect()
        try:
            info = {}
            # Get API version
            api_version = await self.get_register("API_VERSION")
            info["api_version"] = api_version

            # Get device info
            device_info = await self.get_device_info()
            info.update(device_info)

            # Get system status
            status = await self.get_system_status()
            info.update(status)

            return info
        except Exception:
            await self.disconnect()
            raise

    async def get_full_state(self) -> dict[str, str]:
        """Get the full state of the amplifier for polling."""
        try:
            # Full wildcard keeps parity with API register additions across firmware versions.
            data = await self.get_all_registers()
            if "API_VERSION" not in data:
                data["API_VERSION"] = await self.get_register("API_VERSION")
            return data
        except BlazeApiError as err:
            _LOGGER.warning("Error getting full state: %s", err)
            return {}
