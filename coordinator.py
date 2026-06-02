"""Data update coordinator for Zektor Audio System."""

import asyncio
import logging
from datetime import timedelta
from typing import Any, Optional

from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import ZektorAPIClient, ZektorConnectionError, ZektorProtocolError
from .const import DOMAIN, DEFAULT_SCAN_INTERVAL

_LOGGER = logging.getLogger(__name__)


class ZektorDataUpdateCoordinator(DataUpdateCoordinator):
    """Zektor data update coordinator."""

    def __init__(
        self,
        hass: HomeAssistant,
        host: str,
        port: int,
        zones: int,
    ) -> None:
        """Initialize the coordinator."""
        super().__init__(
            hass,
            _LOGGER,
            name=DOMAIN,
            update_interval=timedelta(seconds=DEFAULT_SCAN_INTERVAL),
        )
        self.api = ZektorAPIClient(host, port)
        self.zones = zones
        self._last_error = None

    async def _async_update_data(self) -> dict[str, Any]:
        """Fetch data from the device."""
        try:
            await self.api.connect()

            # Query power status
            power = await self.api.query_power()

            # Query zone data
            zones_data = {}
            for zone_num in range(1, self.zones + 1):
                zone_key = f"zone_{zone_num}"
                zones_data[zone_key] = {
                    "zone": zone_num,
                    "source": await self.api.query_zone_source(zone_num),
                    "volume": await self.api.query_zone_volume(zone_num),
                }

            data = {
                "power": power,
                "zones": zones_data,
            }

            _LOGGER.debug("Zektor data updated: %s", data)
            return data

        except ZektorConnectionError as e:
            _LOGGER.error("Connection error: %s", e)
            raise UpdateFailed(f"Connection failed: {e}") from e
        except ZektorProtocolError as e:
            _LOGGER.error("Protocol error: %s", e)
            raise UpdateFailed(f"Protocol error: {e}") from e
        except Exception as e:  # pylint: disable=broad-except
            _LOGGER.error("Unexpected error: %s", e)
            raise UpdateFailed(f"Unexpected error: {e}") from e

    async def async_shutdown(self) -> None:
        """Close connection on shutdown."""
        await self.api.disconnect()
        await super().async_shutdown()
