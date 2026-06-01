"""Button entities for Blaze PowerZone Connect."""

# pylint: disable=abstract-method,too-many-positional-arguments,duplicate-code
from __future__ import annotations

import logging

from homeassistant.components.button import ButtonEntity, ButtonEntityDescription
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_NAME
from homeassistant.core import HomeAssistant
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DATA_COORDINATOR, DOMAIN
from .coordinator import BlazeCoordinator

_LOGGER = logging.getLogger(__name__)


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Blaze button entities from config entry."""
    coordinator: BlazeCoordinator = hass.data[DOMAIN][entry.entry_id][DATA_COORDINATOR]
    device_name = entry.data.get(CONF_NAME, "Blaze PowerZone")

    entities = [
        BlazePowerButton(
            coordinator,
            ButtonEntityDescription(
                key="power_on",
                name="Power On",
                icon="mdi:power-on",
            ),
            device_name,
            entry.entry_id,
            is_power_on=True,
        ),
        BlazePowerButton(
            coordinator,
            ButtonEntityDescription(
                key="power_off",
                name="Power Off",
                icon="mdi:power-off",
            ),
            device_name,
            entry.entry_id,
            is_power_on=False,
        ),
    ]

    async_add_entities(entities)


class BlazePowerButton(CoordinatorEntity[BlazeCoordinator], ButtonEntity):
    """Representation of a Blaze power button."""

    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: BlazeCoordinator,
        description: ButtonEntityDescription,
        device_name: str,
        entry_id: str,
        is_power_on: bool,
    ) -> None:
        """Initialize the button."""
        super().__init__(coordinator)
        self.entity_description = description
        self._attr_unique_id = f"{entry_id}_{description.key}"
        self._device_name = device_name
        self._entry_id = entry_id
        self._is_power_on = is_power_on

    @property
    def device_info(self) -> DeviceInfo:
        """Return device information."""
        info = self.coordinator.device_info_data
        return DeviceInfo(
            identifiers={(DOMAIN, self._entry_id)},
            name=self._device_name,
            manufacturer=info.get("SYSTEM.DEVICE.VENDOR_NAME", "Blaze Audio"),
            model=info.get("SYSTEM.DEVICE.MODEL_NAME", "PowerZone Connect"),
            sw_version=info.get("SYSTEM.DEVICE.FIRMWARE", ""),
            serial_number=info.get("SYSTEM.DEVICE.SERIAL", ""),
        )

    async def async_press(self) -> None:
        """Handle the button press."""
        if self._is_power_on:
            await self.coordinator.api.power_on()
        else:
            await self.coordinator.api.power_off()
        await self.coordinator.async_request_refresh()

    @property
    def available(self) -> bool:
        """Return True if entity is available."""
        return self.coordinator.last_update_success
