"""Button platform for Zektor Audio System."""

import logging

from homeassistant.components.button import ButtonEntity
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
    """Set up button entities."""
    data = hass.data[DOMAIN][entry.entry_id]
    coordinator = data["coordinator"]

    entities = []

    # Add reconnect button
    entities.append(ZektorReconnectButton(coordinator, entry))

    async_add_entities(entities)


class ZektorReconnectButton(ZektorEntity, ButtonEntity):
    """Reconnect button."""

    _attr_name = "Reconnect"
    _attr_unique_id = "zektor_reconnect"

    async def async_press(self) -> None:
        """Handle button press."""
        try:
            await self.api.disconnect()
            await self.coordinator.async_request_refresh()
            _LOGGER.info("Reconnected to Zektor device")
        except Exception as e:  # pylint: disable=broad-except
            _LOGGER.error("Failed to reconnect: %s", e)

    def press(self) -> None:
        """Sync stub."""
