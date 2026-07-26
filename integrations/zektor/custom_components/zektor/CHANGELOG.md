# Changelog

All notable changes to the Zektor Audio System integration will be documented in this file.

## [0.3.6] - 2026-06-02

### Changed

- 🚀 **Architecture push-driven**: après chaque commande SET, l'écho TCP du device est lu immédiatement et met à jour l'état Home Assistant sans attendre le prochain poll. Toute modification est visible instantanément dans l'interface.
- 🔌 **Dump complet à la connexion** : `query_all_state()` interroge toutes les variables (power, source, digital source, volume, mute, bass, treble, balance, crossover) pour toutes les zones au premier démarrage.
- ♻️ Polling réduit à un simple reconcile de sécurité toutes les 60 s (contre polling constant avant).
- 📡 `iot_class` mis à jour à `local_push` (HA sait maintenant que les updates arrivent en push).
- 🗄️ État live centralisé dans l'API (`_state`) : source unique de vérité, callbacks notifiés à chaque changement.
- ✂️ Suppression de `async_request_refresh()` après chaque set (redondant avec le callback push).
- 🔇 `query_zone_mute` ajouté et intégré au dump complet.

### Fixed

- 🐛 **Correctif critique** : les commandes SET recevaient un echo status non lu qui polluait le buffer TCP et désynchronisait les lectures suivantes. Ce frame est maintenant drainé systématiquement.
- 🔐 Fermeture propre des exceptions au niveau connexion (OSError/RuntimeError au lieu de `Exception`).

## [0.3.5] - 2026-06-02

### Added

- ✅ `SZ` source selection now supports full analog/coax/toslink id range (`source_1`..`source_80`), including examples like `source_38` (`^SZ @2,38$`).
- ✅ Added dedicated digital source select entity per zone (`DSZ`) for easier control.

### Changed

- 🔄 Complete routing of zone variables in coordinator data model: `source`, `digital_source`, `volume`, `bass`, `treble`, `balance`, `crossover_type`, `crossover_frequency`.
- ⚙️ Adaptive polling profile to reduce CPU/network load: high-change variables every cycle, low-change variables (EQ/crossover) every extended cycle.

### Fixed

- 🧠 Robust parser usage for numeric values across queried commands to avoid wrong field extraction.

## [0.3.4] - 2026-06-02

### Added

- ✅ Digital source selection per zone via new `number` entity (`DSZ` command).
- ✅ Digital source state sensor per zone.
- ✅ Crossover type visibility per zone (`FTYPZ`).
- ✅ Crossover frequency visibility per zone (`FFRQZ`).

### Changed

- 🔄 Coordinator now polls digital source and crossover configuration for each zone.

## [0.3.3] - 2026-06-02

### Fixed

- ✅ Automatic zone capacity detection for Zektor models when configured with default zone count.
- ✅ Integration now persists detected zone count to config entry data and creates the correct number of entities.

## [0.3.2] - 2026-06-02

### Fixed

- ✅ Setup no longer blocks on temporary network issues during initial config flow.
- ✅ Integration now loads even if the device is offline at startup, then retries via coordinator polling.

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
