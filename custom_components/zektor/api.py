"""Zektor Audio System API client."""

import asyncio
import logging
import re
from typing import Any, Callable, Optional

_LOGGER = logging.getLogger(__name__)


class ZektorProtocolError(Exception):
    """Exception raised for Zektor protocol errors."""

    pass


class ZektorConnectionError(Exception):
    """Exception raised for connection errors."""

    pass


class ZektorAPIClient:
    """Async TCP client for Zektor Audio System (ClarityAudio/ProAudio)."""

    def __init__(
        self,
        host: str,
        port: int = 50005,
        timeout: float = 10,
    ) -> None:
        """Initialize the API client.

        Args:
            host: IP address or hostname
            port: TCP port (default 50005)
            timeout: Command timeout in seconds
        """
        self.host = host
        self.port = port
        self.timeout = timeout
        self._reader: Optional[asyncio.StreamReader] = None
        self._writer: Optional[asyncio.StreamWriter] = None
        self._connected = False
        self._lock = asyncio.Lock()
        self._backoff = 1
        self._callbacks: dict[str, list[Callable]] = {}

    async def connect(self) -> None:
        """Connect to the Zektor device."""
        if self._connected:
            return

        try:
            _LOGGER.debug("Connecting to Zektor at %s:%d", self.host, self.port)
            self._reader, self._writer = await asyncio.wait_for(
                asyncio.open_connection(self.host, self.port),
                timeout=self.timeout,
            )
            self._connected = True
            self._backoff = 1
            _LOGGER.info("Connected to Zektor at %s:%d", self.host, self.port)
        except asyncio.TimeoutError as e:
            raise ZektorConnectionError(
                f"Timeout connecting to {self.host}:{self.port}"
            ) from e
        except (OSError, ConnectionRefusedError) as e:
            raise ZektorConnectionError(
                f"Failed to connect to {self.host}:{self.port}: {e}"
            ) from e

    async def disconnect(self) -> None:
        """Disconnect from the Zektor device."""
        if self._writer:
            try:
                self._writer.close()
                await self._writer.wait_closed()
            except Exception as e:
                _LOGGER.debug("Error closing connection: %s", e)
        self._connected = False
        self._reader = None
        self._writer = None

    async def _send_command(self, command: str) -> None:
        """Send a raw command."""
        if not self._connected:
            raise ZektorConnectionError("Not connected to Zektor device")
        writer = self._writer
        if writer is None:
            raise ZektorConnectionError("Connection writer is not available")

        if not command.startswith("^"):
            command = f"^{command}"
        if not command.endswith("$"):
            command = f"{command}$"

        try:
            _LOGGER.debug("Sending command: %s", command)
            writer.write(command.encode())
            await writer.drain()
        except (BrokenPipeError, ConnectionResetError) as e:
            self._connected = False
            raise ZektorConnectionError(f"Connection lost: {e}") from e

    async def _read_response(self) -> str:
        """Read a response from the device."""
        if not self._connected or not self._reader:
            raise ZektorConnectionError("Not connected to Zektor device")

        try:
            # Read until we get a complete response (ends with $)
            response = await asyncio.wait_for(
                self._reader.readuntil(b"$"),
                timeout=self.timeout,
            )
            response_str = response.decode().strip()
            _LOGGER.debug("Received response: %s", response_str)
            return response_str
        except asyncio.TimeoutError as e:
            self._connected = False
            raise ZektorConnectionError("Timeout waiting for response") from e
        except (asyncio.LimitOverrunError, asyncio.IncompleteReadError) as e:
            self._connected = False
            raise ZektorConnectionError(f"Protocol error: {e}") from e

    async def _read_response_optional(self, timeout: float = 1.5) -> Optional[str]:
        """Read a response without marking the connection dead on timeout."""
        if not self._connected or not self._reader:
            raise ZektorConnectionError("Not connected to Zektor device")

        try:
            response = await asyncio.wait_for(
                self._reader.readuntil(b"$"),
                timeout=timeout,
            )
            response_str = response.decode().strip()
            _LOGGER.debug("Received optional response: %s", response_str)
            return response_str
        except asyncio.TimeoutError:
            return None
        except (asyncio.LimitOverrunError, asyncio.IncompleteReadError) as e:
            self._connected = False
            raise ZektorConnectionError(f"Protocol error: {e}") from e

    def _parse_response(self, response: str) -> dict[str, Any]:
        """Parse a Zektor response."""
        response = response.strip()

        # Remove leading ^ and trailing $
        if response.startswith("^"):
            response = response[1:]
        if response.endswith("$"):
            response = response[:-1]

        # Check for acknowledgment
        if response == "+":
            return {"type": "ack"}

        # Check for error
        if response.startswith("!"):
            try:
                error_code = int(response[1:])
                return {"type": "error", "code": error_code}
            except ValueError:
                pass

        # Check for status response (=COMMAND ...)
        if response.startswith("="):
            response = response[1:]
            parts = response.split()
            if len(parts) >= 1:
                command = parts[0]
                params = " ".join(parts[1:]) if len(parts) > 1 else ""
                return {"type": "status", "command": command, "params": params}

        # Unknown response
        return {"type": "unknown", "raw": response}

    @staticmethod
    def _extract_last_int(params: str) -> Optional[int]:
        """Extract the last integer present in response params."""
        matches = re.findall(r"-?\d+", params)
        if not matches:
            return None
        return int(matches[-1])

    async def send_command_raw(self, command: str) -> dict[str, Any]:
        """Send a command and get the response."""
        async with self._lock:
            try:
                is_query = "?" in command
                await self.connect()
                await self._send_command(command)

                # Read acknowledgment
                response = await self._read_response()
                ack = self._parse_response(response)

                if ack.get("type") == "error":
                    raise ZektorProtocolError(
                        f"Command error: {ack.get('code')}: {command}"
                    )

                # If we got a status immediately, return it
                if ack.get("type") == "status":
                    return ack

                if ack.get("type") == "ack":
                    if not is_query:
                        return {"status": "ok"}

                    # Query commands usually return ACK first, then a status line.
                    status_response = await self._read_response_optional(timeout=1.5)
                    if status_response is None:
                        return {"status": "ok"}

                    status = self._parse_response(status_response)
                    if status.get("type") == "error":
                        raise ZektorProtocolError(
                            f"Command error: {status.get('code')}: {command}"
                        )
                    if status.get("type") == "status":
                        return status

                return {"status": "ok"}

            except ZektorConnectionError:
                self._connected = False
                raise

    async def power_on(self) -> bool:
        """Turn on the device."""
        try:
            result = await self.send_command_raw("P 1")
            return result.get("status") == "ok"
        except ZektorProtocolError as e:
            _LOGGER.error("Failed to power on: %s", e)
            return False

    async def power_off(self) -> bool:
        """Turn off the device."""
        try:
            result = await self.send_command_raw("P 0")
            return result.get("status") == "ok"
        except ZektorProtocolError as e:
            _LOGGER.error("Failed to power off: %s", e)
            return False

    async def power_status(self) -> Optional[int]:
        """Get power status (0=off, 1=on, 3=locked)."""
        try:
            result = await self.send_command_raw("P ?")
            if result.get("type") == "status":
                params = result.get("params", "").strip()
                match = re.search(r"(\d+)$", params)
                if match:
                    return int(match.group(1))
        except (ZektorProtocolError, ValueError) as e:
            _LOGGER.error("Failed to get power status: %s", e)
        return None

    async def set_zone_source(self, zone: int, source: int) -> bool:
        """Set source for a zone.

        Args:
            zone: Zone number (1-64)
            source: Source number (0=disconnect, 1+)
        """
        try:
            result = await self.send_command_raw(f"SZ @{zone},{source}")
            return result.get("status") == "ok"
        except ZektorProtocolError as e:
            _LOGGER.error("Failed to set zone source: %s", e)
            return False

    async def set_zone_digital_source(self, zone: int, source: int) -> bool:
        """Set digital source for a zone using DSZ command."""
        try:
            result = await self.send_command_raw(f"DSZ @{zone},{source}")
            return result.get("status") == "ok"
        except ZektorProtocolError as e:
            _LOGGER.error("Failed to set digital zone source: %s", e)
            return False

    async def set_zone_volume(self, zone: int, volume: int, fade: bool = False) -> bool:
        """Set volume for a zone.

        Args:
            zone: Zone number (1-64)
            volume: Volume level (0-248, 200=0dB)
            fade: Whether to use fade effect
        """
        try:
            if fade:
                volume = volume + 10000
            result = await self.send_command_raw(f"VZ @{zone},{volume}")
            return result.get("status") == "ok"
        except ZektorProtocolError as e:
            _LOGGER.error("Failed to set zone volume: %s", e)
            return False

    async def set_zone_volume_percent(self, zone: int, percent: int) -> bool:
        """Set volume for a zone by percentage (0-100)."""
        try:
            result = await self.send_command_raw(f"VPZ @{zone},{percent}")
            return result.get("status") == "ok"
        except ZektorProtocolError as e:
            _LOGGER.error("Failed to set zone volume percent: %s", e)
            return False

    async def mute_zone(self, zone: int, mute: bool) -> bool:
        """Mute/unmute a zone via volume control.

        Args:
            zone: Zone number (1-64)
            mute: True to mute, False to unmute
        """
        try:
            mute_value = 1 if mute else 0
            result = await self.send_command_raw(f"VMZ @{zone},{mute_value}")
            return result.get("status") == "ok"
        except ZektorProtocolError as e:
            _LOGGER.error("Failed to mute zone: %s", e)
            return False

    async def set_zone_bass(self, zone: int, bass: int) -> bool:
        """Set bass level for a zone.

        Args:
            zone: Zone number (1-64)
            bass: Bass level (88-168, 128=0dB)
        """
        try:
            result = await self.send_command_raw(f"BAZ @{zone},{bass}")
            return result.get("status") == "ok"
        except ZektorProtocolError as e:
            _LOGGER.error("Failed to set zone bass: %s", e)
            return False

    async def set_zone_treble(self, zone: int, treble: int) -> bool:
        """Set treble level for a zone.

        Args:
            zone: Zone number (1-64)
            treble: Treble level (88-168, 128=0dB)
        """
        try:
            result = await self.send_command_raw(f"TRZ @{zone},{treble}")
            return result.get("status") == "ok"
        except ZektorProtocolError as e:
            _LOGGER.error("Failed to set zone treble: %s", e)
            return False

    async def set_zone_balance(self, zone: int, balance: int) -> bool:
        """Set balance for a zone.

        Args:
            zone: Zone number (1-64)
            balance: Balance level (0-400, 200=center)
        """
        try:
            result = await self.send_command_raw(f"BLZ @{zone},{balance}")
            return result.get("status") == "ok"
        except ZektorProtocolError as e:
            _LOGGER.error("Failed to set zone balance: %s", e)
            return False

    async def set_master_volume(self, volume: int) -> bool:
        """Set master volume.

        Args:
            volume: Master volume level (0-248, 200=0dB)
        """
        try:
            result = await self.send_command_raw(f"MV {volume}")
            return result.get("status") == "ok"
        except ZektorProtocolError as e:
            _LOGGER.error("Failed to set master volume: %s", e)
            return False

    async def query_power(self) -> Optional[int]:
        """Query power status."""
        return await self.power_status()

    async def query_zone_source(self, zone: int) -> Optional[int]:
        """Query current source for a zone."""
        try:
            result = await self.send_command_raw(f"SZ @{zone}?")
            if result.get("type") == "status":
                return self._extract_last_int(result.get("params", ""))
        except (ZektorProtocolError, ValueError) as e:
            _LOGGER.debug("Failed to query zone source: %s", e)
        return None

    async def query_zone_digital_source(self, zone: int) -> Optional[int]:
        """Query current digital source for a zone."""
        try:
            result = await self.send_command_raw(f"DSZ @{zone}?")
            if result.get("type") == "status":
                return self._extract_last_int(result.get("params", ""))
        except (ZektorProtocolError, ValueError) as e:
            _LOGGER.debug("Failed to query digital zone source: %s", e)
        return None

    async def query_zone_volume(self, zone: int) -> Optional[int]:
        """Query current volume for a zone."""
        try:
            result = await self.send_command_raw(f"VZ @{zone}?")
            if result.get("type") == "status":
                params = result.get("params", "").split(",")
                if len(params) >= 2:
                    return int(params[1])
        except (ZektorProtocolError, ValueError) as e:
            _LOGGER.debug("Failed to query zone volume: %s", e)
        return None

    async def query_zone_crossover_type(self, zone: int) -> Optional[int]:
        """Query crossover filter type for a zone (FTYPZ 0..5)."""
        try:
            result = await self.send_command_raw(f"FTYPZ @{zone}?")
            if result.get("type") == "status":
                return self._extract_last_int(result.get("params", ""))
        except (ZektorProtocolError, ValueError) as e:
            _LOGGER.debug("Failed to query zone crossover type: %s", e)
        return None

    async def query_zone_crossover_frequency(self, zone: int) -> Optional[int]:
        """Query crossover cutoff frequency index for a zone (FFRQZ 0..32)."""
        try:
            result = await self.send_command_raw(f"FFRQZ @{zone}?")
            if result.get("type") == "status":
                return self._extract_last_int(result.get("params", ""))
        except (ZektorProtocolError, ValueError) as e:
            _LOGGER.debug("Failed to query zone crossover frequency: %s", e)
        return None

    async def detect_zone_capacity(self) -> Optional[int]:
        """Detect the supported zone count using known model capacities.

        Returns the highest detected capacity among common Zektor models.
        """
        candidates = [64, 48, 32, 16, 2, 1]

        for zone_count in candidates:
            try:
                result = await self.send_command_raw(f"SZ @{zone_count}?")
                if result.get("type") in ("status",):
                    return zone_count
                if result.get("status") == "ok":
                    # Some firmwares may ACK query command without returning status immediately.
                    return zone_count
            except (ZektorProtocolError, ZektorConnectionError, ValueError) as err:
                _LOGGER.debug("Zone capacity probe failed for %s zones: %s", zone_count, err)

        return None
