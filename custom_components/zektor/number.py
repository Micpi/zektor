"""Number platform for Zektor Audio System."""

import logging
from typing import Any, Optional

from homeassistant.components.number import NumberEntity, NumberMode
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_HOST
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import ZektorEntity
from .const import (
    CONF_ZONES,
    DEFAULT_ZONES,
    DOMAIN,
    MIN_VOLUME,
    MAX_VOLUME,
    MIN_EQUALIZER,
    MAX_EQUALIZER,
    MIN_BALANCE,
    MAX_BALANCE,
)

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up number entities."""
    data = hass.data[DOMAIN][entry.entry_id]
    coordinator = data["coordinator"]
    zones = data["zones"]

    entities = []

    # Add zone volume numbers
    for zone_num in range(1, zones + 1):
        entities.append(ZektorZoneVolumeNumber(coordinator, entry, zone_num))
        entities.append(ZektorZoneBassNumber(coordinator, entry, zone_num))
        entities.append(ZektorZoneTrebleNumber(coordinator, entry, zone_num))
        entities.append(ZektorZoneBalanceNumber(coordinator, entry, zone_num))
        entities.append(ZektorZoneDigitalSourceNumber(coordinator, entry, zone_num))

    async_add_entities(entities)


class ZektorZoneVolumeNumber(ZektorEntity, NumberEntity):
    """Zone volume number entity."""

    _attr_mode = NumberMode.SLIDER
    _attr_native_min_value = MIN_VOLUME
    _attr_native_max_value = MAX_VOLUME
    _attr_native_step = 1

    def __init__(self, coordinator, entry, zone: int) -> None:
        """Initialize the number."""
        super().__init__(coordinator, entry, zone)
        self._attr_name = f"Zone {zone} Volume"
        self._attr_unique_id = f"zektor_zone_{zone}_volume_number"

    @property
    def native_value(self) -> Optional[float]:
        """Return current volume."""
        if self.coordinator.data is None:
            return None

        zone_data = self.coordinator.data.get("zones", {}).get(f"zone_{self._zone}")
        if zone_data is None:
            return None

        return zone_data.get("volume")

    async def async_set_native_value(self, value: float) -> None:
        """Set volume."""
        result = await self.coordinator.api.set_zone_volume(self._zone, int(value))
        if result:
            await self.coordinator.async_request_refresh()


class ZektorZoneBassNumber(ZektorEntity, NumberEntity):
    """Zone bass number entity."""

    _attr_mode = NumberMode.SLIDER
    _attr_native_min_value = MIN_EQUALIZER
    _attr_native_max_value = MAX_EQUALIZER
    _attr_native_step = 1

    def __init__(self, coordinator, entry, zone: int) -> None:
        """Initialize the number."""
        super().__init__(coordinator, entry, zone)
        self._attr_name = f"Zone {zone} Bass"
        self._attr_unique_id = f"zektor_zone_{zone}_bass"

    @property
    def native_value(self) -> Optional[float]:
        """Return current bass level."""
        # Would need to store this in coordinator data
        return 128  # Default 0 dB

    async def async_set_native_value(self, value: float) -> None:
        """Set bass."""
        result = await self.coordinator.api.set_zone_bass(self._zone, int(value))
        if result:
            await self.coordinator.async_request_refresh()


class ZektorZoneTrebleNumber(ZektorEntity, NumberEntity):
    """Zone treble number entity."""

    _attr_mode = NumberMode.SLIDER
    _attr_native_min_value = MIN_EQUALIZER
    _attr_native_max_value = MAX_EQUALIZER
    _attr_native_step = 1

    def __init__(self, coordinator, entry, zone: int) -> None:
        """Initialize the number."""
        super().__init__(coordinator, entry, zone)
        self._attr_name = f"Zone {zone} Treble"
        self._attr_unique_id = f"zektor_zone_{zone}_treble"

    @property
    def native_value(self) -> Optional[float]:
        """Return current treble level."""
        # Would need to store this in coordinator data
        return 128  # Default 0 dB

    async def async_set_native_value(self, value: float) -> None:
        """Set treble."""
        result = await self.coordinator.api.set_zone_treble(self._zone, int(value))
        if result:
            await self.coordinator.async_request_refresh()


class ZektorZoneBalanceNumber(ZektorEntity, NumberEntity):
    """Zone balance number entity."""

    _attr_mode = NumberMode.SLIDER
    _attr_native_min_value = MIN_BALANCE
    _attr_native_max_value = MAX_BALANCE
    _attr_native_step = 1

    def __init__(self, coordinator, entry, zone: int) -> None:
        """Initialize the number."""
        super().__init__(coordinator, entry, zone)
        self._attr_name = f"Zone {zone} Balance"
        self._attr_unique_id = f"zektor_zone_{zone}_balance"

    @property
    def native_value(self) -> Optional[float]:
        """Return current balance."""
        return 200  # Default center

    async def async_set_native_value(self, value: float) -> None:
        """Set balance."""
        result = await self.coordinator.api.set_zone_balance(self._zone, int(value))
        if result:
            await self.coordinator.async_request_refresh()


class ZektorZoneDigitalSourceNumber(ZektorEntity, NumberEntity):
    """Zone digital source number entity (DSZ source id)."""

    _attr_mode = NumberMode.BOX
    _attr_native_min_value = 0
    _attr_native_max_value = 144
    _attr_native_step = 1

    def __init__(self, coordinator, entry, zone: int) -> None:
        """Initialize the number."""
        super().__init__(coordinator, entry, zone)
        self._attr_name = f"Zone {zone} Digital Source"
        self._attr_unique_id = f"zektor_zone_{zone}_digital_source"

    @property
    def native_value(self) -> Optional[float]:
        """Return current digital source id."""
        if self.coordinator.data is None:
            return None

        zone_data = self.coordinator.data.get("zones", {}).get(f"zone_{self._zone}")
        if zone_data is None:
            return None

        value = zone_data.get("digital_source")
        return float(value) if value is not None else None

    async def async_set_native_value(self, value: float) -> None:
        """Set digital source id."""
        result = await self.coordinator.api.set_zone_digital_source(self._zone, int(value))
        if result:
            await self.coordinator.async_request_refresh()
