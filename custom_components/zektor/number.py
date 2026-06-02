"""Number platform for Zektor Audio System."""

import logging
from typing import Optional

from homeassistant.components.number import NumberEntity, NumberMode
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import ZektorEntity
from .const import (
    DOMAIN,
    MAX_BALANCE,
    MAX_DIGITAL_SOURCE,
    MAX_EQUALIZER,
    MAX_VOLUME,
    MIN_BALANCE,
    MIN_EQUALIZER,
    MIN_VOLUME,
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

    entities: list[NumberEntity] = []

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
        super().__init__(coordinator, entry, zone)
        self._attr_name = f"Zone {zone} Volume"
        self._attr_unique_id = f"zektor_zone_{zone}_volume_number"

    @property
    def native_value(self) -> Optional[float]:
        if self.coordinator.data is None:
            return None
        zone_data = self.coordinator.data.get("zones", {}).get(f"zone_{self._zone}")
        if zone_data is None:
            return None
        value = zone_data.get("volume")
        return float(value) if value is not None else None

    def set_native_value(self, value: float) -> None:
        self.hass.async_create_task(self._async_apply_value(value))

    async def _async_apply_value(self, value: float) -> None:
        result = await self.api.set_zone_volume(self._zone, int(value))
        if result:
            await self.zektor_coordinator.async_request_refresh()


class ZektorZoneBassNumber(ZektorEntity, NumberEntity):
    """Zone bass number entity."""

    _attr_mode = NumberMode.SLIDER
    _attr_native_min_value = MIN_EQUALIZER
    _attr_native_max_value = MAX_EQUALIZER
    _attr_native_step = 1

    def __init__(self, coordinator, entry, zone: int) -> None:
        super().__init__(coordinator, entry, zone)
        self._attr_name = f"Zone {zone} Bass"
        self._attr_unique_id = f"zektor_zone_{zone}_bass"

    @property
    def native_value(self) -> Optional[float]:
        if self.coordinator.data is None:
            return None
        zone_data = self.coordinator.data.get("zones", {}).get(f"zone_{self._zone}")
        if zone_data is None:
            return None
        value = zone_data.get("bass")
        return float(value) if value is not None else 128.0

    def set_native_value(self, value: float) -> None:
        self.hass.async_create_task(self._async_apply_value(value))

    async def _async_apply_value(self, value: float) -> None:
        result = await self.api.set_zone_bass(self._zone, int(value))
        if result:
            await self.zektor_coordinator.async_request_refresh()


class ZektorZoneTrebleNumber(ZektorEntity, NumberEntity):
    """Zone treble number entity."""

    _attr_mode = NumberMode.SLIDER
    _attr_native_min_value = MIN_EQUALIZER
    _attr_native_max_value = MAX_EQUALIZER
    _attr_native_step = 1

    def __init__(self, coordinator, entry, zone: int) -> None:
        super().__init__(coordinator, entry, zone)
        self._attr_name = f"Zone {zone} Treble"
        self._attr_unique_id = f"zektor_zone_{zone}_treble"

    @property
    def native_value(self) -> Optional[float]:
        if self.coordinator.data is None:
            return None
        zone_data = self.coordinator.data.get("zones", {}).get(f"zone_{self._zone}")
        if zone_data is None:
            return None
        value = zone_data.get("treble")
        return float(value) if value is not None else 128.0

    def set_native_value(self, value: float) -> None:
        self.hass.async_create_task(self._async_apply_value(value))

    async def _async_apply_value(self, value: float) -> None:
        result = await self.api.set_zone_treble(self._zone, int(value))
        if result:
            await self.zektor_coordinator.async_request_refresh()


class ZektorZoneBalanceNumber(ZektorEntity, NumberEntity):
    """Zone balance number entity."""

    _attr_mode = NumberMode.SLIDER
    _attr_native_min_value = MIN_BALANCE
    _attr_native_max_value = MAX_BALANCE
    _attr_native_step = 1

    def __init__(self, coordinator, entry, zone: int) -> None:
        super().__init__(coordinator, entry, zone)
        self._attr_name = f"Zone {zone} Balance"
        self._attr_unique_id = f"zektor_zone_{zone}_balance"

    @property
    def native_value(self) -> Optional[float]:
        if self.coordinator.data is None:
            return None
        zone_data = self.coordinator.data.get("zones", {}).get(f"zone_{self._zone}")
        if zone_data is None:
            return None
        value = zone_data.get("balance")
        return float(value) if value is not None else 200.0

    def set_native_value(self, value: float) -> None:
        self.hass.async_create_task(self._async_apply_value(value))

    async def _async_apply_value(self, value: float) -> None:
        result = await self.api.set_zone_balance(self._zone, int(value))
        if result:
            await self.zektor_coordinator.async_request_refresh()


class ZektorZoneDigitalSourceNumber(ZektorEntity, NumberEntity):
    """Zone digital source number entity (DSZ source id)."""

    _attr_mode = NumberMode.BOX
    _attr_native_min_value = 0
    _attr_native_max_value = MAX_DIGITAL_SOURCE
    _attr_native_step = 1

    def __init__(self, coordinator, entry, zone: int) -> None:
        super().__init__(coordinator, entry, zone)
        self._attr_name = f"Zone {zone} Digital Source"
        self._attr_unique_id = f"zektor_zone_{zone}_digital_source"

    @property
    def native_value(self) -> Optional[float]:
        if self.coordinator.data is None:
            return None
        zone_data = self.coordinator.data.get("zones", {}).get(f"zone_{self._zone}")
        if zone_data is None:
            return None
        value = zone_data.get("digital_source")
        return float(value) if value is not None else None

    def set_native_value(self, value: float) -> None:
        self.hass.async_create_task(self._async_apply_value(value))

    async def _async_apply_value(self, value: float) -> None:
        result = await self.api.set_zone_digital_source(self._zone, int(value))
        if result:
            await self.zektor_coordinator.async_request_refresh()
