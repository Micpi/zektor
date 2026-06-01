<div align="center">

# 🗂️ Ultimate Tabbed Card — Home Assistant Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg?style=for-the-badge)](https://hacs.xyz)
[![HA Version](https://img.shields.io/badge/Home%20Assistant-2024.1%2B-blue?style=for-the-badge&logo=home-assistant)](https://www.home-assistant.io)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/github/v/release/Micpi/ultimate-tabbed-card?style=for-the-badge&label=Version)](https://github.com/Micpi/ultimate-tabbed-card/releases/latest)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=000000)](https://buymeacoffee.com/mickaelpila)

**Conteneur Lovelace à onglets pour organiser plusieurs cartes dans un seul composant.**  
Améliorez lisibilité et performance avec lazy rendering, état conservé et éditeur visuel intégré.

</div>

---

## ✨ Points forts

- conteneur a onglets avec rendu paresseux
- conservation facultative des cartes deja ouvertes
- support des labels et icones par onglet
- editeur graphique natif pour composer les tabs
- utile pour condenser dashboards desktop et mobile sans multiplier les vues

## 📦 Installation

Ajouter ce depot dans HACS avec le type Lovelace.

## 🧩 Ressource Lovelace

```yaml
resources:
  - url: /hacsfiles/ultimate-tabbed-card/ultimate-tabbed-card.js
    type: module
```

## 🧪 Exemple minimal

```yaml
type: custom:tabbed-card
tabs:
  - attributes:
      label: Lumiere
      icon: mdi:lightbulb
    card:
      type: entity
      entity: light.salon
  - attributes:
      label: Climate
      icon: mdi:thermostat
    card:
      type: thermostat
      entity: climate.salon
```

## 🧪 Exemple recommande

```yaml
type: custom:tabbed-card
options:
  defaultTabIndex: 0
  keepAlive: true
  lazy: true
  showIcons: true
  showLabels: true
styles:
  active_color: var(--primary-color, #00AEEF)
  inactive_color: var(--secondary-text-color, #9CA3AF)
tabs:
  - attributes:
      label: Overview
      icon: mdi:view-dashboard
    card:
      type: entities
      entities:
        - sensor.salon_temperature
        - sensor.salon_humidity
  - attributes:
      label: Lights
      icon: mdi:lightbulb-group
    card:
      type: custom:light-slider-card
      title: Lumieres
      entities:
        - light.salon
        - light.cuisine
```

## 🧭 Options principales

- options.defaultTabIndex: onglet affiche a l ouverture
- options.keepAlive: conserve les cartes deja rendues
- options.lazy: differe le rendu des onglets non actifs
- options.showIcons: affiche les icones d onglets
- options.showLabels: affiche les labels d onglets
- styles.active_color: couleur de l onglet actif
- styles.inactive_color: couleur des onglets inactifs
- tabs: liste des onglets avec attributes et card

## 🛠️ Editeur

La carte expose un editeur natif et sert de conteneur compose pour assembler rapidement plusieurs cartes du workspace dans un seul bloc navigable.
