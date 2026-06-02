"""Config flow for Zektor Audio System."""

import logging
from typing import Any, Dict, Optional

import voluptuous as vol
from homeassistant import config_entries
from homeassistant.const import CONF_HOST
from homeassistant.core import HomeAssistant, callback
from homeassistant.data_entry_flow import FlowResult
from homeassistant.helpers.aiohttp_client import async_create_clientsession

from .api import ZektorAPIClient, ZektorConnectionError
from .const import CONF_NAME, CONF_PORT, CONF_ZONES, DEFAULT_NAME, DEFAULT_PORT, DEFAULT_ZONES, DOMAIN

_LOGGER = logging.getLogger(__name__)


class ZektorConfigFlow(config_entries.ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Zektor Audio System."""

    VERSION = 1
    CONNECTION_CLASS = config_entries.CONN_CLASS_LOCAL_POLL

    async def async_step_user(
        self, user_input: Optional[Dict[str, Any]] = None
    ) -> FlowResult:
        """Handle the initial step."""
        errors = {}

        if user_input is not None:
            # Try to connect to verify the device
            try:
                client = ZektorAPIClient(
                    user_input[CONF_HOST],
                    user_input.get(CONF_PORT, DEFAULT_PORT),
                )
                await client.connect()
                power = await client.query_power()
                await client.disconnect()

                if power is None:
                    errors["base"] = "cannot_connect"
                else:
                    await self.async_set_unique_id(
                        f"zektor_{user_input[CONF_HOST]}"
                    )
                    self._abort_if_unique_id_configured()

                    return self.async_create_entry(
                        title=user_input.get(CONF_NAME, DEFAULT_NAME),
                        data=user_input,
                    )

            except ZektorConnectionError:
                errors["base"] = "cannot_connect"
            except Exception as e:  # pylint: disable=broad-except
                _LOGGER.error("Unexpected error: %s", e)
                errors["base"] = "unknown"

        schema = vol.Schema(
            {
                vol.Required(CONF_HOST): str,
                vol.Required(CONF_PORT, default=DEFAULT_PORT): int,
                vol.Required(CONF_NAME, default=DEFAULT_NAME): str,
                vol.Required(CONF_ZONES, default=DEFAULT_ZONES): vol.Range(
                    min=1, max=64
                ),
            }
        )

        return self.async_show_form(
            step_id="user",
            data_schema=schema,
            errors=errors,
        )

    @staticmethod
    @callback
    def async_get_options_flow(
        config_entry: config_entries.ConfigEntry,
    ) -> config_entries.OptionsFlow:
        """Get the options flow for this handler."""
        return ZektorOptionsFlow(config_entry)


class ZektorOptionsFlow(config_entries.OptionsFlow):
    """Handle options for Zektor Audio System."""

    def __init__(self, config_entry: config_entries.ConfigEntry) -> None:
        """Initialize options flow."""
        self.config_entry = config_entry

    async def async_step_init(
        self, user_input: Optional[Dict[str, Any]] = None
    ) -> FlowResult:
        """Manage the options."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        options_schema = vol.Schema(
            {
                vol.Optional(
                    CONF_ZONES,
                    default=self.config_entry.options.get(
                        CONF_ZONES,
                        self.config_entry.data.get(CONF_ZONES, DEFAULT_ZONES),
                    ),
                ): vol.Range(min=1, max=64),
            }
        )

        return self.async_show_form(
            step_id="init",
            data_schema=options_schema,
        )
