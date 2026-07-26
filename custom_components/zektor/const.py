"""Constants for Zektor Audio System integration."""

import logging

_LOGGER = logging.getLogger(__name__)

DOMAIN = "zektor"
MANUFACTURER = "Zektor"

# Connection defaults
DEFAULT_PORT = 50005
DEFAULT_NAME = "Zektor Audio System"
DEFAULT_SCAN_INTERVAL = 30
CONF_HOST = "host"
CONF_PORT = "port"
CONF_NAME = "name"
CONF_ZONES = "zones"

# Polling profile (60 s safety-net reconcile; real updates are push-driven)
DEFAULT_SCAN_INTERVAL = 60

# Source ranges
MAX_ANALOG_SOURCE = 80
MAX_DIGITAL_SOURCE = 144

# API Timeouts
TCP_TIMEOUT = 10
TCP_RETRY_DELAY = 2
TCP_BACKOFF_MAX = 60

# Protocol constants
COMMAND_START = "^"
COMMAND_END = "$"
COMMAND_TIMEOUT = 0.5

# Power states
POWER_OFF = 0
POWER_ON = 1
POWER_LOCKED = 3

# Mute states
MUTE_OFF = 0
MUTE_ON = 1

# Volume ranges
MIN_VOLUME = 0
MAX_VOLUME = 248
CENTER_VOLUME = 200  # 0 dB
MUTE_LEVEL = 0

# Bass/Treble/EQ ranges
MIN_EQUALIZER = 88
MAX_EQUALIZER = 168
CENTER_EQUALIZER = 128  # 0 dB

# Balance ranges
MIN_BALANCE = 0
MAX_BALANCE = 400
CENTER_BALANCE = 200  # Center

# Zone numbering (ClarityAudio: max 2, ProAudio: up to 64)
MAX_ZONES = 64

# Default entities to create
DEFAULT_ZONES = 4

# Platform list
PLATFORMS = [
    "sensor",
    "switch",
    "button",
    "number",
    "select",
]

# Attributes for entities
ATTR_ZONE = "zone"
ATTR_SOURCE = "source"
ATTR_VOLUME = "volume"
ATTR_MUTE = "mute"
ATTR_BASS = "bass"
ATTR_TREBLE = "treble"
ATTR_BALANCE = "balance"

# Command names
CMD_POWER = "P"
CMD_SOURCE_ANALOG = "SZ"
CMD_SOURCE_DIGITAL = "DSZ"
CMD_MUTE_ANALOG = "MZ"
CMD_MUTE_DIGITAL = "DMZ"
CMD_MUTE_VOLUME = "VMZ"
CMD_VOLUME = "VZ"
CMD_VOLUME_PERCENT = "VPZ"
CMD_VOLUME_MIN = "VMIZ"
CMD_VOLUME_MAX = "VMAZ"
CMD_BASS = "BAZ"
CMD_TREBLE = "TRZ"
CMD_BALANCE = "BLZ"
CMD_GAIN_OUTPUT = "GAZ"
CMD_GAIN_INPUT = "GAI"
CMD_MUTE_LEVEL = "VMLZ"
CMD_LOCK_ZONE = "LZ"
CMD_DELAY_SWITCH = "DZ"
CMD_DELAY_DIGITAL = "DDZ"
CMD_SWITCH_DELAY = "DZ"
CMD_POWER_ZONE = "PZ"

# Delay ranges (milliseconds)
MIN_DELAY = 0
MAX_DELAY = 10000

# Default config
DEFAULT_CONFIG = {
    CONF_NAME: DEFAULT_NAME,
    CONF_PORT: DEFAULT_PORT,
    CONF_ZONES: DEFAULT_ZONES,
}

# Service descriptions
SERVICE_SET_VOLUME = "set_volume"
SERVICE_MUTE = "mute"
SERVICE_SET_SOURCE = "set_source"
SERVICE_SET_BASS = "set_bass"
SERVICE_SET_TREBLE = "set_treble"
