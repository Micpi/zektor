"""Sensor entities for Blaze PowerZone Connect."""
# pylint: disable=unexpected-keyword-arg,duplicate-code
from __future__ import annotations

import logging
from dataclasses import dataclass

from homeassistant.components.sensor import (
    SensorEntity,
    SensorEntityDescription,
    SensorStateClass,
)
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_NAME
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import DATA_COORDINATOR, DOMAIN, INPUT_CHANNELS
from .coordinator import BlazeCoordinator

_LOGGER = logging.getLogger(__name__)


@dataclass(frozen=True, kw_only=True)
class BlazeSensorDescription(SensorEntityDescription):
    """Describe a Blaze sensor."""

    register: str = ""


# Static system sensors
SYSTEM_SENSORS: list[BlazeSensorDescription] = [
    BlazeSensorDescription(
        key="system_state",
        name="System State",
        register="SYSTEM.STATUS.STATE",
        icon="mdi:state-machine",
    ),
    BlazeSensorDescription(
        key="signal_in",
        name="Signal In Status",
        register="SYSTEM.STATUS.SIGNAL_IN",
        icon="mdi:signal",
    ),
    BlazeSensorDescription(
        key="signal_out",
        name="Signal Out Status",
        register="SYSTEM.STATUS.SIGNAL_OUT",
        icon="mdi:signal",
    ),
    BlazeSensorDescription(
        key="lan_ip",
        name="LAN IP",
        register="SYSTEM.STATUS.LAN",
        icon="mdi:lan",
    ),
    BlazeSensorDescription(
        key="wifi_ip",
        name="WiFi IP",
        register="SYSTEM.STATUS.WIFI",
        icon="mdi:wifi",
    ),
    BlazeSensorDescription(
        key="api_version",
        name="API Version",
        register="API_VERSION",
        icon="mdi:api",
    ),
    BlazeSensorDescription(
        key="firmware",
        name="Firmware",
        register="SYSTEM.DEVICE.FIRMWARE",
        icon="mdi:chip",
    ),
    BlazeSensorDescription(
        key="firmware_date",
        name="Firmware Date",
        register="SYSTEM.DEVICE.FIRMWARE_DATE",
        icon="mdi:calendar",
    ),
    BlazeSensorDescription(
        key="model_name",
        name="Model",
        register="SYSTEM.DEVICE.MODEL_NAME",
        icon="mdi:amplifier",
    ),
    BlazeSensorDescription(
        key="serial",
        name="Serial Number",
        register="SYSTEM.DEVICE.SERIAL",
        icon="mdi:identifier",
    ),
    BlazeSensorDescription(
        key="mac_address",
        name="MAC Address",
        register="SYSTEM.DEVICE.MAC",
        icon="mdi:network",
    ),
    BlazeSensorDescription(
        key="wifi_mac",
        name="WiFi MAC Address",
        register="SYSTEM.DEVICE.WIFI_MAC",
        icon="mdi:wifi",
    ),
    BlazeSensorDescription(
        key="device_name",
        name="Device Name",
        register="SETUP.SYSTEM.DEVICE_NAME",
        icon="mdi:label",
    ),
    BlazeSensorDescription(
        key="venue_name",
        name="Venue Name",
        register="SETUP.SYSTEM.VENUE_NAME",
        icon="mdi:map-marker",
    ),
    BlazeSensorDescription(
        key="lan_network_mode",
        name="LAN Network Mode",
        register="SETUP.LAN.NETWORK_MODE",
        icon="mdi:lan",
    ),
    BlazeSensorDescription(
        key="lan_ip_config",
        name="LAN IP Config",
        register="SETUP.LAN.IP",
        icon="mdi:ip-network",
    ),
    BlazeSensorDescription(
        key="power_on_mode",
        name="Power On Mode",
        register="SETUP.POWER.POWER_ON",
        icon="mdi:power-settings",
    ),
]


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Blaze sensors from config entry."""
    coordinator: BlazeCoordinator = hass.data[DOMAIN][entry.entry_id][DATA_COORDINATOR]
    device_name = entry.data.get(CONF_NAME, "Blaze PowerZone")

    entities: list[BlazeSensorEntity] = []

    # System sensors
    for desc in SYSTEM_SENSORS:
        entities.append(
            BlazeSensorEntity(coordinator, desc, device_name, entry.entry_id)
        )

    # Input signal level sensors
    for iid in coordinator.get_input_ids():
        ch_name = INPUT_CHANNELS.get(iid, f"Input {iid}")
        entities.append(
            BlazeSensorEntity(
                coordinator,
                BlazeSensorDescription(
                    key=f"in_{iid}_signal",
                    name=f"{ch_name} Signal Level",
                    register=f"IN-{iid}.DYN.SIGNAL",
                    native_unit_of_measurement="dB",
                    state_class=SensorStateClass.MEASUREMENT,
                    icon="mdi:sine-wave",
                ),
                device_name,
                entry.entry_id,
            )
        )
        entities.append(
            BlazeSensorEntity(
                coordinator,
                BlazeSensorDescription(
                    key=f"in_{iid}_clip",
                    name=f"{ch_name} Clip",
                    register=f"IN-{iid}.DYN.CLIP",
                    icon="mdi:alert",
                ),
                device_name,
                entry.entry_id,
            )
        )
        # Input name sensor
        entities.append(
            BlazeSensorEntity(
                coordinator,
                BlazeSensorDescription(
                    key=f"in_{iid}_name",
                    name=f"{ch_name} Name",
                    register=f"IN-{iid}.NAME",
                    icon="mdi:rename-box",
                ),
                device_name,
                entry.entry_id,
            )
        )

    # Zone signal level sensors
    for zid in coordinator.get_zone_ids():
        entities.append(
            BlazeSensorEntity(
                coordinator,
                BlazeSensorDescription(
                    key=f"zone_{zid}_signal",
                    name=f"Zone {zid} Signal Level",
                    register=f"ZONE-{zid}.DYN.SIGNAL",
                    native_unit_of_measurement="dB",
                    state_class=SensorStateClass.MEASUREMENT,
                    icon="mdi:sine-wave",
                ),
                device_name,
                entry.entry_id,
            )
        )
        # Zone name
        entities.append(
            BlazeSensorEntity(
                coordinator,
                BlazeSensorDescription(
                    key=f"zone_{zid}_name",
                    name=f"Zone {zid} Name",
                    register=f"ZONE-{zid}.NAME",
                    icon="mdi:label",
                ),
                device_name,
                entry.entry_id,
            )
        )

    # Output signal + clip sensors
    for oid in coordinator.get_output_ids():
        entities.append(
            BlazeSensorEntity(
                coordinator,
                BlazeSensorDescription(
                    key=f"out_{oid}_signal",
                    name=f"Output {oid} Signal Level",
                    register=f"OUT-{oid}.DYN.SIGNAL",
                    native_unit_of_measurement="dB",
                    state_class=SensorStateClass.MEASUREMENT,
                    icon="mdi:sine-wave",
                ),
                device_name,
                entry.entry_id,
            )
        )
        entities.append(
            BlazeSensorEntity(
                coordinator,
                BlazeSensorDescription(
                    key=f"out_{oid}_clip",
                    name=f"Output {oid} Clip",
                    register=f"OUT-{oid}.DYN.CLIP",
                    icon="mdi:alert",
                ),
                device_name,
                entry.entry_id,
            )
        )
        entities.append(
            BlazeSensorEntity(
                coordinator,
                BlazeSensorDescription(
                    key=f"out_{oid}_name",
                    name=f"Output {oid} Name",
                    register=f"OUT-{oid}.NAME",
                    icon="mdi:rename-box",
                ),
                device_name,
                entry.entry_id,
            )
        )

    # Volume control value sensors
    if coordinator.data:
        for key in coordinator.data:
            if key.startswith("VC-") and key.endswith(".VALUE"):
                vid = key.split("-")[1].split(".")[0]
                entities.append(
                    BlazeSensorEntity(
                        coordinator,
                        BlazeSensorDescription(
                            key=f"vc_{vid}_value",
                            name=f"Volume Control {vid} Value",
                            register=key,
                            native_unit_of_measurement="%",
                            state_class=SensorStateClass.MEASUREMENT,
                            icon="mdi:knob",
                        ),
                        device_name,
                        entry.entry_id,
                    )
                )
            elif key.startswith("VC-") and key.endswith(".NAME"):
                vid = key.split("-")[1].split(".")[0]
                entities.append(
                    BlazeSensorEntity(
                        coordinator,
                        BlazeSensorDescription(
                            key=f"vc_{vid}_name",
                            name=f"Volume Control {vid} Name",
                            register=key,
                            icon="mdi:knob",
                        ),
                        device_name,
                        entry.entry_id,
                    )
                )

    async_add_entities(entities)


class BlazeSensorEntity(CoordinatorEntity[BlazeCoordinator], SensorEntity):
    """Representation of a Blaze sensor."""

    entity_description: BlazeSensorDescription
    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: BlazeCoordinator,
        description: BlazeSensorDescription,
        device_name: str,
        entry_id: str,
    ) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator)
        self.entity_description = description
        self._attr_unique_id = f"{entry_id}_{description.key}"
        self._device_name = device_name
        self._entry_id = entry_id

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

    @callback
    def _handle_coordinator_update(self) -> None:
        """Handle updated data from the coordinator."""
        self.async_write_ha_state()

    @property
    def native_value(self) -> str | None:
        """Return the state of the sensor."""
        value = self.coordinator.get_value(self.entity_description.register)
        return value if value else None

    @property
    def available(self) -> bool:
        """Return True if entity is available."""
        return self.coordinator.last_update_success
