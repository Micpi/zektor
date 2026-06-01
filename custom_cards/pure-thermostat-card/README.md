# Pure Thermostat Card

[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Lovelace-41BDF5?style=for-the-badge&logo=home-assistant&logoColor=white)](https://www.home-assistant.io/)
[![HACS](https://img.shields.io/badge/HACS-Custom%20Card-41BDF5?style=for-the-badge)](https://hacs.xyz)
[![Version](https://img.shields.io/badge/Version-v0.2.9-0EA5E9?style=for-the-badge)](https://github.com/Micpi/pure-thermostat-card)
[![Type](https://img.shields.io/badge/Type-Climate%20Card-0284C7?style=for-the-badge)](https://github.com/Micpi/pure-thermostat-card)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=000000)](https://buymeacoffee.com/mickaelpila)

Minimal thermostat Lovelace card inspired by Home Assistant native thermostat, with a clean circular UI and full visual editor.

---

## ✨ Features

- Circular thermostat dial
- Target and current temperature display
- Plus/minus controls
- HVAC mode buttons
- Visual editor with:
  - entity picker
  - icon picker
  - color pickers
  - style presets and layout options

## Highlights

- compact thermostat UI with target and current temperature
- configurable HVAC mode whitelist
- style fields aligned with the workspace card system
- native Lovelace editor support for quick setup

## 📦 Installation

Add this repository in HACS as a Lovelace plugin.

## 🧩 Lovelace Resource

```yaml
resources:
  - url: /hacsfiles/pure-thermostat-card/pure-thermostat-card.js
    type: module
```

## 🧪 Basic Usage

```yaml
type: custom:pure-thermostat-card
entity: climate.living_room
name: Living Room
temperature_step: 0.5
style:
  preset: navbar_popup
  appearance: glass
  active_color: "#ff7a1a"
```

## 🧪 Recommended Setup

```yaml
type: custom:pure-thermostat-card
entity: climate.living_room
name: Living Room
show_current_temp: true
show_plus_minus: true
show_mode_buttons: true
temperature_step: 0.5
precision: 1
mode_whitelist:
  - heat
  - off
style:
  preset: navbar_popup
  shape: rounded
  appearance: glass
  size: comfortable
  elevation: soft
  auto_text_contrast: true
  active_color: "#ff7a1a"
  inactive_color: "rgba(255,255,255,0.45)"
  background_color: "rgba(17,24,39,0.78)"
  text_color: "#f9fafb"
```

## 🧪 Advanced Example

```yaml
type: custom:pure-thermostat-card
entity: climate.living_room
name: helper__wohnzimmer__thermostat_heizung
temperature_step: 0.5
precision: 1
show_current_temp: true
show_plus_minus: true
show_mode_buttons: true
mode_whitelist:
  - heat
  - off
style:
  preset: navbar_popup
  shape: rounded
  appearance: glass
  size: comfortable
  elevation: soft
  auto_text_contrast: true
  active_color: "#ff7a1a"
  inactive_color: "rgba(255,255,255,0.45)"
  background_color: "rgba(17,24,39,0.78)"
  text_color: "#f9fafb"
```

## 🧭 Main Options

- entity: climate entity to control
- name: custom title
- temperature_step: increment used by plus and minus controls
- precision: displayed decimal precision
- min_temp and max_temp: optional manual bounds
- show_current_temp: show ambient temperature when available
- show_plus_minus: show direct setpoint controls
- show_mode_buttons: show HVAC mode chips
- mode_whitelist: restrict visible HVAC modes
- style: visual preset, colors and surface tuning

## 🛠️ Editor

The card can be created from the Lovelace picker and edited through its visual editor, then fine-tuned in YAML for advanced styling.
