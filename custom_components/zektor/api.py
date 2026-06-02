"""Zektor Audio System – async TCP API client.

Architecture
------------
* Persistent TCP connection with reconnect backoff.
* Internal live-state cache (_state) updated after every command response.
* After each SET command the device echoes the new state (e.g. ^=SZ @1,38$).
  We read that echo immediately so the in-memory state is always current.
* Registered callbacks are fired after any state change, allowing the
  coordinator to push updates to Home Assistant without waiting for a poll.
* query_all_state(zones) performs a full dump of every variable on all zones -
  called once at connection to warm the cache.
"""

from __future__ import annotations

import asyncio
import logging
import re
from typing import Any, Callable, Optional

_LOGGER = logging.getLogger(__name__)

# Map of Zektor TCP command tokens to coordinator zone-dict field names.
_CMD_TO_FIELD: dict[str, str] = {
    "SZ": "source",
    "DSZ": "digital_source",
    "VZ": "volume",
    "VMZ": "mute",
    "BAZ": "bass",
    "TRZ": "treble",
    "BLZ": "balance",
    "FTYPZ": "crossover_type",
    "FFRQZ": "crossover_frequency",
    "GAZ": "gain",
}


class ZektorProtocolError(Exception):
    """Raised when the device returns an error code."""


class ZektorConnectionError(Exception):
    """Raised when the TCP connection fails or drops."""


