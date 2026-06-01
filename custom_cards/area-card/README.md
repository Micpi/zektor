# Alpha Area Card

[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Lovelace-41BDF5?style=for-the-badge&logo=home-assistant&logoColor=white)](https://www.home-assistant.io/)
[![HACS](https://img.shields.io/badge/HACS-Custom%20Card-41BDF5?style=for-the-badge)](https://hacs.xyz)
[![Version](https://img.shields.io/badge/Version-v1.0.1-0EA5E9?style=for-the-badge)](https://github.com/Micpi/area-card)
[![Type](https://img.shields.io/badge/Type-Area%20Card-0284C7?style=for-the-badge)](https://github.com/Micpi/area-card)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=000000)](https://buymeacoffee.com/mickaelpila)

Alpha Area Card affiche une zone Home Assistant avec image, etat synthetique et actions rapides, avec un editeur graphique integre et un rendu optimise pour les dashboards mobiles comme desktop.

---

## Points forts

- prise en charge native des zones Home Assistant
- editeur graphique integre pour les entites, styles et actions
- affichage de capteurs, toggles et liste d'entites secondaires
- rendu concis et rapide, avec rafraichissement limite aux changements utiles

## Installation

### HACS

Ajoutez le depot comme ressource Lovelace, puis installez la carte.

### Ressource manuelle

```yaml
resources:
  - url: /local/alpha-area-card.js
    type: module
```

Copiez ensuite alpha-area-card.js dans www puis rechargez le dashboard.

## Utilisation minimale

```yaml
type: custom:alpha-area-card
title: Salon
area: salon
```

## Exemple plus complet

```yaml
type: custom:alpha-area-card
title: Salon
area: salon
hide_unavailable: true
darken_image: 0.2
shadow: true
entities:
  - entity: light.salon
  - entity: climate.salon
  - entity: sensor.salon_temperature
    prefix: Temp
styles:
  preset: glass
  appearance: transparent
tap_action:
  action: more-info
```

## Options principales

- title: titre affiche sur la carte
- area: identifiant de zone Home Assistant
- entities: entites secondaires affichees dans la carte
- hide_unavailable: masque les entites indisponibles
- tap_action: action principale au clic
- styles: apparence visuelle et variantes de presentation
- darken_image: assombrit le fond image pour mieux detacher le texte
- shadow: active l'ombre de carte
- force_dialog: force l'ouverture du detail de zone
- state_color: applique les couleurs d'etat Home Assistant
- card_mod.style: surcharge CSS si card-mod est utilise

## Editeur graphique

La carte expose un editeur natif dans le picker Lovelace. Elle peut donc etre ajoutee depuis l'interface sans passer par YAML, puis affinee manuellement si besoin.

## Build local

Depuis custom_cards/area-card:

```bash
npm run build
```

Sorties attendues:

- dist/alpha-area-card.js
- dist/area-card.js

## Exemples

Voir le fichier de demos:

- ../../examples/cartes Lovelace/area-card-modeles-demo.yaml
