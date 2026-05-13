"""Data update coordinator for Blaze PowerZone Connect."""
from __future__ import annotations

import logging
from datetime import timedelta
from typing import Any

from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed

from .api import BlazeApi, BlazeApiError, BlazeConnectionError
from .const import DOMAIN, SCAN_INTERVAL_SECONDS

_LOGGER = logging.getLogger(__name__)


class BlazeCoordinator(DataUpdateCoordinator[dict[str, str]]):
    """Coordinator to manage data updates from Blaze amplifier."""

    config_entry: ConfigEntry

    def __init__(
        self,
        hass: HomeAssistant,
        api: BlazeApi,
        entry: ConfigEntry,
    ) -> None:
        """Initialize the coordinator."""
        self.api = api
        self._device_info_cache: dict[str, str] = {}

        super().__init__(
            hass,
            _LOGGER,
            name=f"{DOMAIN}_{entry.entry_id}",
            update_interval=timedelta(seconds=SCAN_INTERVAL_SECONDS),
            config_entry=entry,
        )

    @property
    def device_info_data(self) -> dict[str, str]:
        """Return cached device information."""
        return self._device_info_cache

    async def _async_update_data(self) -> dict[str, str]:
        """Fetch data from the amplifier."""
        try:
            data = await self.api.get_full_state()

            # Cache device info
            for key in [
                "SYSTEM.DEVICE.VENDOR_NAME",
                "SYSTEM.DEVICE.MODEL_NAME",
                "SYSTEM.DEVICE.SERIAL",
                "SYSTEM.DEVICE.FIRMWARE",
                "SYSTEM.DEVICE.FIRMWARE_DATE",
                "SYSTEM.DEVICE.MAC",
                "SYSTEM.DEVICE.WIFI_MAC",
                "SYSTEM.DEVICE.SWID",
                "SYSTEM.DEVICE.HWID",
                "API_VERSION",
            ]:
                if key in data:
                    self._device_info_cache[key] = data[key]

            return data

        except BlazeConnectionError as err:
            raise UpdateFailed(f"Connection error: {err}") from err
        except BlazeApiError as err:
            raise UpdateFailed(f"API error: {err}") from err

    def get_value(self, register: str, default: str = "") -> str:
        """Get a register value from cached data."""
        if self.data is None:
            return default
        return self.data.get(register, default)

    def get_float(self, register: str, default: float = 0.0) -> float:
        """Get a float register value from cached data."""
        val = self.get_value(register)
        try:
            return float(val)
        except (ValueError, TypeError):
            return default

    def get_int(self, register: str, default: int = 0) -> int:
        """Get an integer register value from cached data."""
        val = self.get_value(register)
        try:
            return int(float(val))
        except (ValueError, TypeError):
            return default

    def get_bool(self, register: str, default: bool = False) -> bool:
        """Get a boolean register value from cached data."""
        val = self.get_value(register)
        try:
            return int(float(val)) != 0
        except (ValueError, TypeError):
            return default

    async def async_set_register(self, register: str, value: Any) -> None:
        """Set a register value and refresh data."""
        try:
            await self.api.set_register(register, value)
            await self.async_request_refresh()
        except BlazeApiError as err:
            _LOGGER.error("Error setting %s to %s: %s", register, value, err)
            raise

    async def async_inc_register(self, register: str, value: float) -> None:
        """Increment a register value and refresh data."""
        try:
            await self.api.inc_register(register, value)
            await self.async_request_refresh()
        except BlazeApiError as err:
            _LOGGER.error("Error incrementing %s by %s: %s", register, value, err)
            raise

    def get_zone_ids(self) -> list[str]:
        """Get available zone IDs based on zone count."""
        count = self.get_int("ZONE.COUNT", 2)
        all_zones = ["A", "B", "C", "D", "E", "F", "G", "H"]
        return all_zones[:count]

    def get_output_ids(self) -> list[int]:
        """Get available output IDs based on output count."""
        count = self.get_int("OUT.COUNT", 2)
        return list(range(1, count + 1))

    def get_input_ids(self) -> list[int]:
        """Get available input channel IDs."""
        # Parse actual input IDs from data
        input_ids = []
        if self.data:
            for key in self.data:
                if key.startswith("IN-") and ".NAME" in key:
                    try:
                        iid = int(key.split("-")[1].split(".")[0])
                        input_ids.append(iid)
                    except (ValueError, IndexError):
                        pass
        if not input_ids:
            # Defaults: at least analog 1-4 + SPDIF + Generator
            input_ids = [100, 101, 102, 103, 200, 201, 400]
        return sorted(input_ids)
