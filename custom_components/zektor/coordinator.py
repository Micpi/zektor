"""Data update coordinator for Zektor Audio System."""

import logging
from datetime import timedelta
from typing import Any

from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import ZektorAPIClient, ZektorConnectionError, ZektorProtocolError
from .const import DEFAULT_SCAN_INTERVAL, DOMAIN, EXTENDED_POLL_EVERY

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
        self._poll_cycle = 0
        self._last_data: dict[str, Any] = {"power": None, "zones": {}}

    async def _async_update_data(self) -> dict[str, Any]:
        """Fetch data from the device with adaptive polling."""
        try:
            await self.api.connect()
            self._poll_cycle += 1
            do_extended = self._poll_cycle % EXTENDED_POLL_EVERY == 0

            # Query global power status every cycle (lightweight).
            power = await self.api.query_power()

            zones_data: dict[str, Any] = {}
            previous_zones = self._last_data.get("zones", {})

            for zone_num in range(1, self.zones + 1):
                zone_key = f"zone_{zone_num}"
                previous = previous_zones.get(zone_key, {})

                zone_payload: dict[str, Any] = {
                    "zone": zone_num,
                    "source": await self.api.query_zone_source(zone_num),
                    "digital_source": await self.api.query_zone_digital_source(zone_num),
                    "volume": await self.api.query_zone_volume(zone_num),
                    "bass": previous.get("bass", 128),
                    "treble": previous.get("treble", 128),
                    "balance": previous.get("balance", 200),
                    "crossover_type": previous.get("crossover_type"),
                    "crossover_frequency": previous.get("crossover_frequency"),
                }

                # Query less dynamic audio tuning params less frequently to reduce load.
                if do_extended:
                    zone_payload["bass"] = await self.api.query_zone_bass(zone_num)
                    zone_payload["treble"] = await self.api.query_zone_treble(zone_num)
                    zone_payload["balance"] = await self.api.query_zone_balance(zone_num)
                    zone_payload["crossover_type"] = await self.api.query_zone_crossover_type(
                        zone_num
                    )
                    zone_payload["crossover_frequency"] = (
                        await self.api.query_zone_crossover_frequency(zone_num)
                    )

                zones_data[zone_key] = zone_payload

            data = {
                "power": power,
                "zones": zones_data,
            }
            self._last_data = data

            _LOGGER.debug(
                "Zektor data updated (cycle=%s, extended=%s)",
                self._poll_cycle,
                do_extended,
            )
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
