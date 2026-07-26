<div align="center">

# 🧭 Alpha Area Card — Home Assistant Card

[![hacs_badge](https://img.shields.io/badge/HACS-Custom-orange.svg?style=for-the-badge)](https://hacs.xyz)
[![HA Version](https://img.shields.io/badge/Home%20Assistant-2024.1%2B-blue?style=for-the-badge&logo=home-assistant)](https://www.home-assistant.io)
[![License](https://img.shields.io/badge/License-MIT-green.svg?style=for-the-badge)](LICENSE)
[![Version](https://img.shields.io/github/v/release/Micpi/area-card?style=for-the-badge&label=Version)](https://github.com/Micpi/area-card/releases/latest)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=000000)](https://buymeacoffee.com/mickaelpila)

**Carte Lovelace pour afficher une zone Home Assistant avec état synthétique et actions rapides.**  
Combinez image, capteurs et commandes dans un composant lisible, mobile-first et simple à configurer.

</div>

---

## ✨ Points forts

- ajout Lovelace vierge: aucun salon/cuisine/exemple n'est injecte par defaut
- prise en charge native des zones Home Assistant
- editeur graphique integre au standard du workspace (`General`, `Actions`, `Styles`, `Defaults`)
- affichage optimise des capteurs, alertes, toggles et entites secondaires
- options modernes de l'Area card: `display_type`, `camera_view`, `aspect_ratio`, `color`, `sensor_classes`, `alert_classes`, `features_position`
- support `features: [{ type: area-controls }]` avec filtres `controls`
- actions avances: `tap_action`, `hold_action`, `double_tap_action` pour la carte
- actions par defaut pour les entites en `hold` et `double tap`
- filtres de domaines, tri et limitation du volume d'entites
- rendu concis et rapide, avec rafraichissement limite aux changements utiles

## 📦 Installation

### HACS

Ajoutez le depot comme ressource Lovelace, puis installez la carte.

### Ressource manuelle

```yaml
resources:
  - url: /local/alpha-area-card.js
    type: module
```

Copiez ensuite alpha-area-card.js dans www puis rechargez le dashboard.

## 🧪 Ajout vierge

Depuis le picker Lovelace, la carte est ajoutee sans configuration exemple:

```yaml
type: custom:alpha-area-card
```

Selectionnez ensuite une zone ou ajoutez les options voulues depuis l'editeur.

## 🧪 Utilisation minimale configuree

```yaml
type: custom:alpha-area-card
area: salon
```

## 🧪 Exemple plus complet

```yaml
type: custom:alpha-area-card
title: Salon
area: salon
hide_unavailable: true
display_type: camera
camera_entity: camera.salon
camera_view: auto
aspect_ratio: 16:9
color: primary
sensor_classes:
  - temperature
  - humidity
alert_classes:
  - motion
  - moisture
features:
  - type: area-controls
    controls:
      - light
      - fan
      - switch
      - entity_id: light.salon_lampe
features_position: inline
tap_action:
  action: more-info
```

## 🧭 Options principales

- title: titre affiche sur la carte
- area: identifiant de zone Home Assistant
- display_type: rendu `picture`, `camera`, `icon` ou `compact`
- camera_entity: camera forcee pour le mode `camera` (sinon premiere camera de la zone)
- camera_view: conserve la syntaxe HA (`auto` ou `live`); le rendu custom utilise le snapshot `camera_proxy`
- aspect_ratio: ratio stable (`16:9`, `16x9`, `56.25%`, etc.)
- color: token Home Assistant ou couleur hex pour l'accent
- auto_area_entities: auto-remplissage depuis la zone quand la liste d'entites est vide
- entities: entites secondaires affichees dans la carte
- hide_unavailable: masque les entites indisponibles
- tap_action: action principale au clic
- hold_action: action carte au clic droit / hold
- double_tap_action: action carte au double-clic / double tap
- entity_hold_action: action par defaut des entites au clic droit / hold
- entity_double_tap_action: action par defaut des entites au double-clic / double tap
- include_domains: liste de domaines a inclure (ex: light,switch)
- exclude_domains: liste de domaines a exclure (ex: sensor,binary_sensor)
- exclude_entities: entites a exclure des capteurs, alertes et controles
- sensor_classes: classes de capteurs a synthetiser depuis la zone
- alert_classes: classes de binary sensors a afficher quand elles sont actives
- features: support de `area-controls` et de ses `controls`
- features_position: `bottom` ou `inline`
- entity_sort: tri des entites (`none`, `name`, `domain`)
- max_entities: limite le nombre d'entites affichees (`0` = illimite)
- styles: apparence visuelle et variantes de presentation
- darken_image: assombrit le fond image pour mieux detacher le texte
- shadow: active l'ombre de carte
- force_dialog: force l'ouverture du detail de zone
- state_color: applique les couleurs d'etat Home Assistant
- card_mod.style: surcharge CSS si card-mod est utilise

## 🛠️ Editeur graphique

La carte expose un editeur natif dans le picker Lovelace. Elle peut donc etre ajoutee depuis l'interface sans passer par YAML, puis affinee manuellement si besoin.

## 🧱 Build local

Depuis custom_cards/area-card:

```bash
npm run build
```

Sorties attendues:

- dist/alpha-area-card.js
- dist/area-card.js

## 🧪 Exemples

Voir le fichier de demos:

- ../../examples/cartes Lovelace/area-card-modeles-demo.yaml
