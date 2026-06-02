"""Switch platform for Zektor Audio System."""

import logging
from typing import Any, Optional

from homeassistant.components.switch import SwitchEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddEntitiesCallback

from . import ZektorEntity
from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up switch entities."""
    data = hass.data[DOMAIN][entry.entry_id]
    coordinator = data["coordinator"]
    zones = data["zones"]

    entities = []

    # Add power switch
    entities.append(ZektorPowerSwitch(coordinator, entry))

    # Add zone mute switches
    for zone_num in range(1, zones + 1):
        entities.append(ZektorZoneMuteSwitch(coordinator, entry, zone_num))

    async_add_entities(entities)


class ZektorPowerSwitch(ZektorEntity, SwitchEntity):
    """Power switch."""

    _attr_name = "Power"
    _attr_unique_id = "zektor_power_switch"

    @property
    def is_on(self) -> Optional[bool]:
        """Return True if on."""
        if self.coordinator.data is None:
            return None

        power = self.coordinator.data.get("power")
        return power == 1

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Turn on the device."""
        result = await self.api.power_on()
        if result:
            await self.coordinator.async_request_refresh()

    async def async_turn_off(self, **kwargs: Any) -> None:
        """Turn off the device."""
        result = await self.api.power_off()
        if result:
            await self.coordinator.async_request_refresh()


class ZektorZoneMuteSwitch(ZektorEntity, SwitchEntity):
    """Zone mute switch."""

    def __init__(self, coordinator, entry, zone: int) -> None:
        """Initialize the switch."""
        super().__init__(coordinator, entry, zone)
        self._attr_name = f"Zone {zone} Mute"
        self._attr_unique_id = f"zektor_zone_{zone}_mute"
        self._is_muted = False

    @property
    def is_on(self) -> bool:
        """Return True if muted."""
        return self._is_muted

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Mute the zone."""
        result = await self.api.mute_zone(self._zone, True)
        if result:
            self._is_muted = True
            self.async_write_ha_state()
            await self.coordinator.async_request_refresh()

    async def async_turn_off(self, **kwargs: Any) -> None:
        """Unmute the zone."""
        result = await self.api.mute_zone(self._zone, False)
        if result:
            self._is_muted = False
            self.async_write_ha_state()
            await self.coordinator.async_request_refresh()
