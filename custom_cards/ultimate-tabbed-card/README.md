# Ultimate Tabbed Card

[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Lovelace-41BDF5?style=for-the-badge&logo=home-assistant&logoColor=white)](https://www.home-assistant.io/)
[![HACS](https://img.shields.io/badge/HACS-Custom%20Card-41BDF5?style=for-the-badge)](https://hacs.xyz)
[![Version](https://img.shields.io/badge/Version-v0.1.3-0EA5E9?style=for-the-badge)](https://github.com/Micpi/ultimate-tabbed-card)
[![Type](https://img.shields.io/badge/Type-Container%20Card-0284C7?style=for-the-badge)](https://github.com/Micpi/ultimate-tabbed-card)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=000000)](https://buymeacoffee.com/mickaelpila)

Ultimate Tabbed Card est un conteneur Lovelace a onglets, pense pour agreger plusieurs cartes dans un seul composant avec lazy rendering, conservation d etat et editeur visuel complet.

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