class ZektorAPIClient:
    """Async TCP client for Zektor ProAudio / ClarityAudio systems."""

    def __init__(
        self,
        host: str,
        port: int = 50005,
        timeout: float = 10.0,
    ) -> None:
        self.host = host
        self.port = port
        self.timeout = timeout

        self._reader: Optional[asyncio.StreamReader] = None
        self._writer: Optional[asyncio.StreamWriter] = None
        self._connected = False
        self._lock = asyncio.Lock()
        self._backoff = 1

        # Live state – single source of truth.
        self._state: dict[str, Any] = {}

        # Callbacks fired on every state mutation.
        self._state_callbacks: list[Callable[[dict[str, Any]], None]] = []

    # ------------------------------------------------------------------ #
    # Connection management                                                #
    # ------------------------------------------------------------------ #

    async def connect(self) -> None:
        """Open TCP connection (idempotent)."""
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
        except asyncio.TimeoutError as exc:
            raise ZektorConnectionError(
                f"Timeout connecting to {self.host}:{self.port}"
            ) from exc
        except (OSError, ConnectionRefusedError) as exc:
            raise ZektorConnectionError(
                f"Cannot connect to {self.host}:{self.port}: {exc}"
            ) from exc

    async def disconnect(self) -> None:
        """Close TCP connection."""
        if self._writer:
            try:
                self._writer.close()
                await self._writer.wait_closed()
            except (OSError, RuntimeError) as exc:
                _LOGGER.debug("Error closing connection: %s", exc)
        self._connected = False
        self._reader = None
        self._writer = None

    # ------------------------------------------------------------------ #
    # Callback registration                                                #
    # ------------------------------------------------------------------ #

    def register_state_callback(
        self, callback: Callable[[dict[str, Any]], None]
    ) -> None:
        """Register a function called with the full state dict on every change."""
        if callback not in self._state_callbacks:
            self._state_callbacks.append(callback)

    def unregister_state_callback(
        self, callback: Callable[[dict[str, Any]], None]
    ) -> None:
        """Remove a previously registered callback."""
        try:
            self._state_callbacks.remove(callback)
        except ValueError:
            pass

    def _notify(self) -> None:
        """Fire all registered state callbacks with a copy of current state."""
        snapshot = dict(self._state)
        for cb in self._state_callbacks:
            try:
                cb(snapshot)
            except Exception:  # pylint: disable=broad-except
                _LOGGER.exception("State callback raised an exception")

    # ------------------------------------------------------------------ #
    # Low-level protocol                                                   #
    # ------------------------------------------------------------------ #

    async def _send_raw(self, command: str) -> None:
        """Send a framed command over TCP."""
        if not self._connected or self._writer is None:
            raise ZektorConnectionError("Not connected")

        if not command.startswith("^"):
            command = f"^{command}"
        if not command.endswith("$"):
            command = f"{command}$"

        try:
            _LOGGER.debug("TX: %s", command)
            self._writer.write(command.encode())
            await self._writer.drain()
        except (BrokenPipeError, ConnectionResetError) as exc:
            self._connected = False
            raise ZektorConnectionError(f"Connection lost during send: {exc}") from exc

    async def _read_frame(self, hard_timeout: Optional[float] = None) -> str:
        """Read one complete Zektor frame (ends with $)."""
        if not self._connected or self._reader is None:
            raise ZektorConnectionError("Not connected")

        try:
            raw = await asyncio.wait_for(
                self._reader.readuntil(b"$"),
                timeout=hard_timeout if hard_timeout is not None else self.timeout,
            )
            frame = raw.decode().strip()
            _LOGGER.debug("RX: %s", frame)
            return frame
        except asyncio.TimeoutError as exc:
            raise ZektorConnectionError("Read timeout") from exc
        except (asyncio.LimitOverrunError, asyncio.IncompleteReadError) as exc:
            self._connected = False
            raise ZektorConnectionError(f"Protocol error: {exc}") from exc

    async def _try_read_frame(self, timeout: float = 0.5) -> Optional[str]:
        """Read one frame with a short timeout; return None on timeout (non-fatal)."""
        if not self._connected or self._reader is None:
            return None
        try:
            raw = await asyncio.wait_for(
                self._reader.readuntil(b"$"),
                timeout=timeout,
            )
            frame = raw.decode().strip()
            _LOGGER.debug("RX (opt): %s", frame)
            return frame
        except asyncio.TimeoutError:
            return None
        except (asyncio.LimitOverrunError, asyncio.IncompleteReadError) as exc:
            self._connected = False
            _LOGGER.debug("Protocol error on optional read: %s", exc)
            return None

    # ------------------------------------------------------------------ #
    # Response parsing                                                     #
    # ------------------------------------------------------------------ #

    @staticmethod
    def _parse_frame(frame: str) -> dict[str, Any]:
        """Parse a raw Zektor frame into a structured dict."""
        s = frame.strip().lstrip("^").rstrip("$")

        if s == "+":
            return {"type": "ack"}

        if s.startswith("!"):
            try:
                return {"type": "error", "code": int(s[1:])}
            except ValueError:
                pass

        if s.startswith("="):
            parts = s[1:].split(None, 1)
            command = parts[0] if parts else ""
            params = parts[1] if len(parts) > 1 else ""
            return {"type": "status", "command": command, "params": params}

        return {"type": "unknown", "raw": s}

    @staticmethod
    def _extract_last_int(text: str) -> Optional[int]:
        """Return the last integer (possibly negative) found in text."""
        matches = re.findall(r"-?\d+", text)
        return int(matches[-1]) if matches else None

    # ------------------------------------------------------------------ #
    # State management                                                     #
    # ------------------------------------------------------------------ #

    def _apply_status(self, parsed: dict[str, Any]) -> bool:
        """Update _state from a parsed status frame. Returns True if changed."""
        if parsed.get("type") != "status":
            return False

        cmd = parsed.get("command", "").upper()
        params = parsed.get("params", "")
        changed = False

        if cmd == "P":
            val = self._extract_last_int(params)
            if val is not None and self._state.get("power") != val:
                self._state["power"] = val
                changed = True
            return changed

        m = re.match(r"@(\d+),\s*(-?\d+)", params.strip())
        if m and cmd in _CMD_TO_FIELD:
            zone = int(m.group(1))
            val = int(m.group(2))
            zk = f"zone_{zone}"
            if zk not in self._state:
                self._state[zk] = {"zone": zone}
            field = _CMD_TO_FIELD[cmd]
            if self._state[zk].get(field) != val:
                self._state[zk][field] = val
                changed = True

        return changed

    def _apply_and_notify(self, parsed: dict[str, Any]) -> None:
        """Apply status to state and fire callbacks if something changed."""
        if self._apply_status(parsed):
            self._notify()

    def state_as_coordinator_data(self, zones: int) -> dict[str, Any]:
        """Convert internal _state into coordinator-format dict."""
        zones_dict: dict[str, Any] = {}
        for z in range(1, zones + 1):
            zk = f"zone_{z}"
            cached = self._state.get(zk, {})
            zones_dict[zk] = {
                "zone": z,
                "source": cached.get("source"),
                "digital_source": cached.get("digital_source"),
                "volume": cached.get("volume"),
                "mute": cached.get("mute"),
                "bass": cached.get("bass", 128),
                "treble": cached.get("treble", 128),
                "balance": cached.get("balance", 200),
                "crossover_type": cached.get("crossover_type"),
                "crossover_frequency": cached.get("crossover_frequency"),
            }
        return {"power": self._state.get("power"), "zones": zones_dict}

    # ------------------------------------------------------------------ #
    # Command primitive                                                    #
    # ------------------------------------------------------------------ #

    async def _execute(self, command: str) -> dict[str, Any]:
        """Send command, read ACK + optional echo, return result.

        For query commands (containing ?): read ACK then mandatory status.
        For set commands: read ACK then try to drain the echoed state frame.
        The echoed frame updates _state and fires callbacks immediately.
        """
        async with self._lock:
            try:
                is_query = "?" in command
                await self.connect()
                await self._send_raw(command)

                first = self._parse_frame(await self._read_frame())

                if first["type"] == "error":
                    raise ZektorProtocolError(
                        f"Device error {first.get('code')} for: {command}"
                    )

                if first["type"] == "status":
                    self._apply_and_notify(first)
                    return first

                if first["type"] == "ack":
                    if is_query:
                        second_frame = await self._try_read_frame(timeout=2.0)
                        if second_frame:
                            second = self._parse_frame(second_frame)
                            if second["type"] == "error":
                                raise ZektorProtocolError(
                                    f"Device error {second.get('code')} for: {command}"
                                )
                            if second["type"] == "status":
                                self._apply_and_notify(second)
                                return second
                    else:
                        # SET: drain the echoed state frame to keep buffer clean.
                        echo_frame = await self._try_read_frame(timeout=0.5)
                        if echo_frame:
                            echo = self._parse_frame(echo_frame)
                            if echo["type"] == "status":
                                self._apply_and_notify(echo)
                                return echo
                    return {"type": "ack", "status": "ok"}

            except ZektorConnectionError:
                self._connected = False
                raise

        return {"type": "unknown"}

    # ------------------------------------------------------------------ #
    # Full state query (called once at connection)                        #
    # ------------------------------------------------------------------ #

    async def query_all_state(self, zones: int) -> dict[str, Any]:
        """Query every variable for every zone and warm the state cache."""
        _LOGGER.debug("Zektor: full state query for %d zones", zones)

        self._state["power"] = await self.query_power()

        for zone in range(1, zones + 1):
            zk = f"zone_{zone}"
            self._state[zk] = {
                "zone": zone,
                "source": await self.query_zone_source(zone),
                "digital_source": await self.query_zone_digital_source(zone),
                "volume": await self.query_zone_volume(zone),
                "mute": await self.query_zone_mute(zone),
                "bass": await self.query_zone_bass(zone),
                "treble": await self.query_zone_treble(zone),
                "balance": await self.query_zone_balance(zone),
                "crossover_type": await self.query_zone_crossover_type(zone),
                "crossover_frequency": await self.query_zone_crossover_frequency(zone),
            }
            _LOGGER.debug("Zone %d loaded: %s", zone, self._state[zk])

        _LOGGER.info("Zektor: full state loaded (%d zones)", zones)
        return self.state_as_coordinator_data(zones)

    # ------------------------------------------------------------------ #
    # Power                                                                #
    # ------------------------------------------------------------------ #

    async def power_on(self) -> bool:
        try:
            await self._execute("P 1")
            return True
        except (ZektorProtocolError, ZektorConnectionError) as exc:
            _LOGGER.error("power_on failed: %s", exc)
            return False

    async def power_off(self) -> bool:
        try:
            await self._execute("P 0")
            return True
        except (ZektorProtocolError, ZektorConnectionError) as exc:
            _LOGGER.error("power_off failed: %s", exc)
            return False

    async def query_power(self) -> Optional[int]:
        try:
            result = await self._execute("P ?")
            if result.get("type") == "status":
                return self._extract_last_int(result.get("params", ""))
        except (ZektorProtocolError, ZektorConnectionError) as exc:
            _LOGGER.debug("query_power failed: %s", exc)
        return None

    # ------------------------------------------------------------------ #
    # Zone source                                                          #
    # ------------------------------------------------------------------ #

    async def set_zone_source(self, zone: int, source: int) -> bool:
        try:
            await self._execute(f"SZ @{zone},{source}")
            return True
        except (ZektorProtocolError, ZektorConnectionError) as exc:
            _LOGGER.error("set_zone_source z%d failed: %s", zone, exc)
            return False

    async def set_zone_digital_source(self, zone: int, source: int) -> bool:
        try:
            await self._execute(f"DSZ @{zone},{source}")
            return True
        except (ZektorProtocolError, ZektorConnectionError) as exc:
            _LOGGER.error("set_zone_digital_source z%d failed: %s", zone, exc)
            return False

    async def query_zone_source(self, zone: int) -> Optional[int]:
        try:
            result = await self._execute(f"SZ @{zone}?")
            if result.get("type") == "status":
                return self._extract_last_int(result.get("params", ""))
        except (ZektorProtocolError, ZektorConnectionError) as exc:
            _LOGGER.debug("query_zone_source z%d failed: %s", zone, exc)
        return None

    async def query_zone_digital_source(self, zone: int) -> Optional[int]:
        try:
            result = await self._execute(f"DSZ @{zone}?")
            if result.get("type") == "status":
                return self._extract_last_int(result.get("params", ""))
        except (ZektorProtocolError, ZektorConnectionError) as exc:
            _LOGGER.debug("query_zone_digital_source z%d failed: %s", zone, exc)
        return None

    # ------------------------------------------------------------------ #
    # Zone volume                                                          #
    # ------------------------------------------------------------------ #

    async def set_zone_volume(self, zone: int, volume: int, fade: bool = False) -> bool:
        try:
            raw = volume + 10000 if fade else volume
            await self._execute(f"VZ @{zone},{raw}")
            return True
        except (ZektorProtocolError, ZektorConnectionError) as exc:
            _LOGGER.error("set_zone_volume z%d failed: %s", zone, exc)
            return False

    async def set_zone_volume_percent(self, zone: int, percent: int) -> bool:
        try:
            await self._execute(f"VPZ @{zone},{percent}")
            return True
        except (ZektorProtocolError, ZektorConnectionError) as exc:
            _LOGGER.error("set_zone_volume_percent z%d failed: %s", zone, exc)
            return False

    async def query_zone_volume(self, zone: int) -> Optional[int]:
        try:
            result = await self._execute(f"VZ @{zone}?")
            if result.get("type") == "status":
                return self._extract_last_int(result.get("params", ""))
        except (ZektorProtocolError, ZektorConnectionError) as exc:
            _LOGGER.debug("query_zone_volume z%d failed: %s", zone, exc)
        return None

    # ------------------------------------------------------------------ #
    # Zone mute                                                            #
    # ------------------------------------------------------------------ #

    async def mute_zone(self, zone: int, mute: bool) -> bool:
        try:
            await self._execute(f"VMZ @{zone},{1 if mute else 0}")
            return True
        except (ZektorProtocolError, ZektorConnectionError) as exc:
            _LOGGER.error("mute_zone z%d failed: %s", zone, exc)
            return False

    async def query_zone_mute(self, zone: int) -> Optional[int]:
        try:
            result = await self._execute(f"VMZ @{zone}?")
            if result.get("type") == "status":
                return self._extract_last_int(result.get("params", ""))
        except (ZektorProtocolError, ZektorConnectionError) as exc:
            _LOGGER.debug("query_zone_mute z%d failed: %s", zone, exc)
        return None

    # ------------------------------------------------------------------ #
    # Zone EQ                                                              #
    # ------------------------------------------------------------------ #

    async def set_zone_bass(self, zone: int, bass: int) -> bool:
        try:
            await self._execute(f"BAZ @{zone},{bass}")
            return True
        except (ZektorProtocolError, ZektorConnectionError) as exc:
            _LOGGER.error("set_zone_bass z%d failed: %s", zone, exc)
            return False

    async def set_zone_treble(self, zone: int, treble: int) -> bool:
        try:
            await self._execute(f"TRZ @{zone},{treble}")
            return True
        except (ZektorProtocolError, ZektorConnectionError) as exc:
            _LOGGER.error("set_zone_treble z%d failed: %s", zone, exc)
            return False

    async def set_zone_balance(self, zone: int, balance: int) -> bool:
        try:
            await self._execute(f"BLZ @{zone},{balance}")
            return True
        except (ZektorProtocolError, ZektorConnectionError) as exc:
            _LOGGER.error("set_zone_balance z%d failed: %s", zone, exc)
            return False

    async def query_zone_bass(self, zone: int) -> Optional[int]:
        try:
            result = await self._execute(f"BAZ @{zone}?")
            if result.get("type") == "status":
                return self._extract_last_int(result.get("params", ""))
        except (ZektorProtocolError, ZektorConnectionError) as exc:
            _LOGGER.debug("query_zone_bass z%d failed: %s", zone, exc)
        return None

    async def query_zone_treble(self, zone: int) -> Optional[int]:
        try:
            result = await self._execute(f"TRZ @{zone}?")
            if result.get("type") == "status":
                return self._extract_last_int(result.get("params", ""))
        except (ZektorProtocolError, ZektorConnectionError) as exc:
            _LOGGER.debug("query_zone_treble z%d failed: %s", zone, exc)
        return None

    async def query_zone_balance(self, zone: int) -> Optional[int]:
        try:
            result = await self._execute(f"BLZ @{zone}?")
            if result.get("type") == "status":
                return self._extract_last_int(result.get("params", ""))
        except (ZektorProtocolError, ZektorConnectionError) as exc:
            _LOGGER.debug("query_zone_balance z%d failed: %s", zone, exc)
        return None

    # ------------------------------------------------------------------ #
    # Zone crossover                                                       #
    # ------------------------------------------------------------------ #

    async def set_zone_crossover_type(self, zone: int, ftype: int) -> bool:
        try:
            await self._execute(f"FTYPZ @{zone},{ftype}")
            return True
        except (ZektorProtocolError, ZektorConnectionError) as exc:
            _LOGGER.error("set_zone_crossover_type z%d failed: %s", zone, exc)
            return False

    async def set_zone_crossover_frequency(self, zone: int, freq_index: int) -> bool:
        try:
            await self._execute(f"FFRQZ @{zone},{freq_index}")
            return True
        except (ZektorProtocolError, ZektorConnectionError) as exc:
            _LOGGER.error("set_zone_crossover_freq z%d failed: %s", zone, exc)
            return False

    async def query_zone_crossover_type(self, zone: int) -> Optional[int]:
        try:
            result = await self._execute(f"FTYPZ @{zone}?")
            if result.get("type") == "status":
                return self._extract_last_int(result.get("params", ""))
        except (ZektorProtocolError, ZektorConnectionError) as exc:
            _LOGGER.debug("query_zone_crossover_type z%d failed: %s", zone, exc)
        return None

    async def query_zone_crossover_frequency(self, zone: int) -> Optional[int]:
        try:
            result = await self._execute(f"FFRQZ @{zone}?")
            if result.get("type") == "status":
                return self._extract_last_int(result.get("params", ""))
        except (ZektorProtocolError, ZektorConnectionError) as exc:
            _LOGGER.debug("query_zone_crossover_freq z%d failed: %s", zone, exc)
        return None

    # ------------------------------------------------------------------ #
    # Master volume                                                        #
    # ------------------------------------------------------------------ #

    async def set_master_volume(self, volume: int) -> bool:
        try:
            await self._execute(f"MV {volume}")
            return True
        except (ZektorProtocolError, ZektorConnectionError) as exc:
            _LOGGER.error("set_master_volume failed: %s", exc)
            return False

    # ------------------------------------------------------------------ #
    # Zone detection                                                       #
    # ------------------------------------------------------------------ #

    async def detect_zone_capacity(self) -> Optional[int]:
        """Probe the device to find its maximum supported zone count."""
        for candidate in (64, 48, 32, 16, 8, 4, 2):
            try:
                result = await self._execute(f"SZ @{candidate}?")
                if result.get("type") in ("status", "ack"):
                    _LOGGER.info("Zektor zone capacity: %d", candidate)
                    return candidate
            except (ZektorProtocolError, ZektorConnectionError) as exc:
                _LOGGER.debug("Zone probe %d failed: %s", candidate, exc)
        return None
