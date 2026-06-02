"""Zektor Audio System - async TCP API client.

Architecture
------------
* Persistent TCP connection with exponential reconnect backoff.
* connect() opens the socket only.
* query_all_state(zones) sends a full query burst (direct read, no listener)
  to warm the live-state cache, then starts a permanent background listener.
* _listen() reads ALL incoming frames continuously:
    - status frame  -> _apply_status() -> _notify() -> HA push update
    - ack / error   -> discarded (only relevant during init)
    - connection loss -> _notify() so HA marks entities unavailable
* SET commands call _send_set() which is fire-and-forget (just writes to TCP).
  The device echoes back the new state; the listener picks it up.
* No periodic polling after init: the listener IS the only state driver.
* detect_zone_capacity() must be called before query_all_state() (no listener).
"""

from __future__ import annotations

import asyncio
import logging
import re
from typing import Any, Callable, Optional

_LOGGER = logging.getLogger(__name__)

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
        self._lock = asyncio.Lock()   # serialises writes
        self._backoff = 1

        # Live state cache - single source of truth.
        self._state: dict[str, Any] = {}

        # Callbacks fired on every state mutation.
        self._state_callbacks: list[Callable[[dict[str, Any]], None]] = []

        # Background listener task.
        self._listener_task: Optional[asyncio.Task] = None

    # ------------------------------------------------------------------ #
    # Public properties                                                    #
    # ------------------------------------------------------------------ #

    @property
    def is_connected(self) -> bool:
        """True if the TCP socket is open."""
        return self._connected

    @property
    def is_listening(self) -> bool:
        """True if the background listener task is alive."""
        return (
            self._listener_task is not None
            and not self._listener_task.done()
        )

    # ------------------------------------------------------------------ #
    # Connection management                                                #
    # ------------------------------------------------------------------ #

    async def connect(self) -> None:
        """Open TCP connection (idempotent). Does NOT start the listener."""
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
        """Stop the listener and close the TCP connection."""
        await self._stop_listener()
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
    # Background listener                                                  #
    # ------------------------------------------------------------------ #

    def _start_listener(self) -> None:
        """Start the persistent background frame-reader (idempotent)."""
        if self.is_listening:
            return
        self._listener_task = asyncio.get_event_loop().create_task(self._listen())
        _LOGGER.info("Zektor: persistent TCP listener started")

    async def _stop_listener(self) -> None:
        """Cancel and await the background listener task."""
        if self._listener_task and not self._listener_task.done():
            self._listener_task.cancel()
            try:
                await self._listener_task
            except asyncio.CancelledError:
                pass
        self._listener_task = None

    async def _listen(self) -> None:
        """Read ALL incoming TCP frames and update live state.

        This is the only code that reads from the socket after init.
        It processes:
          * status frames  -> apply state + fire callbacks
          * ack / unknown  -> discard silently
          * connection loss -> mark disconnected, fire callbacks
        """
        _LOGGER.info("Zektor: listener loop running")
        while self._connected and self._reader:
            try:
                raw = await self._reader.readuntil(b"$")
                frame = raw.decode().strip()
                _LOGGER.debug("RX: %s", frame)
                parsed = self._parse_frame(frame)
                if parsed["type"] == "status":
                    self._apply_and_notify(parsed)
            except asyncio.CancelledError:
                break
            except (
                asyncio.IncompleteReadError,
                ConnectionResetError,
                OSError,
            ) as exc:
                _LOGGER.warning("Zektor: connection lost in listener: %s", exc)
                self._connected = False
                self._notify()   # let HA mark entities unavailable
                break
            except Exception as exc:  # pylint: disable=broad-except
                _LOGGER.error("Zektor: unexpected listener error: %s", exc)
                self._connected = False
                self._notify()
                break
        _LOGGER.info("Zektor: listener loop stopped")

    # ------------------------------------------------------------------ #
    # Callback management                                                  #
    # ------------------------------------------------------------------ #

    def register_state_callback(
        self, callback: Callable[[dict[str, Any]], None]
    ) -> None:
        """Register a function called with full state on every change."""
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
        """Fire all registered callbacks with a snapshot of current state."""
        snapshot = dict(self._state)
        for cb in self._state_callbacks:
            try:
                cb(snapshot)
            except Exception:  # pylint: disable=broad-except
                _LOGGER.exception("State callback raised an exception")

    # ------------------------------------------------------------------ #
    # Low-level I/O (direct read/write - only during init, no listener)   #
    # ------------------------------------------------------------------ #

    async def _send_raw(self, command: str) -> None:
        """Send a framed command. Caller must hold self._lock."""
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

    async def _read_frame_direct(self, hard_timeout: Optional[float] = None) -> str:
        """Read one frame directly (init only - listener must not be running)."""
        if not self._connected or self._reader is None:
            raise ZektorConnectionError("Not connected")
        try:
            raw = await asyncio.wait_for(
                self._reader.readuntil(b"$"),
                timeout=hard_timeout if hard_timeout is not None else self.timeout,
            )
            frame = raw.decode().strip()
            _LOGGER.debug("RX (init): %s", frame)
            return frame
        except asyncio.TimeoutError as exc:
            raise ZektorConnectionError("Read timeout") from exc
        except (asyncio.LimitOverrunError, asyncio.IncompleteReadError) as exc:
            self._connected = False
            raise ZektorConnectionError(f"Protocol error: {exc}") from exc

    # ------------------------------------------------------------------ #
    # Frame parsing                                                        #
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
        """Apply a status frame to state and notify if changed."""
        if self._apply_status(parsed):
            self._notify()

    def state_as_coordinator_data(self, zones: int) -> dict[str, Any]:
        """Convert internal _state to coordinator-format dict."""
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
    # Init-time query (direct I/O, listener must NOT be running)          #
    # ------------------------------------------------------------------ #

    async def _query_init(self, command: str) -> Optional[dict[str, Any]]:
        """Send one query and read ACK + status directly (init only).

        Caller must hold self._lock.
        """
        await self._send_raw(command)

        # First frame: ACK or status (some devices skip ACK)
        first = self._parse_frame(await self._read_frame_direct())
        if first["type"] == "error":
            raise ZektorProtocolError(f"Device error for: {command}")
        if first["type"] == "status":
            return first

        # ACK received -> read the actual status frame
        if first["type"] == "ack":
            try:
                second = self._parse_frame(
                    await self._read_frame_direct(hard_timeout=2.0)
                )
                if second["type"] == "status":
                    return second
            except ZektorConnectionError as exc:
                _LOGGER.debug("No status after ACK for %s: %s", command, exc)

        return None

    # ------------------------------------------------------------------ #
    # Full state query (called once at connect, before listener starts)   #
    # ------------------------------------------------------------------ #

    async def query_all_state(self, zones: int) -> dict[str, Any]:
        """Query every variable for every zone, warm the cache, start listener.

        The listener must NOT be running when this is called.
        After the dump completes the listener is started automatically.
        """
        _LOGGER.info("Zektor: querying full state for %d zones", zones)

        # Safety: stop listener if somehow alive (e.g. reconnect path)
        await self._stop_listener()

        async with self._lock:
            # -- Power -------------------------------------------------- #
            try:
                result = await self._query_init("P ?")
                if result:
                    self._apply_status(result)
            except (ZektorProtocolError, ZektorConnectionError) as exc:
                _LOGGER.debug("Init query P ? failed: %s", exc)

            # -- All zones ---------------------------------------------- #
            zone_queries = [
                "SZ @{z}?",
                "DSZ @{z}?",
                "VZ @{z}?",
                "VMZ @{z}?",
                "BAZ @{z}?",
                "TRZ @{z}?",
                "BLZ @{z}?",
                "FTYPZ @{z}?",
                "FFRQZ @{z}?",
            ]
            for zone in range(1, zones + 1):
                zk = f"zone_{zone}"
                if zk not in self._state:
                    self._state[zk] = {"zone": zone}
                for tmpl in zone_queries:
                    cmd = tmpl.format(z=zone)
                    try:
                        result = await self._query_init(cmd)
                        if result:
                            self._apply_status(result)
                    except (ZektorProtocolError, ZektorConnectionError) as exc:
                        _LOGGER.debug("Init query %s failed: %s", cmd, exc)
                _LOGGER.debug(
                    "Zektor init: zone %d -> %s", zone, self._state.get(zk, {})
                )

        _LOGGER.info("Zektor: full state loaded, starting persistent listener")
        self._start_listener()
        return self.state_as_coordinator_data(zones)

    # ------------------------------------------------------------------ #
    # SET commands (fire-and-forget after listener is running)            #
    # ------------------------------------------------------------------ #

    async def _send_set(self, command: str) -> bool:
        """Send a SET command.

        Fire-and-forget: the listener will read the echo and update state.
        Reconnects automatically if the connection was lost.
        """
        if not self._connected:
            try:
                await self.connect()
            except ZektorConnectionError as exc:
                _LOGGER.error("Cannot send %s: not connected: %s", command, exc)
                return False
        try:
            async with self._lock:
                await self._send_raw(command)
            return True
        except ZektorConnectionError as exc:
            _LOGGER.error("Send failed (%s): %s", command, exc)
            return False

    # ------------------------------------------------------------------ #
    # Power                                                                #
    # ------------------------------------------------------------------ #

    async def power_on(self) -> bool:
        return await self._send_set("P 1")

    async def power_off(self) -> bool:
        return await self._send_set("P 0")

    async def query_power(self) -> Optional[int]:
        """Return cached power state (live cache, no TCP query)."""
        return self._state.get("power")

    # ------------------------------------------------------------------ #
    # Zone source                                                          #
    # ------------------------------------------------------------------ #

    async def set_zone_source(self, zone: int, source: int) -> bool:
        return await self._send_set(f"SZ @{zone},{source}")

    async def set_zone_digital_source(self, zone: int, source: int) -> bool:
        return await self._send_set(f"DSZ @{zone},{source}")

    async def query_zone_source(self, zone: int) -> Optional[int]:
        return self._state.get(f"zone_{zone}", {}).get("source")

    async def query_zone_digital_source(self, zone: int) -> Optional[int]:
        return self._state.get(f"zone_{zone}", {}).get("digital_source")

    # ------------------------------------------------------------------ #
    # Zone volume                                                          #
    # ------------------------------------------------------------------ #

    async def set_zone_volume(self, zone: int, volume: int, fade: bool = False) -> bool:
        raw = volume + 10000 if fade else volume
        return await self._send_set(f"VZ @{zone},{raw}")

    async def set_zone_volume_percent(self, zone: int, percent: int) -> bool:
        return await self._send_set(f"VPZ @{zone},{percent}")

    async def query_zone_volume(self, zone: int) -> Optional[int]:
        return self._state.get(f"zone_{zone}", {}).get("volume")

    # ------------------------------------------------------------------ #
    # Zone mute                                                            #
    # ------------------------------------------------------------------ #

    async def mute_zone(self, zone: int, mute: bool) -> bool:
        return await self._send_set(f"VMZ @{zone},{1 if mute else 0}")

    async def query_zone_mute(self, zone: int) -> Optional[int]:
        return self._state.get(f"zone_{zone}", {}).get("mute")

    # ------------------------------------------------------------------ #
    # Zone EQ                                                              #
    # ------------------------------------------------------------------ #

    async def set_zone_bass(self, zone: int, bass: int) -> bool:
        return await self._send_set(f"BAZ @{zone},{bass}")

    async def set_zone_treble(self, zone: int, treble: int) -> bool:
        return await self._send_set(f"TRZ @{zone},{treble}")

    async def set_zone_balance(self, zone: int, balance: int) -> bool:
        return await self._send_set(f"BLZ @{zone},{balance}")

    async def query_zone_bass(self, zone: int) -> Optional[int]:
        return self._state.get(f"zone_{zone}", {}).get("bass")

    async def query_zone_treble(self, zone: int) -> Optional[int]:
        return self._state.get(f"zone_{zone}", {}).get("treble")

    async def query_zone_balance(self, zone: int) -> Optional[int]:
        return self._state.get(f"zone_{zone}", {}).get("balance")

    # ------------------------------------------------------------------ #
    # Zone crossover                                                       #
    # ------------------------------------------------------------------ #

    async def set_zone_crossover_type(self, zone: int, ftype: int) -> bool:
        return await self._send_set(f"FTYPZ @{zone},{ftype}")

    async def set_zone_crossover_frequency(self, zone: int, freq_index: int) -> bool:
        return await self._send_set(f"FFRQZ @{zone},{freq_index}")

    async def query_zone_crossover_type(self, zone: int) -> Optional[int]:
        return self._state.get(f"zone_{zone}", {}).get("crossover_type")

    async def query_zone_crossover_frequency(self, zone: int) -> Optional[int]:
        return self._state.get(f"zone_{zone}", {}).get("crossover_frequency")

    # ------------------------------------------------------------------ #
    # Master volume                                                        #
    # ------------------------------------------------------------------ #

    async def set_master_volume(self, volume: int) -> bool:
        return await self._send_set(f"MV {volume}")

    # ------------------------------------------------------------------ #
    # Zone detection (must run before query_all_state / listener)         #
    # ------------------------------------------------------------------ #

    async def detect_zone_capacity(self) -> Optional[int]:
        """Probe the device to find its maximum supported zone count.

        Must be called before query_all_state() (no listener running).
        """
        async with self._lock:
            for candidate in (64, 48, 32, 16, 8, 4, 2):
                try:
                    await self._send_raw(f"SZ @{candidate}?")
                    parsed = self._parse_frame(
                        await self._read_frame_direct(hard_timeout=2.0)
                    )
                    if parsed.get("type") in ("status", "ack"):
                        # Drain possible second frame
                        try:
                            await self._read_frame_direct(hard_timeout=1.0)
                        except ZektorConnectionError:
                            pass
                        _LOGGER.info("Zektor zone capacity: %d", candidate)
                        return candidate
                except (ZektorProtocolError, ZektorConnectionError) as exc:
                    _LOGGER.debug("Zone probe %d failed: %s", candidate, exc)
        return None
