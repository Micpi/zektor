"""Data update coordinator for Zektor Audio System.

Design
------
* On first _async_update_data call: performs a full query of all zones via
  api.query_all_state(zones) to warm the live state cache.
* The API client fires _on_api_state_change on every SET echo received over
  TCP, which calls async_set_updated_data() immediately - no poll needed.
* The coordinator poll interval is 60 s and serves only as a safety net
  reconcile (e.g. after a reconnect or external state change).
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

RECONCILE_INTERVAL = 60


class ZektorDataUpdateCoordinator(DataUpdateCoordinator):
    """Zektor data update coordinator."""

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
            update_interval=timedelta(seconds=RECONCILE_INTERVAL),
        )
        self.api = ZektorAPIClient(host, port)
        self.zones = zones
        self._initialized = False
        self.api.register_state_callback(self._on_api_state_change)

    @callback
    def _on_api_state_change(self, raw_state: dict[str, Any]) -> None:
        """Called by the API client immediately after any TCP state echo."""
        data = self.api.state_as_coordinator_data(self.zones)
        self.async_set_updated_data(data)
        _LOGGER.debug("Zektor push update received from TCP echo")

    async def _async_update_data(self) -> dict[str, Any]:
        """Fetch data from device (full init on first call, reconcile after)."""
        try:
            await self.api.connect()
            if not self._initialized:
                _LOGGER.info("Zektor: performing initial full state query")
                data = await self.api.query_all_state(self.zones)
                self._initialized = True
                _LOGGER.info("Zektor: initial state loaded successfully")
            else:
                _LOGGER.debug("Zektor: reconcile poll (safety net)")
                data = await self.api.query_all_state(self.zones)
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
        """Unregister callbacks and close connection on shutdown."""
        self.api.unregister_state_callback(self._on_api_state_change)
        await self.api.disconnect()
        await super().async_shutdown()
