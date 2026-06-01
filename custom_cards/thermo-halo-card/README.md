<div align="center">

# 🌡️ Thermo Halo Card — Home Assistant Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg?style=for-the-badge)](https://hacs.xyz)
[![HA Version](https://img.shields.io/badge/Home%20Assistant-2024.1%2B-blue?style=for-the-badge&logo=home-assistant)](https://www.home-assistant.io)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/github/v/release/Micpi/thermo-halo-card?style=for-the-badge&label=Version)](https://github.com/Micpi/thermo-halo-card/releases/latest)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=000000)](https://buymeacoffee.com/mickaelpila)

**Carte thermostat compacte pour Home Assistant avec halo thermique dynamique.**  
Mettez en avant température actuelle et consigne avec une lecture claire et une interaction rapide.

</div>

---

## 📖 Sommaire

- Installation
- Fonctionnalites
- Configuration rapide
- Reference configuration
- Actions au tap
- Exemples
- FAQ

## 📦 Installation

1. Ajouter le depot dans HACS comme depot Lovelace.
2. Installer Thermo Halo Card depuis HACS.
3. Verifier la ressource JS si HACS ne l'ajoute pas automatiquement.

## 🧩 Ressource Lovelace

```yaml
resources:
  - url: /hacsfiles/thermo-halo-card/thermo-halo-card.js
    type: module
```

## ✨ Fonctionnalites

- Affichage tres lisible de la temperature actuelle.
- Affichage conditionnel de la consigne quand le climate est actif.
- Halo orange en chauffe, bleu en climatisation, halo idle optionnel.
- Deux rendus: base et fancy.
- Editeur visuel natif base sur ha-form.
- Tap actions Home Assistant: more-info, toggle, navigate, url, perform-action, assist, none.

## ⚙️ Configuration rapide

```yaml
type: custom:thermo-halo-card
temperature_entity: sensor.temperature_salon
climate_entity: climate.salon
current_label: Temperature actuelle
target_label: Consigne
appearance: fancy
decimals: 1
heat_color: "#ff9a3c"
cool_color: "#32b8ff"
tap_action:
  action: more-info
```

## 🧭 Reference configuration

| Option | Type | Defaut | Description |
| --- | --- | --- | --- |
| temperature_entity | string | sensor.hvac_knx_temperature_piece_a_vivre | Entite capteur pour la temperature actuelle |
| climate_entity | string | climate.piece_a_vivre | Entite climate pour la consigne et l'etat HVAC |
| current_label | string | Temperature actuelle | Label au-dessus de la temperature |
| target_label | string | Temperature desiree | Label au-dessus de la consigne |
| appearance | string | base | base ou fancy |
| decimals | number | 1 | Nombre de decimales affichees |
| heat_color | string | #ff9a3c | Couleur de la chauffe |
| cool_color | string | #32b8ff | Couleur de la clim |
| idle_halo | string | transparent | Couleur du halo quand le climate est inactif |
| tap_action | object | { action: more-info } | Action executee au clic |

## 🎯 Actions au tap

- more-info: ouvre le more-info de l'entite cible.
- toggle: bascule de preference l'entite climate.
- navigate: navigation Lovelace.
- url: ouvre une URL locale ou distante.
- perform-action: appelle un service Home Assistant.
- assist: declenche Assist.
- none: desactive l'interaction.

## 🧪 Exemples

### Affichage compact

```yaml
type: custom:thermo-halo-card
temperature_entity: sensor.temperature_salon
climate_entity: climate.salon
appearance: base
tap_action:
  action: more-info
```

### Version fancy avec navigation

```yaml
type: custom:thermo-halo-card
temperature_entity: sensor.temperature_salon
climate_entity: climate.salon
appearance: fancy
heat_color: "#ff8a3d"
cool_color: "#38bdf8"
idle_halo: "color-mix(in srgb, var(--primary-color) 10%, transparent)"
tap_action:
  action: navigate
  navigation_path: /lovelace/climat
```

## ❓ FAQ

### La consigne ne s'affiche pas

La consigne est affichee uniquement quand l'entite climate est active et qu'une temperature cible est disponible.

### Le halo idle n'apparait pas

Definir idle_halo avec une couleur ou un gradient CSS non transparent.

### Quelle entite est utilisee pour toggle

Par defaut, la carte bascule l'entite climate si aucune entite cible n'est fournie dans tap_action.
