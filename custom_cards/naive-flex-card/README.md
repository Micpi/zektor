# Naive Flex Card

[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Lovelace-41BDF5?style=for-the-badge&logo=home-assistant&logoColor=white)](https://www.home-assistant.io/)
[![HACS](https://img.shields.io/badge/HACS-Custom%20Card-41BDF5?style=for-the-badge)](https://hacs.xyz)
[![Version](https://img.shields.io/badge/Version-v0.1.1-0EA5E9?style=for-the-badge)](https://github.com/Micpi/naive-flex-card)
[![Type](https://img.shields.io/badge/Type-Universal%20Control%20Card-0284C7?style=for-the-badge)](https://github.com/Micpi/naive-flex-card)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=000000)](https://buymeacoffee.com/mickaelpila)

Custom card Home Assistant complete et parametrique, avec support natif des usages suivants:

---

- light
- button / switch / script / scene
- volume (media_player)
- cover

Points clefs:

- Configuration simple (presets + options directes)
- Configuration complete (actions, styles, couleurs, dimensions)
- Editeur 100% visuel (aucune saisie JSON obligatoire)
- Actions natives visuelles: tap, hold, double tap
- Sections repliables type carte standard (General, Actions, Style, etc.)
- Pickers visuels pour entites, couleurs et icones
- Groupes de boutons activables/desactivables, au choix
- Preset visuel navbar_popup inspire du look navbar/media
- Rangee de boutons horizontale scrollable
- Tailles de boutons minimum, maximum et personnalisee
- Editeur visuel Lovelace inclus

## Usage recommande

Naive Flex Card sert de carte polyvalente de reference quand une seule carte doit combiner un controle principal, des actions rapides et une presentation homogene avec le style Naive Flex du workspace.

## Installation

1. Copier le dossier `custom_cards/naive-flex-card` dans votre environnement de dev.
1. Ajouter la ressource Lovelace:

```yaml
url: /local/naive-flex-card.js
type: module
```

1. Ajouter la carte:

```yaml
type: custom:naive-flex-card
entity: light.salon
```

## Configuration rapide

```yaml
type: custom:naive-flex-card
entity: light.salon
control_type: auto
style:
  preset: modern
button_row:
  enabled: true
  scroll: true
  min_button_width: 72
  max_button_width: 132
  buttons:
    - label: Off
      icon: mdi:power
      action: call-service
      service: light.turn_off
    - label: 50%
      icon: mdi:brightness-6
      action: call-service
      service: light.turn_on
      service_data:
        brightness_pct: 50
```

## Exemple cover

```yaml
type: custom:naive-flex-card
entity: cover.volet_salon
control_type: cover
style:
  preset: soft
  shape: pill
button_row:
  enabled: true
  scroll: true
  button_width: 110px
  min_button_width: 88
  max_button_width: 150
  buttons:
    - label: 25%
      icon: mdi:window-shutter
      action: set-value
      position: 25
    - label: 50%
      icon: mdi:window-shutter
      action: set-value
      position: 50
    - label: 100%
      icon: mdi:window-shutter-open
      action: set-value
      position: 100
```

## Options principales

- `entity`: entite cible
- `control_type`: `auto | light | button | volume | cover`
- `name`, `icon`
- `style.preset`: `modern | minimal | outline | soft`
- `style.shape`: `rounded | square | pill`
- `style.appearance`: `solid | glass | outline`
- `style.active_color`, `style.background_color`, `style.text_color`
- `button_row.enabled`, `button_row.scroll`
- `button_row.min_button_width`, `button_row.max_button_width`, `button_row.button_width`
- `button_row.buttons[]`: actions rapides custom (editees visuellement dans l'UI)

## Format button_row.buttons

Chaque bouton accepte:

- `label`
- `icon`
- `entity` (optionnel)
- `action`: `toggle | more-info | call-service | set-value`
- `service` + `service_data` (si `call-service`)
- `value` (volume, de 0 a 1) pour `set-value`
- `position` (cover, de 0 a 100) pour `set-value`

## Editeur

La carte embarque un editeur visuel complet et constitue la base ergonomique a reutiliser pour les futures cartes riches du workspace.

## Build local

Depuis `custom_cards/naive-flex-card`:

```bash
npm run build
```

Le fichier genere est `dist/naive-flex-card.js`.
