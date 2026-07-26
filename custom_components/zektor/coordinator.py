"""Data update coordinator for Zektor Audio System.

Design
------
* On first _async_update_data: connect + query_all_state() (full TCP dump,
  populates live-state cache, starts the persistent listener).
* After init: all updates are PUSH-driven via the API listener callback.
  The coordinator is essentially idle.
* update_interval = 5 min acts as a reconnect heartbeat only:
  - If connected + listening: return current cached state immediately.
  - If disconnected (listener died): reconnect + full dump + restart listener.
"""

from __future__ import annotations

import logging
from datetime import timedelta
from typing import Any

from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import ZektorAPIClient, ZektorConnectionError, ZektorProtocolError
from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

HEARTBEAT_INTERVAL = 300   # 5 min reconnect heartbeat


class ZektorDataUpdateCoordinator(DataUpdateCoordinator):
    """Push-driven coordinator for the Zektor integration."""

    def __init__(
        self,
        hass: HomeAssistant,
        host: str,
        port: int,
        zones: int,
    ) -> None:
        """Initialize coordinator."""
        super().__init__(
            hass,
            _LOGGER,
            name=DOMAIN,
            update_interval=timedelta(seconds=HEARTBEAT_INTERVAL),
        )
        self.api = ZektorAPIClient(host, port)
        self.zones = zones
        self._initialized = False
        self.api.register_state_callback(self._on_api_state_change)

    @callback
    def _on_api_state_change(self, _raw_state: dict[str, Any]) -> None:
        """Called by the API listener on every TCP state frame.

        Converts the live cache to coordinator format and pushes it to HA
        without waiting for the next poll.
        """
        data = self.api.state_as_coordinator_data(self.zones)
        self.async_set_updated_data(data)
        _LOGGER.debug("Zektor: push update from TCP listener")

    async def _async_update_data(self) -> dict[str, Any]:
        """Heartbeat: reconnect if needed, otherwise return cached state."""
        # Already connected and listener is alive -> nothing to do.
        if self._initialized and self.api.is_connected and self.api.is_listening:
            _LOGGER.debug("Zektor: heartbeat OK (listener alive, returning cache)")
            return self.api.state_as_coordinator_data(self.zones)

        # First start or reconnect path.
        _LOGGER.info(
            "Zektor: %s - connecting and loading full state",
            "initial connect" if not self._initialized else "reconnect",
        )
        try:
            await self.api.connect()
            data = await self.api.query_all_state(self.zones)
            self._initialized = True
            _LOGGER.info("Zektor: fully initialized, listener running")
            return data
        except ZektorConnectionError as exc:
            self._initialized = False
            _LOGGER.error("Zektor connection error: %s", exc)
            raise UpdateFailed(f"Connection failed: {exc}") from exc
        except ZektorProtocolError as exc:
            _LOGGER.error("Zektor protocol error: %s", exc)
            raise UpdateFailed(f"Protocol error: {exc}") from exc
        except Exception as exc:  # pylint: disable=broad-except
            _LOGGER.error("Zektor unexpected error: %s", exc)
            raise UpdateFailed(f"Unexpected error: {exc}") from exc

    async def async_shutdown(self) -> None:
        """Clean up on HA stop or integration unload."""
        self.api.unregister_state_callback(self._on_api_state_change)
        await self.api.disconnect()
        _LOGGER.info("Zektor: coordinator shut down")
