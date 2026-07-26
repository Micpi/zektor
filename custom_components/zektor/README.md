# Zektor Audio System Integration

## Overview

Complete Home Assistant integration for Zektor Audio System (ClarityAudio/ProAudio) - a professional audio distribution platform with TCP/IP control.

### Features

✨ **Core Features:**
- 🔌 Power control (on/off/locked state)
- 🎵 Multi-zone audio routing (up to 64 zones)
- 🔊 Per-zone volume control (0-248 steps, 0.5 dB precision)
- 🔇 Per-zone mute control
- 🎚️ Bass and Treble controls per zone (±40 dB)
- ⚖️ Balance control per zone
- 📊 Real-time status monitoring
- 🔄 Automatic reconnection with backoff
- 🌐 TCP/IP communication (port 50005)
- 📝 Full async/await architecture
- 📋 Extensive logging

### Supported Devices

- **ClarityAudio** - 2 zones (analog + digital)
- **ProAudio16** - Up to 16 zones
- **ProAudio32** - Up to 32 zones
- **ProAudio48** - Up to 48 zones
- **ProAudio64** - Up to 64 zones

## Installation

### Via HACS (Recommended)

1. Open Home Assistant
2. Go to HACS → Integrations
3. Search for "Zektor Audio System"
4. Click Install
5. Restart Home Assistant

### Manual Installation

1. Download this repository
2. Copy `integrations/zektor` to `custom_components/zektor`
3. Restart Home Assistant

## Configuration

### Via UI

1. Settings → Devices & Services → Create Automation
2. Click "Create Integration"
3. Search for "Zektor Audio System"
4. Enter your device's IP address and port (default: 50005)
5. Specify the number of zones
6. Click Submit

### Configuration Details

| Setting | Description | Default |
|---------|-------------|---------|
| **Host** | IP address or hostname of the Zektor device | Required |
| **Port** | TCP port (Zektor uses port 50005) | 50005 |
| **Name** | Friendly name for the device | Zektor Audio System |
| **Zones** | Number of zones to control (1-64) | 4 |

## Supported Entities

### Sensor Entities

- **Power Status** - Current power state (off/on/locked)
- **Zone Volume** - Current volume per zone (0-248)
- **Zone Source** - Currently routed source per zone

### Switch Entities

- **Power** - Turn device on/off
- **Zone Mute** - Mute/unmute per zone

### Number Entities

- **Zone Volume** - Set volume with slider (0-248)
- **Zone Bass** - Set bass level (88-168, 0 dB = 128)
- **Zone Treble** - Set treble level (88-168, 0 dB = 128)
- **Zone Balance** - Set balance (0-400, center = 200)

### Select Entities

- **Zone Source** - Select audio source for each zone

### Button Entities

- **Reconnect** - Manually reconnect to device

## Services

### zektor.set_volume
Set zone volume by percentage (0-100).

```yaml
service: zektor.set_volume
data:
  entity_id: sensor.zektor_zone_1_volume
  volume: 75
```

### zektor.mute
Mute/unmute a zone.

```yaml
service: zektor.mute
data:
  entity_id: switch.zektor_zone_1_mute
  mute: true
```

### zektor.set_source
Set the source for a zone.

```yaml
service: zektor.set_source
data:
  entity_id: select.zektor_zone_1_source
  source: 1
```

## API Protocol Details

### Command Format

All commands follow this format:
```
^COMMAND param1,param2,...$
```

### Power Control

```yaml
# Turn on
^P 1$

# Turn off
^P 0$

# Query status
^P ?$
```

### Zone Routing

```yaml
# Set zone 1 to source 2
^SZ @1,2$

# Query zone 1 source
^SZ @1?$
```

### Volume Control

Volume ranges from 0-248, where:
- 0 = Mute
- 200 = 0 dB (nominal)
- 248 = +24 dB

```yaml
# Set zone 1 volume to 200 (0 dB)
^VZ @1,200$

# Query zone 1 volume
^VZ @1?$
```

### Mute Control

```yaml
# Mute zone 1
^VMZ @1,1$

# Unmute zone 1
^VMZ @1,0$

# Query zone 1 mute state
^VMZ @1?$
```

### Bass/Treble Control

Range: 88-168, where 128 = 0 dB

```yaml
# Set zone 1 bass to +6 dB (bass = 140)
^BAZ @1,140$

# Set zone 1 treble to -6 dB (treble = 116)
^TRZ @1,116$
```

## Troubleshooting

### Connection Issues

1. **Check network connectivity:**
   ```bash
   ping <zektor_ip>
   telnet <zektor_ip> 50005
   ```

2. **Verify device IP:**
   - Access the Zektor web interface to confirm IP
   - Use the serial port to check: `^P ?$`

3. **Check firewall:**
   - Ensure port 50005 is not blocked
   - Allow Home Assistant to access the device

### Volume Not Changing

1. Verify the zone is not in "locked" mode (see `LZ` command)
2. Check that the zone is routed to a valid source
3. Try manual unmute first

### Device Not Responding

1. Check the Zektor device is powered on
2. Verify TCP/IP is enabled
3. Try the Reconnect button in Home Assistant
4. Restart the device if necessary

## Advanced Configuration

### Automation Example

```yaml
automation:
  - alias: "Mute all zones when away"
    trigger:
      platform: state
      entity_id: input_boolean.away_mode
      to: 'on'
    action:
      - service: switch.turn_on
        data:
          entity_id:
            - switch.zektor_zone_1_mute
            - switch.zektor_zone_2_mute
            - switch.zektor_zone_3_mute
            - switch.zektor_zone_4_mute
```

### Script Example

```yaml
script:
  set_zone_volume:
    description: "Set volume for a specific zone"
    fields:
      zone:
        selector:
          number:
            min: 1
            max: 64
      volume:
        selector:
          number:
            min: 0
            max: 248
    sequence:
      - service: number.set_value
        data:
          entity_id: "number.zektor_zone_{{ zone }}_volume"
          value: "{{ volume }}"
```

## Performance Notes

- **Update Interval:** 30 seconds (configurable)
- **Command Timeout:** 10 seconds
- **Backoff Strategy:** Exponential backoff (1s → 2s → 4s → max 60s)
- **Connection Pool:** Single persistent connection with auto-reconnect

## Support

For issues or feature requests, please open an issue on [GitHub](https://github.com/Cyrille-Vergely/HomeAssistant-AI/issues).

## License

This integration is part of the HomeAssistant-AI project.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and updates.
