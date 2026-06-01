"""Number entities for Blaze PowerZone Connect."""

# pylint: disable=unexpected-keyword-arg,abstract-method,duplicate-code
from __future__ import annotations

import logging
from dataclasses import dataclass

from homeassistant.components.number import (
    NumberEntity,
    NumberEntityDescription,
    NumberMode,
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
class BlazeNumberDescription(NumberEntityDescription):
    """Describe a Blaze number entity."""

    register: str = ""


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Blaze number entities from config entry."""
    coordinator: BlazeCoordinator = hass.data[DOMAIN][entry.entry_id][DATA_COORDINATOR]
    device_name = entry.data.get(CONF_NAME, "Blaze PowerZone")

    entities: list[BlazeNumberEntity] = []

    # Input gains
    for iid in coordinator.get_input_ids():
        ch_name = INPUT_CHANNELS.get(iid, f"Input {iid}")
        if iid == 400:
            # Generator input has different range
            entities.append(
                BlazeNumberEntity(
                    coordinator,
                    BlazeNumberDescription(
                        key=f"in_{iid}_gain",
                        name=f"{ch_name} Gain",
                        register=f"IN-{iid}.GAIN",
                        native_min_value=-48.0,
                        native_max_value=0.0,
                        native_step=0.5,
                        native_unit_of_measurement="dB",
                        icon="mdi:volume-source",
                        mode=NumberMode.SLIDER,
                    ),
                    device_name,
                    entry.entry_id,
                )
            )
        else:
            entities.append(
                BlazeNumberEntity(
                    coordinator,
                    BlazeNumberDescription(
                        key=f"in_{iid}_gain",
                        name=f"{ch_name} Gain",
                        register=f"IN-{iid}.GAIN",
                        native_min_value=-15.0,
                        native_max_value=15.0,
                        native_step=0.5,
                        native_unit_of_measurement="dB",
                        icon="mdi:volume-source",
                        mode=NumberMode.SLIDER,
                    ),
                    device_name,
                    entry.entry_id,
                )
            )

    # Input EQ parameters (for analog inputs 100-107)
    analog_inputs = [iid for iid in coordinator.get_input_ids() if 100 <= iid <= 107]
    eq_count = coordinator.get_int("IN.EQ.COUNT", 5)
    for iid in analog_inputs:
        ch_name = INPUT_CHANNELS.get(iid, f"Input {iid}")
        for eid in range(1, eq_count + 1):
            entities.extend(
                [
                    BlazeNumberEntity(
                        coordinator,
                        BlazeNumberDescription(
                            key=f"in_{iid}_eq_{eid}_gain",
                            name=f"{ch_name} EQ{eid} Gain",
                            register=f"IN-{iid}.EQ-{eid}.GAIN",
                            native_min_value=-15.0,
                            native_max_value=15.0,
                            native_step=0.5,
                            native_unit_of_measurement="dB",
                            icon="mdi:equalizer",
                            mode=NumberMode.SLIDER,
                        ),
                        device_name,
                        entry.entry_id,
                    ),
                    BlazeNumberEntity(
                        coordinator,
                        BlazeNumberDescription(
                            key=f"in_{iid}_eq_{eid}_freq",
                            name=f"{ch_name} EQ{eid} Freq",
                            register=f"IN-{iid}.EQ-{eid}.FREQ",
                            native_min_value=20.0,
                            native_max_value=20000.0,
                            native_step=1.0,
                            native_unit_of_measurement="Hz",
                            icon="mdi:sine-wave",
                            mode=NumberMode.BOX,
                        ),
                        device_name,
                        entry.entry_id,
                    ),
                    BlazeNumberEntity(
                        coordinator,
                        BlazeNumberDescription(
                            key=f"in_{iid}_eq_{eid}_q",
                            name=f"{ch_name} EQ{eid} Q",
                            register=f"IN-{iid}.EQ-{eid}.Q",
                            native_min_value=0.4,
                            native_max_value=30.0,
                            native_step=0.1,
                            icon="mdi:tune",
                            mode=NumberMode.BOX,
                        ),
                        device_name,
                        entry.entry_id,
                    ),
                ]
            )

    # Zone gains and parameters
    for zid in coordinator.get_zone_ids():
        entities.extend(
            [
                # Zone gain
                BlazeNumberEntity(
                    coordinator,
                    BlazeNumberDescription(
                        key=f"zone_{zid}_gain",
                        name=f"Zone {zid} Gain",
                        register=f"ZONE-{zid}.GAIN",
                        native_min_value=-80.0,
                        native_max_value=0.0,
                        native_step=0.5,
                        native_unit_of_measurement="dB",
                        icon="mdi:volume-high",
                        mode=NumberMode.SLIDER,
                    ),
                    device_name,
                    entry.entry_id,
                ),
                # Zone gain min
                BlazeNumberEntity(
                    coordinator,
                    BlazeNumberDescription(
                        key=f"zone_{zid}_gain_min",
                        name=f"Zone {zid} Gain Min",
                        register=f"ZONE-{zid}.GAIN_MIN",
                        native_min_value=-80.0,
                        native_max_value=0.0,
                        native_step=1.0,
                        native_unit_of_measurement="dB",
                        icon="mdi:volume-minus",
                        mode=NumberMode.BOX,
                    ),
                    device_name,
                    entry.entry_id,
                ),
                # Zone gain max
                BlazeNumberEntity(
                    coordinator,
                    BlazeNumberDescription(
                        key=f"zone_{zid}_gain_max",
                        name=f"Zone {zid} Gain Max",
                        register=f"ZONE-{zid}.GAIN_MAX",
                        native_min_value=-80.0,
                        native_max_value=0.0,
                        native_step=1.0,
                        native_unit_of_measurement="dB",
                        icon="mdi:volume-plus",
                        mode=NumberMode.BOX,
                    ),
                    device_name,
                    entry.entry_id,
                ),
            ]
        )

        # Zone ducker parameters
        entities.extend(
            [
                BlazeNumberEntity(
                    coordinator,
                    BlazeNumberDescription(
                        key=f"zone_{zid}_duck_threshold",
                        name=f"Zone {zid} Duck Threshold",
                        register=f"ZONE-{zid}.DUCK.THRESHOLD",
                        native_min_value=-80.0,
                        native_max_value=0.0,
                        native_step=1.0,
                        native_unit_of_measurement="dB",
                        icon="mdi:target",
                        mode=NumberMode.SLIDER,
                    ),
                    device_name,
                    entry.entry_id,
                ),
                BlazeNumberEntity(
                    coordinator,
                    BlazeNumberDescription(
                        key=f"zone_{zid}_duck_depth",
                        name=f"Zone {zid} Duck Depth",
                        register=f"ZONE-{zid}.DUCK.DEPTH",
                        native_min_value=-144.0,
                        native_max_value=0.0,
                        native_step=1.0,
                        native_unit_of_measurement="dB",
                        icon="mdi:arrow-collapse-down",
                        mode=NumberMode.SLIDER,
                    ),
                    device_name,
                    entry.entry_id,
                ),
                BlazeNumberEntity(
                    coordinator,
                    BlazeNumberDescription(
                        key=f"zone_{zid}_duck_attack",
                        name=f"Zone {zid} Duck Attack",
                        register=f"ZONE-{zid}.DUCK.ATTACK",
                        native_min_value=0.001,
                        native_max_value=0.2,
                        native_step=0.001,
                        native_unit_of_measurement="s",
                        icon="mdi:timer",
                        mode=NumberMode.BOX,
                    ),
                    device_name,
                    entry.entry_id,
                ),
                BlazeNumberEntity(
                    coordinator,
                    BlazeNumberDescription(
                        key=f"zone_{zid}_duck_release",
                        name=f"Zone {zid} Duck Release",
                        register=f"ZONE-{zid}.DUCK.RELEASE",
                        native_min_value=0.01,
                        native_max_value=10.0,
                        native_step=0.01,
                        native_unit_of_measurement="s",
                        icon="mdi:timer",
                        mode=NumberMode.BOX,
                    ),
                    device_name,
                    entry.entry_id,
                ),
                BlazeNumberEntity(
                    coordinator,
                    BlazeNumberDescription(
                        key=f"zone_{zid}_duck_hold",
                        name=f"Zone {zid} Duck Hold",
                        register=f"ZONE-{zid}.DUCK.HOLD",
                        native_min_value=0.0,
                        native_max_value=10.0,
                        native_step=0.1,
                        native_unit_of_measurement="s",
                        icon="mdi:timer",
                        mode=NumberMode.BOX,
                    ),
                    device_name,
                    entry.entry_id,
                ),
                BlazeNumberEntity(
                    coordinator,
                    BlazeNumberDescription(
                        key=f"zone_{zid}_duck_override_gain",
                        name=f"Zone {zid} Duck Override Gain",
                        register=f"ZONE-{zid}.DUCK.OVERRIDE_GAIN",
                        native_min_value=-60.0,
                        native_max_value=15.0,
                        native_step=0.5,
                        native_unit_of_measurement="dB",
                        icon="mdi:volume-high",
                        mode=NumberMode.SLIDER,
                    ),
                    device_name,
                    entry.entry_id,
                ),
            ]
        )

        # Zone compressor parameters
        entities.extend(
            [
                BlazeNumberEntity(
                    coordinator,
                    BlazeNumberDescription(
                        key=f"zone_{zid}_comp_threshold",
                        name=f"Zone {zid} Compressor Threshold",
                        register=f"ZONE-{zid}.COMPRESSOR.THRESHOLD",
                        native_min_value=-40.0,
                        native_max_value=20.0,
                        native_step=0.5,
                        native_unit_of_measurement="dB",
                        icon="mdi:target",
                        mode=NumberMode.SLIDER,
                    ),
                    device_name,
                    entry.entry_id,
                ),
                BlazeNumberEntity(
                    coordinator,
                    BlazeNumberDescription(
                        key=f"zone_{zid}_comp_attack",
                        name=f"Zone {zid} Compressor Attack",
                        register=f"ZONE-{zid}.COMPRESSOR.ATTACK",
                        native_min_value=0.0003,
                        native_max_value=0.05,
                        native_step=0.0001,
                        native_unit_of_measurement="s",
                        icon="mdi:timer",
                        mode=NumberMode.BOX,
                    ),
                    device_name,
                    entry.entry_id,
                ),
                BlazeNumberEntity(
                    coordinator,
                    BlazeNumberDescription(
                        key=f"zone_{zid}_comp_release",
                        name=f"Zone {zid} Compressor Release",
                        register=f"ZONE-{zid}.COMPRESSOR.RELEASE",
                        native_min_value=0.001,
                        native_max_value=1.0,
                        native_step=0.001,
                        native_unit_of_measurement="s",
                        icon="mdi:timer",
                        mode=NumberMode.BOX,
                    ),
                    device_name,
                    entry.entry_id,
                ),
                BlazeNumberEntity(
                    coordinator,
                    BlazeNumberDescription(
                        key=f"zone_{zid}_comp_hold",
                        name=f"Zone {zid} Compressor Hold",
                        register=f"ZONE-{zid}.COMPRESSOR.HOLD",
                        native_min_value=0.0,
                        native_max_value=1.0,
                        native_step=0.01,
                        native_unit_of_measurement="s",
                        icon="mdi:timer",
                        mode=NumberMode.BOX,
                    ),
                    device_name,
                    entry.entry_id,
                ),
                BlazeNumberEntity(
                    coordinator,
                    BlazeNumberDescription(
                        key=f"zone_{zid}_comp_ratio",
                        name=f"Zone {zid} Compressor Ratio",
                        register=f"ZONE-{zid}.COMPRESSOR.RATIO",
                        native_min_value=1.0,
                        native_max_value=50.0,
                        native_step=0.5,
                        icon="mdi:contrast-circle",
                        mode=NumberMode.BOX,
                    ),
                    device_name,
                    entry.entry_id,
                ),
                BlazeNumberEntity(
                    coordinator,
                    BlazeNumberDescription(
                        key=f"zone_{zid}_comp_knee",
                        name=f"Zone {zid} Compressor Knee",
                        register=f"ZONE-{zid}.COMPRESSOR.KNEE",
                        native_min_value=0.0,
                        native_max_value=12.0,
                        native_step=0.5,
                        native_unit_of_measurement="dB",
                        icon="mdi:chart-bell-curve",
                        mode=NumberMode.BOX,
                    ),
                    device_name,
                    entry.entry_id,
                ),
            ]
        )

    # Output gains and parameters
    for oid in coordinator.get_output_ids():
        entities.extend(
            [
                BlazeNumberEntity(
                    coordinator,
                    BlazeNumberDescription(
                        key=f"out_{oid}_gain",
                        name=f"Output {oid} Gain",
                        register=f"OUT-{oid}.GAIN",
                        native_min_value=-30.0,
                        native_max_value=15.0,
                        native_step=0.5,
                        native_unit_of_measurement="dB",
                        icon="mdi:volume-high",
                        mode=NumberMode.SLIDER,
                    ),
                    device_name,
                    entry.entry_id,
                ),
                BlazeNumberEntity(
                    coordinator,
                    BlazeNumberDescription(
                        key=f"out_{oid}_highpass",
                        name=f"Output {oid} Highpass Freq",
                        register=f"OUT-{oid}.OUTPUT_HIGHPASS",
                        native_min_value=0.0,
                        native_max_value=1000.0,
                        native_step=1.0,
                        native_unit_of_measurement="Hz",
                        icon="mdi:sine-wave",
                        mode=NumberMode.BOX,
                    ),
                    device_name,
                    entry.entry_id,
                ),
                BlazeNumberEntity(
                    coordinator,
                    BlazeNumberDescription(
                        key=f"out_{oid}_delay_time",
                        name=f"Output {oid} Delay Time",
                        register=f"OUT-{oid}.DELAY.TIME",
                        native_min_value=0.0,
                        native_max_value=0.1,
                        native_step=0.001,
                        native_unit_of_measurement="s",
                        icon="mdi:timer",
                        mode=NumberMode.BOX,
                    ),
                    device_name,
                    entry.entry_id,
                ),
            ]
        )

    # Generator parameters
    entities.extend(
        [
            BlazeNumberEntity(
                coordinator,
                BlazeNumberDescription(
                    key="gen_sine_freq",
                    name="Generator Sine Frequency",
                    register="GENERATOR.SINE.FREQ",
                    native_min_value=20.0,
                    native_max_value=20000.0,
                    native_step=1.0,
                    native_unit_of_measurement="Hz",
                    icon="mdi:sine-wave",
                    mode=NumberMode.BOX,
                ),
                device_name,
                entry.entry_id,
            ),
            BlazeNumberEntity(
                coordinator,
                BlazeNumberDescription(
                    key="gen_pink_lpf_freq",
                    name="Generator Pink LPF Frequency",
                    register="GENERATOR.PINK.LPF_FREQ",
                    native_min_value=20.0,
                    native_max_value=20000.0,
                    native_step=1.0,
                    native_unit_of_measurement="Hz",
                    icon="mdi:sine-wave",
                    mode=NumberMode.BOX,
                ),
                device_name,
                entry.entry_id,
            ),
            BlazeNumberEntity(
                coordinator,
                BlazeNumberDescription(
                    key="gen_pink_hpf_freq",
                    name="Generator Pink HPF Frequency",
                    register="GENERATOR.PINK.HPF_FREQ",
                    native_min_value=20.0,
                    native_max_value=20000.0,
                    native_step=1.0,
                    native_unit_of_measurement="Hz",
                    icon="mdi:sine-wave",
                    mode=NumberMode.BOX,
                ),
                device_name,
                entry.entry_id,
            ),
        ]
    )

    # Power management
    entities.extend(
        [
            BlazeNumberEntity(
                coordinator,
                BlazeNumberDescription(
                    key="power_mute_time",
                    name="Power Mute Time",
                    register="SETUP.POWER.MUTE_TIME",
                    native_min_value=0,
                    native_max_value=3600,
                    native_step=1,
                    native_unit_of_measurement="s",
                    icon="mdi:timer",
                    mode=NumberMode.BOX,
                ),
                device_name,
                entry.entry_id,
            ),
            BlazeNumberEntity(
                coordinator,
                BlazeNumberDescription(
                    key="power_standby_time",
                    name="Power Standby Time",
                    register="SETUP.POWER.STANDBY_TIME",
                    native_min_value=0,
                    native_max_value=3600,
                    native_step=1,
                    native_unit_of_measurement="s",
                    icon="mdi:timer",
                    mode=NumberMode.BOX,
                ),
                device_name,
                entry.entry_id,
            ),
        ]
    )

    async_add_entities(entities)


class BlazeNumberEntity(CoordinatorEntity[BlazeCoordinator], NumberEntity):
    """Representation of a Blaze number entity."""

    entity_description: BlazeNumberDescription
    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: BlazeCoordinator,
        description: BlazeNumberDescription,
        device_name: str,
        entry_id: str,
    ) -> None:
        """Initialize the number entity."""
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
    def native_value(self) -> float | None:
        """Return the current value."""
        value = self.coordinator.get_value(self.entity_description.register)
        if not value:
            return None
        try:
            return float(value)
        except (ValueError, TypeError):
            return None

    async def async_set_native_value(self, value: float) -> None:
        """Set the value."""
        await self.coordinator.async_set_register(
            self.entity_description.register, value
        )

    @property
    def available(self) -> bool:
        """Return True if entity is available."""
        return self.coordinator.last_update_success
