# Activity Select Card

[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Lovelace-41BDF5?style=for-the-badge&logo=home-assistant&logoColor=white)](https://www.home-assistant.io/)
[![HACS](https://img.shields.io/badge/HACS-Custom%20Card-41BDF5?style=for-the-badge)](https://hacs.xyz)
[![Version](https://img.shields.io/badge/Version-v1.2.0-0EA5E9?style=for-the-badge)](https://github.com/Micpi/activity-select-card)
[![Type](https://img.shields.io/badge/Type-Selector%20Card-0284C7?style=for-the-badge)](https://github.com/Micpi/activity-select-card)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=000000)](https://buymeacoffee.com/mickaelpila)

Carte Home Assistant pour piloter des activites via une rangée de boutons ronds, scrollables et entierement configurables depuis l'editeur visuel.

---

## Table des matieres

- Installation
- Fonctionnalites
- Configuration rapide
- Reference configuration
- Exemples
- FAQ

## Installation

1. Ajouter le depot dans HACS comme depot Lovelace ou copier manuellement le fichier JS.
2. Verifier la ressource Lovelace.
3. Ajouter la carte depuis le picker Home Assistant.

## Ressource Lovelace

```yaml
resources:
  - url: /hacsfiles/activity-select-card/activity-select-card.js
    type: module
```

## Fonctionnalites

- Boutons ronds avec icone, image ou texte seul.
- Scroll horizontal fluide quand la liste depasse la largeur de la carte.
- Etat actif synchronise avec input_select ou input_text.
- Editeur visuel complet avec ajout, suppression, reordonnancement et apercu visuel.
- Couleurs, tailles, bordures et affichage du libelle configurables.
- Image par activite possible via URL ou import local.

## Configuration rapide

```yaml
type: custom:activity-select-card
title: Activites
entity: input_select.activite
button_size: 80
icon_size: 40
font_size: 12
gap: 12
active_color: var(--primary-color)
inactive_color: var(--card-background-color, #444)
activities:
  - name: TV
    icon: mdi:television
    value: tv
  - name: Musique
    icon: mdi:music
    value: musique
  - name: Jeux
    icon: mdi:gamepad-variant
    value: jeux
```

## Reference configuration

| Option | Type | Defaut | Description |
| --- | --- | --- | --- |
| title | string | vide | Titre de la carte |
| entity | string | vide | input_select ou input_text a piloter |
| button_size | number | 80 | Diametre du bouton |
| icon_size | number | 40 | Taille de l'icone ou de l'image |
| font_size | number | 12 | Taille du libelle |
| gap | number | 12 | Espacement horizontal |
| active_color | string | var(--primary-color) | Couleur de l'activite active |
| inactive_color | string | var(--card-background-color, #444) | Couleur de fond inactive |
| border_width | number | 0 | Largeur de bordure |
| border_color | string | var(--divider-color, #e0e0e0) | Couleur de bordure |
| show_name | boolean | true | Afficher le nom globalement |
| activities | array | requis | Liste des activites |

### Champs par activite

| Champ | Description |
| --- | --- |
| name | Libelle visible sous l'icone |
| icon | Icone MDI ou URL image |
| image | Image explicite pour l'activite |
| value | Valeur envoyee a l'entite |
| icon_color | Couleur specifique de l'icone |
| show_name | Override local du libelle |

## Exemples

### Input select classique

```yaml
type: custom:activity-select-card
title: Activites salon
entity: input_select.activite_salon
activities:
  - name: TV
    icon: mdi:television
    value: tv
  - name: Film
    icon: mdi:movie-open
    value: movie
  - name: Jeux
    icon: mdi:gamepad-variant
    value: game
```

### Boutons avec images

```yaml
type: custom:activity-select-card
title: Sources
entity: input_text.media_source
button_size: 88
icon_size: 44
activities:
  - name: Apple TV
    image: /local/icons/apple-tv.png
    value: appletv
  - name: PS5
    image: /local/icons/ps5.png
    value: ps5
  - name: Vinyl
    icon: mdi:record-player
    value: vinyl
```

## FAQ

### Quelle entite utiliser

Utiliser idealement un input_select. Un input_text fonctionne aussi si tu veux stocker une valeur libre.

### Pourquoi le bouton actif ne change pas

Verifier que la valeur envoyee dans activities[].value correspond exactement a l'etat expose par l'entite cible.

### Puis-je ne montrer qu'une image sans texte

Oui. Laisser name vide ou desactiver show_name globalement ou par activite.
