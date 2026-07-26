# Changelog

## v1.2.0 - 2026-07-21

### Added

- Blank Lovelace stub: adding the card now starts from an empty configuration instead of a demo room.
- Modern Area card options: `display_type`, `camera_view`, `camera_entity`, `aspect_ratio`, `color`, `sensor_classes`, `alert_classes`, `exclude_entities`, `features`, and `features_position`.
- `features: [{ type: "area-controls" }]` support, including `controls` entries by domain or `entity_id`.
- Camera display mode using the selected camera or the first camera assigned to the area.
- Area sensor summaries by `device_class`, using median values for normal sensors and sums for cumulative classes.
- Alert chips for active binary sensors matching `alert_classes`.

### Changed

- Internal visual defaults now follow the workspace theme variables instead of hard-coded demo colors.
- The visual editor emits a pruned configuration so unchanged defaults are not persisted in YAML.
- Entity names and states use Home Assistant frontend formatters when available.
- Toggle actions now use `homeassistant.toggle` for better domain compatibility.

### Fixed

- Removed the bundled `Cuisine` example entities, navigation path, and `card_mod` style from the default model.
- Auto area rendering now refreshes when entity/device/area registry data changes.
- User-provided labels, titles, icons, and image URLs are escaped before HTML rendering.

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


