# Zektor Audio System — HACS Installation Guide

## For HACS Registry

This integration can be installed via HACS (Home Assistant Community Store) if submitted to the official registry.

### HACS Submission

To make this integration available in HACS:

1. **Fork the repository** to your GitHub account
2. **Create a pull request** to [hacs/default](https://github.com/hacs/default) with:
   - Repository URL: `https://github.com/Cyrille-Vergely/HomeAssistant-AI`
   - Repository Type: `Integration`
   - Category: `Integration`

3. **HACS will verify:**
   - `hacs.json` exists and is valid
   - `manifest.json` is present and correct
   - README.md is comprehensive
   - CHANGELOG.md exists
   - Code follows Home Assistant standards

### Local Installation (Temporary)

Until the integration is in the HACS registry, install locally:

#### Option 1: Manual Clone

```bash
# Navigate to custom_components
cd ~/.homeassistant/custom_components

# Clone the integration
git clone https://github.com/Cyrille-Vergely/HomeAssistant-AI zektor_temp

# Copy the zektor folder
cp -r zektor_temp/integrations/zektor ./zektor

# Clean up
rm -rf zektor_temp

# Restart Home Assistant
```

#### Option 2: Copy Files

```bash
# 1. Download the integration folder
# 2. Extract to ~/.homeassistant/custom_components/zektor
# 3. Restart Home Assistant
```

#### Option 3: Symlink (Development)

```bash
# On Linux/Mac
cd ~/.homeassistant/custom_components
ln -s /path/to/HomeAssistant-AI/integrations/zektor zektor

# On Windows (PowerShell as Admin)
New-Item -ItemType SymbolicLink `
  -Path "$env:USERPROFILE\.homeassistant\custom_components\zektor" `
  -Target "C:\path\to\HomeAssistant-AI\integrations\zektor"
```

## Post-Installation

### 1. Restart Home Assistant

```bash
# Via web UI: Settings → System → System → Restart
# Or in terminal:
ha core restart
```

### 2. Add Integration

- Open Home Assistant
- Settings → Devices & Services → Integrations
- Click **Create Integration** or **+ Create Automation**
- Search for "Zektor Audio System"
- Fill in:
  - **Host:** Your Zektor device IP (e.g., 192.168.1.100)
  - **Port:** 50005 (default, leave as is)
  - **Name:** Friendly name (e.g., "Living Room Audio")
  - **Zones:** Number of zones (1-64)
- Click **Submit**

### 3. Verify Installation

You should see new entities:
- `sensor.zektor_power` - Power status
- `switch.zektor_power` - Power on/off
- `sensor.zektor_zone_1_volume` - Zone volumes
- `number.zektor_zone_1_volume` - Volume control slider
- `switch.zektor_zone_1_mute` - Zone mute
- `select.zektor_zone_1_source` - Source selection

## Troubleshooting Installation

### Integration Not Found

1. Verify folder structure:
   ```
   ~/.homeassistant/
   └── custom_components/
       └── zektor/
           ├── __init__.py
           ├── manifest.json
           ├── api.py
           ├── config_flow.py
           └── ...
   ```

2. Check file permissions:
   ```bash
   chmod 644 ~/.homeassistant/custom_components/zektor/*
   chmod 755 ~/.homeassistant/custom_components/zektor
   ```

3. Restart Home Assistant completely

### Cannot Connect to Device

1. Verify network connectivity:
   ```bash
   ping <zektor_ip>
   nc -zv <zektor_ip> 50005  # Test port connectivity
   ```

2. Check Zektor device:
   - Verify device is powered on
   - Check IP configuration
   - Ensure TCP/IP is enabled

3. Check Home Assistant logs:
   ```
   Settings → System → Logs
   # Search for "zektor"
   ```

### Errors in Logs

Enable debug logging:

```yaml
# configuration.yaml
logger:
  default: info
  logs:
    custom_components.zektor: debug
```

Then restart and check logs for detailed error messages.

## Update Process

When updates are available:

### Via HACS

1. Open HACS
2. Go to **Integrations**
3. Find "Zektor Audio System"
4. Click **Update**
5. Restart Home Assistant

### Manual Update

1. Delete the old folder: `rm -rf ~/.homeassistant/custom_components/zektor`
2. Follow installation steps above
3. Restart Home Assistant

## HACS Features

Once in the HACS registry, the integration will support:

✅ Automatic updates  
✅ One-click installation  
✅ Easy uninstallation  
✅ Version tracking  
✅ Release notes display  
✅ Community ratings  

## FAQ

**Q: Does this work with my Zektor device model?**

A: If your device supports TCP/IP command protocol on port 50005, it should work. Tested models:
- ClarityAudio
- ProAudio16, ProAudio32, ProAudio48, ProAudio64

**Q: Can I have multiple Zektor devices?**

A: Yes! Add each one as a separate integration in Home Assistant.

**Q: Is the integration secure?**

A: Yes. Credentials are stored only in Home Assistant's secure storage. No external API calls are made.

**Q: What happens if the device goes offline?**

A: The integration automatically attempts to reconnect with exponential backoff. The devices will show "unavailable" until connection is restored.

**Q: Can I control the integration from the command line?**

A: Yes, via Home Assistant's service calls:
```bash
ha service zektor.set_volume zone=1 volume=200
```

## Support

For issues or questions:

1. Check the [README.md](README.md) in the integration folder
2. Open an [issue on GitHub](https://github.com/Cyrille-Vergely/HomeAssistant-AI/issues)
3. Check [HACS documentation](https://hacs.xyz)

## Next Steps

1. Install the integration locally
2. Configure your Zektor device
3. Create automations using the entities
4. Check the main [README.md](README.md) for advanced usage
5. Report any issues on GitHub

---

**Ready to control your Zektor system with Home Assistant!** 🎵
