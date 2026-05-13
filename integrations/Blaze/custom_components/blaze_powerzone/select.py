"""Select entities for Blaze PowerZone Connect."""
# pylint: disable=unexpected-keyword-arg,abstract-method,too-many-locals,line-too-long,consider-using-in,duplicate-code
from __future__ import annotations

import logging
from dataclasses import dataclass

from homeassistant.components.select import SelectEntity, SelectEntityDescription
from homeassistant.config_entries import ConfigEntry
from homeassistant.const import CONF_NAME
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.device_registry import DeviceInfo
from homeassistant.helpers.entity_platform import AddEntitiesCallback
from homeassistant.helpers.update_coordinator import CoordinatorEntity

from .const import (
    DATA_COORDINATOR,
    DOMAIN,
    DUCKER_MODE_OPTIONS,
    GENERATOR_TYPE_OPTIONS,
    INPUT_CHANNELS,
    INPUT_EQ_TYPE_OPTIONS,
    INPUT_SENSITIVITY_OPTIONS,
    INPUT_SOURCES,
    OUTPUT_MODE_OPTIONS,
    OUTPUT_SRC_CHANNEL_OPTIONS,
    POWER_ON_MODE_OPTIONS,
)
from .coordinator import BlazeCoordinator

_LOGGER = logging.getLogger(__name__)


