"""Select platform for Zektor Audio System."""

import logging
from typing import Optional

from homeassistant.components.select import SelectEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import ZektorEntity
from .const import DOMAIN, MAX_ANALOG_SOURCE, MAX_DIGITAL_SOURCE

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

    entities: list[SelectEntity] = []

    for zone_num in range(1, zones + 1):
        entities.append(ZektorZoneSourceSelect(coordinator, entry, zone_num))
        entities.append(ZektorZoneDigitalSourceSelect(coordinator, entry, zone_num))

    async_add_entities(entities)


class ZektorZoneSourceSelect(ZektorEntity, SelectEntity):
    """Zone source select entity (SZ)."""

    def __init__(self, coordinator, entry, zone: int) -> None:
        """Initialize the select."""
        super().__init__(coordinator, entry, zone)
        self._attr_name = f"Zone {zone} Source"
        self._attr_unique_id = f"zektor_zone_{zone}_source_select"

    @property
    def options(self) -> list[str]:
        """Return available SZ sources, including toslink ids."""
        return ["disconnect"] + [
            f"source_{source_id}" for source_id in range(1, MAX_ANALOG_SOURCE + 1)
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
        if 1 <= source <= MAX_ANALOG_SOURCE:
            return f"source_{source}"

        return None

    def select_option(self, option: str) -> None:
        """Set source (sync wrapper for type-checkers)."""
        self.hass.async_create_task(self.async_select_option(option))

    async def async_select_option(self, option: str) -> None:
        """Set source."""
        if option == "disconnect":
            source = 0
        elif option.startswith("source_"):
            source = int(option.split("_")[1])
        else:
            return

        await self.api.set_zone_source(self._zone, source)


class ZektorZoneDigitalSourceSelect(ZektorEntity, SelectEntity):
    """Zone digital source select entity (DSZ)."""

    def __init__(self, coordinator, entry, zone: int) -> None:
        """Initialize the select."""
        super().__init__(coordinator, entry, zone)
        self._attr_name = f"Zone {zone} Digital Source"
        self._attr_unique_id = f"zektor_zone_{zone}_digital_source_select"

    @property
    def options(self) -> list[str]:
        """Return available DSZ sources."""
        return ["disconnect"] + [
            f"digital_source_{source_id}"
            for source_id in range(1, MAX_DIGITAL_SOURCE + 1)
        ]

    @property
    def current_option(self) -> Optional[str]:
        """Return current digital source."""
        if self.coordinator.data is None:
            return None

        zone_data = self.coordinator.data.get("zones", {}).get(f"zone_{self._zone}")
        if zone_data is None:
            return None

        source = zone_data.get("digital_source")
        if source is None:
            return None

        if source == 0:
            return "disconnect"
        if 1 <= source <= MAX_DIGITAL_SOURCE:
            return f"digital_source_{source}"

        return None

    def select_option(self, option: str) -> None:
        """Set digital source (sync wrapper for type-checkers)."""
        self.hass.async_create_task(self.async_select_option(option))

    async def async_select_option(self, option: str) -> None:
        """Set digital source."""
        if option == "disconnect":
            source = 0
        elif option.startswith("digital_source_"):
            source = int(option.split("_")[-1])
        else:
            return

        await self.api.set_zone_digital_source(self._zone, source)
