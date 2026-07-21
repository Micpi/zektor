# Changelog

## v1.1.0 - 2026-07-21

### Added

- Standardized visual editor sections aligned with workspace standard: `General`, `Actions`, `Styles`, `Defaults`.
- Card actions for `hold_action` and `double_tap_action` in addition to `tap_action`.
- Entity default actions for `hold` and `double tap`, configurable from the editor.
- Domain filters (`include_domains`, `exclude_domains`) and entity sort options (`none`, `name`, `domain`).
- Entity limit option (`max_entities`) for dense areas.
- Entity ordering controls (move up/down) directly in the visual editor.

### Changed

- Entity selection UX now uses native `ha-entity-picker` rows for better reliability and consistency.
- Auto area population can be toggled (`auto_area_entities`) when explicit entity lists are preferred.
- Action editor now supports `call-service` payloads with JSON `service_data` and `target` inputs.

### Fixed

- Reduced accidental double-trigger behavior by disambiguating tap vs double tap.
- Improved editor change propagation (`config-changed` bubbling/composed) for Lovelace integration compatibility.

## v1.0.2 - 2026-06-01

- feat(card): publish alpha-area-card v1.0.2
- changed: .gitignore
- changed: README.md
- changed: alpha-area-card.js
- changed: hacs.json
- changed: package-lock.json
- changed: package.json


