"""Select platform for Zektor Audio System."""

import logging
from typing import Any, Optional

from homeassistant.components.select import SelectEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_HOST
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import ZektorEntity
from .const import CONF_ZONES, DEFAULT_ZONES, DOMAIN

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up select entities."""
    data = hass.data[DOMAIN][entry.entry_id]
    coordinator = data["coordinator"]
    zones = data["zones"]

    entities = []

    # Add zone source select
    for zone_num in range(1, zones + 1):
        entities.append(ZektorZoneSourceSelect(coordinator, entry, zone_num))

    async_add_entities(entities)


class ZektorZoneSourceSelect(ZektorEntity, SelectEntity):
    """Zone source select entity."""

    def __init__(self, coordinator, entry, zone: int) -> None:
        """Initialize the select."""
        super().__init__(coordinator, entry, zone)
        self._attr_name = f"Zone {zone} Source"
        self._attr_unique_id = f"zektor_zone_{zone}_source_select"

    @property
    def options(self) -> list[str]:
        """Return available sources."""
        return [
            "disconnect",
            "source_1",
            "source_2",
            "source_3",
            "source_4",
            "source_5",
            "source_6",
            "source_7",
            "source_8",
            "source_9",
            "source_10",
            "source_11",
            "source_12",
            "source_13",
            "source_14",
            "source_15",
            "source_16",
        ]

    @property
    def current_option(self) -> Optional[str]:
        """Return current source."""
        if self.coordinator.data is None:
            return None

        zone_data = self.coordinator.data.get("zones", {}).get(f"zone_{self._zone}")
        if zone_data is None:
            return None

        source = zone_data.get("source")
        if source is None:
            return None

        if source == 0:
            return "disconnect"
        elif 1 <= source <= 16:
            return f"source_{source}"

        return None

    async def async_select_option(self, option: str) -> None:
        """Set source."""
        if option == "disconnect":
            source = 0
        elif option.startswith("source_"):
            source = int(option.split("_")[1])
        else:
            return

        result = await self.coordinator.api.set_zone_source(self._zone, source)
        if result:
            await self.coordinator.async_request_refresh()
