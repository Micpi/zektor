"""Switch entities for Blaze PowerZone Connect."""
# pylint: disable=unexpected-keyword-arg,abstract-method,duplicate-code
from __future__ import annotations

import logging
from dataclasses import dataclass
from typing import Any

from homeassistant.components.switch import SwitchEntity, SwitchEntityDescription
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
class BlazeSwitchDescription(SwitchEntityDescription):
    """Describe a Blaze switch entity."""

    register: str = ""
    inverted: bool = False  # For bypass registers where 1=disabled


async def async_setup_entry(
    hass: HomeAssistant,
    entry: ConfigEntry,
    async_add_entities: AddEntitiesCallback,
) -> None:
    """Set up Blaze switch entities from config entry."""
    coordinator: BlazeCoordinator = hass.data[DOMAIN][entry.entry_id][DATA_COORDINATOR]
    device_name = entry.data.get(CONF_NAME, "Blaze PowerZone")

    entities: list[BlazeSwitchEntity] = []

    # Input switches (analog inputs only for some)
    for iid in coordinator.get_input_ids():
        ch_name = INPUT_CHANNELS.get(iid, f"Input {iid}")

        # Stereo (only primary channels: 100, 102)
        if iid in (100, 102):
            entities.append(
                BlazeSwitchEntity(
                    coordinator,
                    BlazeSwitchDescription(
                        key=f"in_{iid}_stereo",
                        name=f"{ch_name} Stereo",
                        register=f"IN-{iid}.STEREO",
                        icon="mdi:surround-sound",
                    ),
                    device_name,
                    entry.entry_id,
                )
            )

        # HPF Enable (analog inputs only)
        if 100 <= iid <= 107:
            entities.append(
                BlazeSwitchEntity(
                    coordinator,
                    BlazeSwitchDescription(
                        key=f"in_{iid}_hpf",
                        name=f"{ch_name} HPF",
                        register=f"IN-{iid}.HPF_ENABLE",
                        icon="mdi:filter",
                    ),
                    device_name,
                    entry.entry_id,
                )
            )

            # EQ Bypass (inverted: 0=enabled, 1=bypassed)
            entities.append(
                BlazeSwitchEntity(
                    coordinator,
                    BlazeSwitchDescription(
                        key=f"in_{iid}_eq_bypass",
                        name=f"{ch_name} EQ Bypass",
                        register=f"IN-{iid}.EQ.BYPASS",
                        icon="mdi:equalizer",
                    ),
                    device_name,
                    entry.entry_id,
                )
            )

    # Input EQ band bypass
    analog_inputs = [iid for iid in coordinator.get_input_ids() if 100 <= iid <= 107]
    eq_count = coordinator.get_int("IN.EQ.COUNT", 5)
    for iid in analog_inputs:
        ch_name = INPUT_CHANNELS.get(iid, f"Input {iid}")
        for eid in range(1, eq_count + 1):
            entities.append(
                BlazeSwitchEntity(
                    coordinator,
                    BlazeSwitchDescription(
                        key=f"in_{iid}_eq_{eid}_bypass",
                        name=f"{ch_name} EQ{eid} Bypass",
                        register=f"IN-{iid}.EQ-{eid}.BYPASS",
                        icon="mdi:equalizer",
                    ),
                    device_name,
                    entry.entry_id,
                )
            )

    # Zone switches
    for zid in coordinator.get_zone_ids():
        entities.extend([
            # Zone Mute
            BlazeSwitchEntity(
                coordinator,
                BlazeSwitchDescription(
                    key=f"zone_{zid}_mute",
                    name=f"Zone {zid} Mute",
                    register=f"ZONE-{zid}.MUTE",
                    icon="mdi:volume-off",
                ),
                device_name,
                entry.entry_id,
            ),
            # Zone Mute Enable
            BlazeSwitchEntity(
                coordinator,
                BlazeSwitchDescription(
                    key=f"zone_{zid}_mute_enable",
                    name=f"Zone {zid} Mute Enable",
                    register=f"ZONE-{zid}.MUTE_ENABLE",
                    icon="mdi:volume-off",
                ),
                device_name,
                entry.entry_id,
            ),
            # Zone Stereo (only primary zones A, C, E, G)
        ])

        if zid in ("A", "C", "E", "G"):
            entities.append(
                BlazeSwitchEntity(
                    coordinator,
                    BlazeSwitchDescription(
                        key=f"zone_{zid}_stereo",
                        name=f"Zone {zid} Stereo",
                        register=f"ZONE-{zid}.STEREO",
                        icon="mdi:surround-sound",
                    ),
                    device_name,
                    entry.entry_id,
                )
            )

        # Zone Ducker Auto
        entities.append(
            BlazeSwitchEntity(
                coordinator,
                BlazeSwitchDescription(
                    key=f"zone_{zid}_duck_auto",
                    name=f"Zone {zid} Duck Auto",
                    register=f"ZONE-{zid}.DUCK.AUTO",
                    icon="mdi:auto-fix",
                ),
                device_name,
                entry.entry_id,
            )
        )

        # Zone Ducker Override Gain Enable
        entities.append(
            BlazeSwitchEntity(
                coordinator,
                BlazeSwitchDescription(
                    key=f"zone_{zid}_duck_override_enable",
                    name=f"Zone {zid} Duck Override Enable",
                    register=f"ZONE-{zid}.DUCK.OVERRIDE_GAIN_ENABLE",
                    icon="mdi:swap-horizontal",
                ),
                device_name,
                entry.entry_id,
            )
        )

        # Zone Compressor Auto
        entities.append(
            BlazeSwitchEntity(
                coordinator,
                BlazeSwitchDescription(
                    key=f"zone_{zid}_comp_auto",
                    name=f"Zone {zid} Compressor Auto",
                    register=f"ZONE-{zid}.COMPRESSOR.AUTO",
                    icon="mdi:auto-fix",
                ),
                device_name,
                entry.entry_id,
            )
        )

        # Zone Compressor Bypass
        entities.append(
            BlazeSwitchEntity(
                coordinator,
                BlazeSwitchDescription(
                    key=f"zone_{zid}_comp_bypass",
                    name=f"Zone {zid} Compressor Bypass",
                    register=f"ZONE-{zid}.COMPRESSOR.BYPASS",
                    icon="mdi:fast-forward",
                ),
                device_name,
                entry.entry_id,
            )
        )

    # Output switches
    for oid in coordinator.get_output_ids():
        entities.extend([
            # Output Mute
            BlazeSwitchEntity(
                coordinator,
                BlazeSwitchDescription(
                    key=f"out_{oid}_mute",
                    name=f"Output {oid} Mute",
                    register=f"OUT-{oid}.MUTE",
                    icon="mdi:volume-off",
                ),
                device_name,
                entry.entry_id,
            ),
            # Output Delay Bypass
            BlazeSwitchEntity(
                coordinator,
                BlazeSwitchDescription(
                    key=f"out_{oid}_delay_bypass",
                    name=f"Output {oid} Delay Bypass",
                    register=f"OUT-{oid}.DELAY.BYPASS",
                    icon="mdi:fast-forward",
                ),
                device_name,
                entry.entry_id,
            ),
        ])

    # Generator switches
    entities.extend([
        BlazeSwitchEntity(
            coordinator,
            BlazeSwitchDescription(
                key="gen_pink_lpf_enable",
                name="Generator Pink LPF Enable",
                register="GENERATOR.PINK.LPF_ENABLE",
                icon="mdi:filter",
            ),
            device_name,
            entry.entry_id,
        ),
        BlazeSwitchEntity(
            coordinator,
            BlazeSwitchDescription(
                key="gen_pink_hpf_enable",
                name="Generator Pink HPF Enable",
                register="GENERATOR.PINK.HPF_ENABLE",
                icon="mdi:filter",
            ),
            device_name,
            entry.entry_id,
        ),
    ])

    # System locating
    entities.append(
        BlazeSwitchEntity(
            coordinator,
            BlazeSwitchDescription(
                key="system_locating",
                name="System Locating",
                register="SETUP.SYSTEM.LOCATING",
                icon="mdi:target",
            ),
            device_name,
            entry.entry_id,
        )
    )

    async_add_entities(entities)


