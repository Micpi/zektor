# Changelog

All notable changes to the Zektor Audio System integration will be documented in this file.

## [0.3.1] - 2026-06-02

### Fixed

- ✅ Fixed setup flow false negatives: connection now succeeds when TCP access is valid even if immediate power query is unavailable.
- ✅ Fixed query handling in TCP client for commands that return ACK then status (notably `P ?`).
- ✅ Improved power status parsing robustness.
- ✅ Updated repository metadata links in `manifest.json` to point to the published `Micpi/zektor` repository.

### Changed

- 🧱 HACS repository metadata moved to root-level `hacs.json` and integration kept in `custom_components/zektor` for HACS compliance.

## [1.0.0] - 2026-06-02

### Added

- ✨ Initial release of Zektor Audio System integration
- 🔌 Power control (on/off/locked state)
- 🎵 Multi-zone audio routing (up to 64 zones)
- 🔊 Per-zone volume control with 0.5 dB precision
- 🔇 Per-zone mute control via volume processor
- 🎚️ Bass and treble equalization per zone
- ⚖️ Balance control per zone
- 📊 Real-time sensor entities for monitoring
- 🔄 Automatic TCP/IP reconnection with exponential backoff
- 🌐 Full async/await TCP communication
- 🎯 Config flow for easy setup via UI
- 🌍 Multi-language support (English, French)
- 📋 Comprehensive logging and error handling
- 🧪 Zone-based entity creation (1-64 zones)

### Features

- Sensor platform: Power status, zone volume, zone source
- Switch platform: Power control, zone mute
- Button platform: Reconnect
- Number platform: Volume, bass, treble, balance controls
- Select platform: Zone source selection

### Technical

- Async TCP client with protocol parsing
- DataUpdateCoordinator for efficient polling
- Error handling and connection management
- Support for ClarityAudio and ProAudio devices
- Full protocol support for Zektor serial command format
