"""Config flow for Blaze PowerZone Connect integration."""

from __future__ import annotations

import logging
from typing import Any

import voluptuous as vol

from homeassistant.config_entries import ConfigEntry, ConfigFlow, OptionsFlow
from homeassistant.const import CONF_HOST, CONF_NAME, CONF_PORT
from homeassistant.core import callback

from .api import BlazeApi, BlazeApiError, BlazeConnectionError
from .const import DEFAULT_NAME, DEFAULT_PORT, DOMAIN

_LOGGER = logging.getLogger(__name__)

STEP_USER_DATA_SCHEMA = vol.Schema(
    {
        vol.Required(CONF_HOST): str,
        vol.Optional(CONF_PORT, default=DEFAULT_PORT): int,
        vol.Optional(CONF_NAME, default=DEFAULT_NAME): str,
    }
)


class BlazeConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for Blaze PowerZone Connect."""

    VERSION = 1

    def __init__(self) -> None:
        """Initialize the config flow."""
        self._discovered_host: str | None = None
        self._discovered_port: int = DEFAULT_PORT
        self._discovered_name: str | None = None
        self._device_info: dict[str, str] = {}

    def is_matching(self, other_flow: Any) -> bool:
        """Return True if another flow matches this device."""
        if not hasattr(other_flow, "_discovered_host"):
            return False
        return self._discovered_host == getattr(
            other_flow, "_discovered_host", None
        ) and self._discovered_port == getattr(other_flow, "_discovered_port", None)

    async def async_step_user(self, user_input: dict[str, Any] | None = None) -> Any:
        """Handle initial step - manual configuration."""
        errors: dict[str, str] = {}

        if user_input is not None:
            host = user_input[CONF_HOST]
            port = user_input.get(CONF_PORT, DEFAULT_PORT)
            name = user_input.get(CONF_NAME, DEFAULT_NAME)

            # Test connection
            api = BlazeApi(host, port)
            try:
                info = await api.test_connection()
                self._device_info = info

                # Use serial number as unique ID
                serial = info.get("SYSTEM.DEVICE.SERIAL", "")
                mac = info.get("SYSTEM.DEVICE.MAC", "")
                unique_id = serial or mac or f"{host}:{port}"

                await self.async_set_unique_id(unique_id)
                self._abort_if_unique_id_configured(updates={CONF_HOST: host})

                # Get model name for the title
                model = info.get("SYSTEM.DEVICE.MODEL_NAME", "")
                if model:
                    title = f"{name} ({model})"
                else:
                    title = name

                return self.async_create_entry(
                    title=title,
                    data={
                        CONF_HOST: host,
                        CONF_PORT: port,
                        CONF_NAME: name,
                    },
                )
            except BlazeConnectionError:
                errors["base"] = "cannot_connect"
            except BlazeApiError:
                errors["base"] = "cannot_connect"
            except (OSError, RuntimeError, ValueError, TypeError) as err:
                _LOGGER.exception("Unexpected configuration error: %s", err)
                errors["base"] = "unknown"
            finally:
                await api.disconnect()

        return self.async_show_form(
            step_id="user",
            data_schema=STEP_USER_DATA_SCHEMA,
            errors=errors,
        )

    async def async_step_zeroconf(self, discovery_info: Any) -> Any:
        """Handle zeroconf discovery."""
        host = str(discovery_info.host)
        port = discovery_info.port or DEFAULT_PORT
        name = (
            discovery_info.name.split(".")[0] if discovery_info.name else DEFAULT_NAME
        )

        # Get properties from mDNS
        properties = discovery_info.properties or {}
        model = properties.get("model", "")

        self._discovered_host = host
        self._discovered_port = port
        self._discovered_name = name

        # Test connection to get serial for unique ID
        api = BlazeApi(host, port)
        try:
            info = await api.test_connection()
            self._device_info = info

            serial = info.get("SYSTEM.DEVICE.SERIAL", "")
            mac = info.get("SYSTEM.DEVICE.MAC", "")
            unique_id = serial or mac or f"{host}:{port}"

            await self.async_set_unique_id(unique_id)
            self._abort_if_unique_id_configured(updates={CONF_HOST: host})

        except (BlazeConnectionError, BlazeApiError):
            return self.async_abort(reason="cannot_connect")
        except (OSError, RuntimeError, ValueError, TypeError):
            return self.async_abort(reason="unknown")
        finally:
            await api.disconnect()

        # Show confirmation form
        model_name = self._device_info.get("SYSTEM.DEVICE.MODEL_NAME", model)
        self.context["title_placeholders"] = {
            "name": model_name or name,
            "host": host,
        }

        return await self.async_step_zeroconf_confirm()

    async def async_step_zeroconf_confirm(
        self, user_input: dict[str, Any] | None = None
    ) -> Any:
        """Handle a confirmation flow initiated by zeroconf."""
        if user_input is not None:
            name = user_input.get(CONF_NAME, self._discovered_name or DEFAULT_NAME)
            model = self._device_info.get("SYSTEM.DEVICE.MODEL_NAME", "")
            title = f"{name} ({model})" if model else name

            return self.async_create_entry(
                title=title,
                data={
                    CONF_HOST: self._discovered_host,
                    CONF_PORT: self._discovered_port,
                    CONF_NAME: name,
                },
            )

        model = self._device_info.get("SYSTEM.DEVICE.MODEL_NAME", "")
        suggested_name = model or self._discovered_name or DEFAULT_NAME

        return self.async_show_form(
            step_id="zeroconf_confirm",
            data_schema=vol.Schema(
                {
                    vol.Optional(CONF_NAME, default=suggested_name): str,
                }
            ),
            description_placeholders={
                "host": self._discovered_host or "",
                "model": model,
            },
        )

    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> OptionsFlow:
        """Get the options flow for this handler."""
        return BlazeOptionsFlow(config_entry)


class BlazeOptionsFlow(OptionsFlow):
    """Handle options flow for Blaze PowerZone Connect."""

    def __init__(self, config_entry: ConfigEntry) -> None:
        """Initialize options flow."""
        self._config_entry = config_entry

    async def async_step_init(self, user_input: dict[str, Any] | None = None) -> Any:
        """Manage the options."""
        if user_input is not None:
            return self.async_create_entry(title="", data=user_input)

        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema(
                {
                    vol.Optional(
                        CONF_NAME,
                        default=self._config_entry.data.get(CONF_NAME, DEFAULT_NAME),
                    ): str,
                }
            ),
        )
