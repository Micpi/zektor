"""Zektor Audio System integration for Home Assistant."""

import logging
from typing import Final

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_HOST, Platform
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import (
    CONF_NAME,
    CONF_PORT,
    CONF_ZONES,
    DEFAULT_PORT,
    DEFAULT_ZONES,
    DOMAIN,
    MANUFACTURER,
)
from .coordinator import ZektorDataUpdateCoordinator

_LOGGER = logging.getLogger(__name__)

PLATFORMS: Final = [
    Platform.SENSOR,
    Platform.SWITCH,
    Platform.BUTTON,
    Platform.NUMBER,
    Platform.SELECT,
]


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Zektor Audio System from a config entry."""
    _LOGGER.debug("Setting up Zektor integration for %s", entry.unique_id)

    host = entry.data[CONF_HOST]
    port = entry.data.get(CONF_PORT, DEFAULT_PORT)
    name = entry.data.get(CONF_NAME, "Zektor Audio System")
    zones = entry.options.get(CONF_ZONES, entry.data.get(CONF_ZONES, DEFAULT_ZONES))

    coordinator = ZektorDataUpdateCoordinator(
        hass,
        host,
        port,
        zones,
    )

    # Auto-detect zone capacity if still using the default zone count.
    if entry.options.get(CONF_ZONES) is None and zones == DEFAULT_ZONES:
        try:
            await coordinator.api.connect()
            detected_zones = await coordinator.api.detect_zone_capacity()
            if detected_zones and detected_zones != zones:
                zones = detected_zones
                coordinator.zones = detected_zones
                hass.config_entries.async_update_entry(
                    entry,
                    data={**entry.data, CONF_ZONES: detected_zones},
                )
                _LOGGER.info(
                    "Auto-detected Zektor zone capacity: %s zones for %s",
                    detected_zones,
                    host,
                )
        except Exception as err:  # pylint: disable=broad-except
            _LOGGER.debug("Zone auto-detection skipped: %s", err)

    # Avoid hard-failing setup if the device is temporarily unavailable.
    await coordinator.async_refresh()

    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = {
        "coordinator": coordinator,
        "host": host,
        "port": port,
        "name": name,
        "zones": zones,
    }

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    entry.async_on_unload(entry.add_update_listener(async_reload_entry))

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    _LOGGER.debug("Unloading Zektor integration for %s", entry.unique_id)

    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)

    if unload_ok:
        coordinator = hass.data[DOMAIN][entry.entry_id]["coordinator"]
        await coordinator.async_shutdown()
        hass.data[DOMAIN].pop(entry.entry_id)

    return unload_ok


async def async_reload_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Reload config entry."""
    await async_unload_entry(hass, entry)
    await async_setup_entry(hass, entry)


class ZektorEntity(CoordinatorEntity):
    """Base entity for Zektor Audio System."""

    def __init__(
        self,
        coordinator: ZektorDataUpdateCoordinator,
        entry: ConfigEntry,
        zone: int = 0,
    ) -> None:
        """Initialize the entity."""
        super().__init__(coordinator)
        self._entry = entry
        self._zone = zone

    @property
    def zektor_coordinator(self) -> ZektorDataUpdateCoordinator:
        """Return strongly-typed coordinator."""
        return self.coordinator  # type: ignore[return-value]

    @property
    def api(self):
        """Shortcut to API client."""
        return self.zektor_coordinator.api

    @property
    def device_info(self) -> DeviceInfo:
        """Return device info."""
        unique_id = self._entry.unique_id or self._entry.entry_id
        return DeviceInfo(
            identifiers={(DOMAIN, unique_id)},
            name=self._entry.data.get(CONF_NAME, "Zektor Audio System"),
            manufacturer=MANUFACTURER,
            model="ProAudio/ClarityAudio",
        )
