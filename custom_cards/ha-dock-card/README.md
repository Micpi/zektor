<div align="center">

# 🧩 HA Dock Card — Home Assistant Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg?style=for-the-badge)](https://hacs.xyz)
[![HA Version](https://img.shields.io/badge/Home%20Assistant-2024.1%2B-blue?style=for-the-badge&logo=home-assistant)](https://www.home-assistant.io)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/github/v/release/Micpi/ha-dock-card?style=for-the-badge&label=Version)](https://github.com/Micpi/ha-dock-card/releases/latest)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=000000)](https://buymeacoffee.com/mickaelpila)

**Carte de navigation Lovelace inspirée d'un dock iOS flottant pour Home Assistant.**  
Déployez une navigation visuelle moderne avec état actif, blur et configuration assistée.

</div>

---

## ✨ Features

- floating or static dock positions
- glassmorphism visual style with blur and opacity tuning
- per-button icon, label and navigation path
- active route highlighting
- native visual editor based on HA selectors

## 📦 Installation

1. Add this repository to HACS as a custom Lovelace repository.
2. Install the card from HACS.
3. Add the resource below if needed.

```yaml
resources:
  - url: /hacsfiles/ha-dock-card/ios-dock.js
    type: module
```

## 🧪 Basic Example

```yaml
type: custom:ha-dock-card
show_labels: true
buttons:
  - name: Home
    icon: mdi:home
    link: /lovelace/0
  - name: Lights
    icon: mdi:lightbulb-group
    link: /lovelace/lights
  - name: Climate
    icon: mdi:air-conditioner
    link: /lovelace/climate
```

## 🧪 Styled Example

```yaml
type: custom:ha-dock-card
position: bottom
offset_y: 20
show_labels: true
button_width: 90
button_gap: 14
icon_size: 28
border_radius: 36
blur_amount: 35
opacity_light: 0.18
opacity_dark: 0.15
active_color: [0, 122, 255]
active_icon_color: [255, 255, 255]
active_text_color: [255, 255, 255]
buttons:
  - name: Home
    icon: mdi:home
    link: /lovelace/0
  - name: Media
    icon: mdi:play-circle
    link: /lovelace/media
  - name: Security
    icon: mdi:shield-home
    link: /lovelace/security
```

## 🧭 Main Options

- position: static, top or bottom
- offset_y: distance from screen edge
- side_gap: horizontal spacing from screen edges
- max_width: desktop and tablet width cap
- dock_height: total dock height
- button_width: width per item
- button_gap: spacing between items
- icon_size: icon size in pixels
- show_labels: toggle item labels
- border_radius: overall corner radius
- blur_amount: glass blur strength
- opacity_light and opacity_dark: dock opacity per theme
- buttons: item list with name, icon, link or navigation action

## 🛠️ Editor

The card exposes a Lovelace config form and is intended to be adjusted visually first, then refined in YAML when needed.
