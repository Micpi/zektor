"""Constants for the Blaze PowerZone Connect integration."""

DOMAIN = "blaze_powerzone"
DEFAULT_PORT = 7621
DEFAULT_NAME = "Blaze PowerZone Connect"
WEBSOCKET_PATH = "/ws"

# mDNS service type
MDNS_SERVICE_TYPE = "_pasconnect._tcp.local."

# Config keys
CONF_HOST = "host"
CONF_PORT = "port"
CONF_NAME = "name"

# Data keys
DATA_COORDINATOR = "coordinator"
DATA_API = "api"

# Services
SERVICE_SEND_RAW_COMMAND = "send_raw_command"
ATTR_ENTRY_ID = "entry_id"
ATTR_COMMAND = "command"

# Scan interval in seconds
SCAN_INTERVAL_SECONDS = 30

# Connection timeout
CONNECTION_TIMEOUT = 10

# Input channel IDs
INPUT_CHANNELS = {
    100: "Analog Input 1",
    101: "Analog Input 2",
    102: "Analog Input 3",
    103: "Analog Input 4",
    104: "Analog Input 5",
    105: "Analog Input 6",
    106: "Analog Input 7",
    107: "Analog Input 8",
    200: "SPDIF 1 (Left)",
    201: "SPDIF 1 (Right)",
    300: "Dante 1",
    301: "Dante 2",
    302: "Dante 3",
    303: "Dante 4",
    400: "Noise Generator",
}

# Zone IDs
ZONE_IDS = ["A", "B", "C", "D", "E", "F", "G", "H"]

# Output channel IDs
OUTPUT_CHANNELS = [1, 2, 3, 4, 5, 6, 7, 8]

# Input source IDs
INPUT_SOURCES = {
    0: "Unused (Silent)",
    100: "Analog Input 1",
    101: "Analog Input 2",
    102: "Analog Input 3",
    103: "Analog Input 4",
    104: "Analog Input 5",
    105: "Analog Input 6",
    106: "Analog Input 7",
    107: "Analog Input 8",
    200: "SPDIF 1 (Left)",
    201: "SPDIF 1 (Right)",
    300: "Dante 1",
    301: "Dante 2",
    302: "Dante 3",
    303: "Dante 4",
    400: "Noise Generator",
    500: "Mix 1",
    501: "Mix 2",
    502: "Mix 3",
    503: "Mix 4",
    504: "Mix 5",
    505: "Mix 6",
    506: "Mix 7",
    507: "Mix 8",
}

# Input sensitivity options
INPUT_SENSITIVITY_OPTIONS = ["14DBU", "4DBU", "-10DBV", "MIC"]

# Output mode options
OUTPUT_MODE_OPTIONS = ["OFF", "8R", "70V", "100V", "BTL"]

# Output source channel options
OUTPUT_SRC_CHANNEL_OPTIONS = ["L", "R", "S"]

# Generator type options
GENERATOR_TYPE_OPTIONS = ["PINK", "SINE"]

# Ducker mode options
DUCKER_MODE_OPTIONS = ["OFF", "DUCKER", "OVERRIDE"]

# Power on mode options
POWER_ON_MODE_OPTIONS = [
    "AUDIO",
    "AUDIO_ECO",
    "TRIGGER",
    "TRIGGER_ECO",
    "NETWORK",
    "AUDIO_DSP",
]

# System states
SYSTEM_STATES = ["INIT", "STANDBY", "ON", "FAULT"]

# Signal states
SIGNAL_STATES = ["OFF", "NO_SIGNAL", "SIGNAL", "CLIP"]
SIGNAL_OUT_STATES = ["OFF", "NO_SIGNAL", "SIGNAL", "CLIP", "FAULT"]

# EQ types
EQ_TYPE_OPTIONS = [
    "PARAMETRIC",
    "LOWPASS_6",
    "HIGHPASS_6",
    "LOWPASS_12",
    "HIGHPASS_12",
    "LOW_SHELF",
    "LOW_SHELF_Q",
    "LOW_SHELF_6",
    "LOW_SHELF_12",
    "HIGH_SHELF",
    "HIGH_SHELF_Q",
    "HIGH_SHELF_6",
    "HIGH_SHELF_12",
    "BANDPASS",
    "NOTCH",
    "ALLPASS_1",
    "ALLPASS_2",
]

INPUT_EQ_TYPE_OPTIONS = [
    "PARAMETRIC",
    "LOWPASS_12",
    "HIGHPASS_12",
    "LOW_SHELF_Q",
    "HIGH_SHELF_Q",
]

# GPIO Pin options
GPIO_PIN2_OPTIONS = ["OFF", "STANDBY_NO", "STANDBY_NC", "MUTE_NO", "MUTE_NC"]
GPIO_PIN4_OPTIONS = ["OFF", "VOLUME_CONTROL"]
GPIO_PIN5_OPTIONS = ["OFF", "VOLUME_CONTROL"]
GPIO_PIN6_OPTIONS = ["OFF", "VOLUME_CONTROL", "TRIGGER_12V_IN"]
GPIO_PIN7_OPTIONS = ["OFF", "VOLUME_CONTROL", "TRIGGER_12V_OUT"]

# Crossover filter types
CROSSOVER_TYPE_OPTIONS = [
    "OFF",
    "BUT6",
    "BUT12",
    "BUT18",
    "BUT24",
    "BUT48",
    "BES12",
    "BES24",
    "BES48",
    "LR12",
    "LR24",
    "LR36",
    "LR48",
]

# Clip limiter mode
CLIP_LIMITER_MODE_OPTIONS = ["NORMAL", "FAST"]

# Platforms
PLATFORMS = ["sensor", "number", "switch", "select", "button"]