class BlazeSwitchEntity(CoordinatorEntity[BlazeCoordinator], SwitchEntity):
    """Representation of a Blaze switch entity."""

    entity_description: BlazeSwitchDescription
    _attr_has_entity_name = True

    def __init__(
        self,
        coordinator: BlazeCoordinator,
        description: BlazeSwitchDescription,
        device_name: str,
        entry_id: str,
    ) -> None:
        """Initialize the switch entity."""
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
    def is_on(self) -> bool | None:
        """Return True if the switch is on."""
        value = self.coordinator.get_value(self.entity_description.register)
        if not value and value != "0":
            return None
        try:
            result = int(float(value)) != 0
            if self.entity_description.inverted:
                return not result
            return result
        except (ValueError, TypeError):
            return None

    async def async_turn_on(self, **kwargs: Any) -> None:
        """Turn the switch on."""
        value = 0 if self.entity_description.inverted else 1
        await self.coordinator.async_set_register(
            self.entity_description.register, value
        )

    async def async_turn_off(self, **kwargs: Any) -> None:
        """Turn the switch off."""
        value = 1 if self.entity_description.inverted else 0
        await self.coordinator.async_set_register(
            self.entity_description.register, value
        )

    @property
    def available(self) -> bool:
        """Return True if entity is available."""
        return self.coordinator.last_update_success
