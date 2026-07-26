"""Sensor platform for Zektor Audio System."""

import logging
from typing import Optional

from homeassistant.components.sensor import SensorEntity, SensorStateClass
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
    """Set up sensor entities."""
    data = hass.data[DOMAIN][entry.entry_id]
    coordinator = data["coordinator"]
    zones = data["zones"]

    entities: list[SensorEntity] = []

    # Add power status sensor
    entities.append(ZektorPowerSensor(coordinator, entry))

    # Add zone sensors
    for zone_num in range(1, zones + 1):
        entities.append(ZektorZoneVolumeSensor(coordinator, entry, zone_num))
        entities.append(ZektorZoneSourceSensor(coordinator, entry, zone_num))
        entities.append(ZektorZoneDigitalSourceSensor(coordinator, entry, zone_num))
        entities.append(ZektorZoneCrossoverTypeSensor(coordinator, entry, zone_num))
        entities.append(
            ZektorZoneCrossoverFrequencySensor(coordinator, entry, zone_num)
        )

    async_add_entities(entities)


class ZektorPowerSensor(ZektorEntity, SensorEntity):
    """Power status sensor."""

    _attr_name = "Power"
    _attr_unique_id = "zektor_power"

    @property
    def native_value(self) -> Optional[str]:
        """Return the state."""
        if self.coordinator.data is None:
            return None

        power = self.coordinator.data.get("power")
        if power == 0:
            return "off"
        elif power == 1:
            return "on"
        elif power == 3:
            return "locked"
        return None


class ZektorZoneVolumeSensor(ZektorEntity, SensorEntity):
    """Zone volume sensor."""

    _attr_state_class = SensorStateClass.MEASUREMENT

    def __init__(self, coordinator, entry, zone: int) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, entry, zone)
        self._attr_name = f"Zone {zone} Volume"
        self._attr_unique_id = f"zektor_zone_{zone}_volume"

    @property
    def native_value(self) -> Optional[int]:
        """Return the volume level (0-248)."""
        if self.coordinator.data is None:
            return None

        zone_data = self.coordinator.data.get("zones", {}).get(f"zone_{self._zone}")
        if zone_data is None:
            return None

        return zone_data.get("volume")

    @property
    def native_unit_of_measurement(self) -> str:
        """Return unit."""
        return "steps"


class ZektorZoneSourceSensor(ZektorEntity, SensorEntity):
    """Zone source sensor."""

    def __init__(self, coordinator, entry, zone: int) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, entry, zone)
        self._attr_name = f"Zone {zone} Source"
        self._attr_unique_id = f"zektor_zone_{zone}_source"

    @property
    def native_value(self) -> Optional[int]:
        """Return the current source."""
        if self.coordinator.data is None:
            return None

        zone_data = self.coordinator.data.get("zones", {}).get(f"zone_{self._zone}")
        if zone_data is None:
            return None

        return zone_data.get("source")


class ZektorZoneDigitalSourceSensor(ZektorEntity, SensorEntity):
    """Zone digital source sensor (DSZ)."""

    def __init__(self, coordinator, entry, zone: int) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, entry, zone)
        self._attr_name = f"Zone {zone} Digital Source"
        self._attr_unique_id = f"zektor_zone_{zone}_digital_source_sensor"

    @property
    def native_value(self) -> Optional[int]:
        """Return the current digital source id."""
        if self.coordinator.data is None:
            return None

        zone_data = self.coordinator.data.get("zones", {}).get(f"zone_{self._zone}")
        if zone_data is None:
            return None

        return zone_data.get("digital_source")


class ZektorZoneCrossoverTypeSensor(ZektorEntity, SensorEntity):
    """Zone crossover type sensor (FTYPZ)."""

    def __init__(self, coordinator, entry, zone: int) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, entry, zone)
        self._attr_name = f"Zone {zone} Crossover Type"
        self._attr_unique_id = f"zektor_zone_{zone}_crossover_type"

    @property
    def native_value(self) -> Optional[int]:
        """Return crossover type id (0..5)."""
        if self.coordinator.data is None:
            return None

        zone_data = self.coordinator.data.get("zones", {}).get(f"zone_{self._zone}")
        if zone_data is None:
            return None

        return zone_data.get("crossover_type")


class ZektorZoneCrossoverFrequencySensor(ZektorEntity, SensorEntity):
    """Zone crossover frequency sensor (FFRQZ)."""

    def __init__(self, coordinator, entry, zone: int) -> None:
        """Initialize the sensor."""
        super().__init__(coordinator, entry, zone)
        self._attr_name = f"Zone {zone} Crossover Frequency"
        self._attr_unique_id = f"zektor_zone_{zone}_crossover_frequency"

    @property
    def native_value(self) -> Optional[int]:
        """Return crossover frequency index (0..32)."""
        if self.coordinator.data is None:
            return None

        zone_data = self.coordinator.data.get("zones", {}).get(f"zone_{self._zone}")
        if zone_data is None:
            return None

        return zone_data.get("crossover_frequency")