@dataclass(frozen=True, kw_only=True)
class BlazeSelectDescription(SelectEntityDescription):
    """Describe a Blaze select entity."""

    register: str = ""
    value_map: dict[str, str] | None = None  # display -> api value mapping


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Blaze select entities from config entry."""
    coordinator: BlazeCoordinator = hass.data[DOMAIN][entry.entry_id][DATA_COORDINATOR]
    device_name = entry.data.get(CONF_NAME, "Blaze PowerZone")

    entities: list[BlazeSelectEntity] = []

    # Input sensitivity (analog inputs only)
    for iid in coordinator.get_input_ids():
        if 100 <= iid <= 107:
            ch_name = INPUT_CHANNELS.get(iid, f"Input {iid}")
            entities.append(
                BlazeSelectEntity(
                    coordinator,
                    BlazeSelectDescription(
                        key=f"in_{iid}_sens",
                        name=f"{ch_name} Sensitivity",
                        register=f"IN-{iid}.SENS",
                        options=INPUT_SENSITIVITY_OPTIONS,
                        icon="mdi:signal-variant",
                    ),
                    device_name,
                    entry.entry_id,
                )
            )

    # Input EQ band type (analog inputs only)
    analog_inputs = [iid for iid in coordinator.get_input_ids() if 100 <= iid <= 107]
    eq_count = coordinator.get_int("IN.EQ.COUNT", 5)
    for iid in analog_inputs:
        ch_name = INPUT_CHANNELS.get(iid, f"Input {iid}")
        for eid in range(1, eq_count + 1):
            entities.append(
                BlazeSelectEntity(
                    coordinator,
                    BlazeSelectDescription(
                        key=f"in_{iid}_eq_{eid}_type",
                        name=f"{ch_name} EQ{eid} Type",
                        register=f"IN-{iid}.EQ-{eid}.TYPE",
                        options=INPUT_EQ_TYPE_OPTIONS,
                        icon="mdi:equalizer",
                    ),
                    device_name,
                    entry.entry_id,
                )
            )

    # Zone source selects
    # Build source options based on available inputs
    source_options = []
    source_value_map = {}
    for sid, sname in sorted(INPUT_SOURCES.items()):
        label = f"{sname} ({sid})"
        source_options.append(label)
        source_value_map[label] = str(sid)

    for zid in coordinator.get_zone_ids():
        # Zone Primary Source
        entities.append(
            BlazeSelectEntity(
                coordinator,
                BlazeSelectDescription(
                    key=f"zone_{zid}_primary_src",
                    name=f"Zone {zid} Primary Source",
                    register=f"ZONE-{zid}.PRIMARY_SRC",
                    options=source_options,
                    value_map=source_value_map,
                    icon="mdi:import",
                ),
                device_name,
                entry.entry_id,
            )
        )

        # Zone Priority Source
        entities.append(
            BlazeSelectEntity(
                coordinator,
                BlazeSelectDescription(
                    key=f"zone_{zid}_priority_src",
                    name=f"Zone {zid} Priority Source",
                    register=f"ZONE-{zid}.PRIORITY_SRC",
                    options=source_options,
                    value_map=source_value_map,
                    icon="mdi:priority-high",
                ),
                device_name,
                entry.entry_id,
            )
        )

        # Zone GPIO Volume Control
        vc_options = ["OFF (0)", "GPIO PIN 4 (1)", "GPIO PIN 5 (2)", "GPIO PIN 6 (3)", "GPIO PIN 7 (4)"]
        vc_value_map = {
            "OFF (0)": "0",
            "GPIO PIN 4 (1)": "1",
            "GPIO PIN 5 (2)": "2",
            "GPIO PIN 6 (3)": "3",
            "GPIO PIN 7 (4)": "4",
        }
        entities.append(
            BlazeSelectEntity(
                coordinator,
                BlazeSelectDescription(
                    key=f"zone_{zid}_gpio_vc",
                    name=f"Zone {zid} GPIO Volume Control",
                    register=f"ZONE-{zid}.GPIO_VC",
                    options=vc_options,
                    value_map=vc_value_map,
                    icon="mdi:knob",
                ),
                device_name,
                entry.entry_id,
            )
        )

        # Zone Ducker Mode
        entities.append(
            BlazeSelectEntity(
                coordinator,
                BlazeSelectDescription(
                    key=f"zone_{zid}_duck_mode",
                    name=f"Zone {zid} Duck Mode",
                    register=f"ZONE-{zid}.DUCK.MODE",
                    options=DUCKER_MODE_OPTIONS,
                    icon="mdi:duck",
                ),
                device_name,
                entry.entry_id,
            )
        )

    # Output selects
    zone_options = coordinator.get_zone_ids()
    for oid in coordinator.get_output_ids():
        # Output Source (Zone)
        entities.append(
            BlazeSelectEntity(
                coordinator,
                BlazeSelectDescription(
                    key=f"out_{oid}_src",
                    name=f"Output {oid} Source Zone",
                    register=f"OUT-{oid}.SRC",
                    options=zone_options,
                    icon="mdi:import",
                ),
                device_name,
                entry.entry_id,
            )
        )

        # Output Source Channel
        entities.append(
            BlazeSelectEntity(
                coordinator,
                BlazeSelectDescription(
                    key=f"out_{oid}_src_channel",
                    name=f"Output {oid} Source Channel",
                    register=f"OUT-{oid}.SRC_CHANNEL",
                    options=OUTPUT_SRC_CHANNEL_OPTIONS,
                    icon="mdi:speaker",
                ),
                device_name,
                entry.entry_id,
            )
        )

        # Output Mode
        entities.append(
            BlazeSelectEntity(
                coordinator,
                BlazeSelectDescription(
                    key=f"out_{oid}_mode",
                    name=f"Output {oid} Mode",
                    register=f"OUT-{oid}.OUTPUT_MODE",
                    options=OUTPUT_MODE_OPTIONS,
                    icon="mdi:speaker-wireless",
                ),
                device_name,
                entry.entry_id,
            )
        )

        # Output Polarity
        polarity_options = ["Normal (1)", "Reversed (-1)"]
        polarity_map = {"Normal (1)": "1", "Reversed (-1)": "-1"}
        entities.append(
            BlazeSelectEntity(
                coordinator,
                BlazeSelectDescription(
                    key=f"out_{oid}_polarity",
                    name=f"Output {oid} Polarity",
                    register=f"OUT-{oid}.POLARITY",
                    options=polarity_options,
                    value_map=polarity_map,
                    icon="mdi:swap-horizontal",
                ),
                device_name,
                entry.entry_id,
            )
        )

    # Generator Type
    entities.append(
        BlazeSelectEntity(
            coordinator,
            BlazeSelectDescription(
                key="gen_type",
                name="Generator Type",
                register="GENERATOR.TYPE",
                options=GENERATOR_TYPE_OPTIONS,
                icon="mdi:waveform",
            ),
            device_name,
            entry.entry_id,
        )
    )

    # Power On Mode
    entities.append(
        BlazeSelectEntity(
            coordinator,
            BlazeSelectDescription(
                key="power_on_mode",
                name="Power On Mode",
                register="SETUP.POWER.POWER_ON",
                options=POWER_ON_MODE_OPTIONS,
                icon="mdi:power-settings",
            ),
            device_name,
            entry.entry_id,
        )
    )

    async_add_entities(entities)


class BlazeSelectEntity(CoordinatorEntity[BlazeCoordinator], SelectEntity):
    """Representation of a Blaze select entity."""

    entity_description: BlazeSelectDescription
    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: BlazeCoordinator,
        description: BlazeSelectDescription,
        device_name: str,
        entry_id: str,
    ) -> None:
        """Initialize the select entity."""
        super().__init__(coordinator)
        self.entity_description = description
        self._attr_unique_id = f"{entry_id}_{description.key}"
        self._attr_options = description.options or []
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
    def current_option(self) -> str | None:
        """Return the current option."""
        value = self.coordinator.get_value(self.entity_description.register)
        if not value:
            return None

        # If we have a value map, find the display value
        if self.entity_description.value_map:
            reverse_map = {v: k for k, v in self.entity_description.value_map.items()}
            if value in reverse_map:
                return reverse_map[value]
            # Try to match without quotes
            clean = value.strip('"')
            if clean in reverse_map:
                return reverse_map[clean]

        # Direct match
        clean = value.strip('"')
        if clean in self._attr_options:
            return clean

        # If it's a simple value, return as-is if it's in options
        for opt in self._attr_options:
            if opt == value or opt == clean:
                return opt

        return None

    async def async_select_option(self, option: str) -> None:
        """Change the selected option."""
        # If we have a value map, use it
        if self.entity_description.value_map:
            api_value = self.entity_description.value_map.get(option, option)
        else:
            api_value = option

        await self.coordinator.async_set_register(
            self.entity_description.register, api_value
        )

    @property
    def available(self) -> bool:
        """Return True if entity is available."""
        return self.coordinator.last_update_success
