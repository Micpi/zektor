"""The Blaze PowerZone Connect integration."""

# pylint: disable=duplicate-code
from __future__ import annotations

import logging

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_HOST, CONF_NAME, CONF_PORT
from homeassistant.core import HomeAssistant
from homeassistant.exceptions import ConfigEntryNotReady

from .api import BlazeApi, BlazeConnectionError
from .const import (
    ATTR_COMMAND,
    ATTR_ENTRY_ID,
    DATA_API,
    DATA_COORDINATOR,
    DEFAULT_PORT,
    DOMAIN,
    PLATFORMS,
    SERVICE_SEND_RAW_COMMAND,
)
from .coordinator import BlazeCoordinator

_LOGGER = logging.getLogger(__name__)

SERVICE_SCHEMA = vol.Schema(
    {
        vol.Optional(ATTR_ENTRY_ID): str,
        vol.Required(ATTR_COMMAND): str,
    }
)


def _ensure_services_registered(hass: HomeAssistant) -> None:
    """Register integration services once."""
    if hass.services.has_service(DOMAIN, SERVICE_SEND_RAW_COMMAND):
        return

    async def _async_handle_send_raw_command(call) -> None:
        """Handle blaze_powerzone.send_raw_command service."""
        domain_data = hass.data.get(DOMAIN, {})

        entry_id = call.data.get(ATTR_ENTRY_ID)
        command = call.data[ATTR_COMMAND]

        if entry_id:
            entry_data = domain_data.get(entry_id)
            if entry_data is None:
                raise ValueError(f"Unknown Blaze entry_id: {entry_id}")
        else:
            if not domain_data:
                raise ValueError("No Blaze integration entry is loaded")
            if len(domain_data) > 1:
                raise ValueError("Multiple Blaze entries found, provide entry_id")
            entry_data = next(iter(domain_data.values()))

        api: BlazeApi = entry_data[DATA_API]
        responses = await api.send_raw_command(command)
        _LOGGER.debug("Raw command executed: %s -> %s lines", command, len(responses))

    hass.services.async_register(
        DOMAIN,
        SERVICE_SEND_RAW_COMMAND,
        _async_handle_send_raw_command,
        schema=SERVICE_SCHEMA,
    )


async def async_setup_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Set up Blaze PowerZone Connect from a config entry."""
    host = entry.data[CONF_HOST]
    port = entry.data.get(CONF_PORT, DEFAULT_PORT)

    api = BlazeApi(host, port)

    try:
        await api.connect()
    except BlazeConnectionError as err:
        raise ConfigEntryNotReady(
            f"Unable to connect to Blaze amplifier at {host}:{port}"
        ) from err

    coordinator = BlazeCoordinator(hass, api, entry)

    # Initial data fetch
    await coordinator.async_config_entry_first_refresh()

    hass.data.setdefault(DOMAIN, {})
    hass.data[DOMAIN][entry.entry_id] = {
        DATA_API: api,
        DATA_COORDINATOR: coordinator,
    }
    _ensure_services_registered(hass)

    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)

    return True


async def async_unload_entry(hass: HomeAssistant, entry: ConfigEntry) -> bool:
    """Unload a config entry."""
    unload_ok = await hass.config_entries.async_unload_platforms(entry, PLATFORMS)

    if unload_ok:
        data = hass.data[DOMAIN].pop(entry.entry_id)
        api: BlazeApi = data[DATA_API]
        await api.disconnect()

        if not hass.data[DOMAIN] and hass.services.has_service(
            DOMAIN, SERVICE_SEND_RAW_COMMAND
        ):
            hass.services.async_remove(DOMAIN, SERVICE_SEND_RAW_COMMAND)

    return unload_ok
