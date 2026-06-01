# iOS Popup Card — Home Assistant

[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Lovelace-41BDF5?style=for-the-badge&logo=home-assistant&logoColor=white)](https://www.home-assistant.io/)
[![HACS](https://img.shields.io/badge/HACS-Custom%20Card-41BDF5?style=for-the-badge)](https://hacs.xyz)
[![Version](https://img.shields.io/badge/Version-v3.0.0-0EA5E9?style=for-the-badge)](https://github.com/Micpi/iOS-PopUp-card)
[![Type](https://img.shields.io/badge/Type-Popup%20Card-0284C7?style=for-the-badge)](https://github.com/Micpi/iOS-PopUp-card)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=000000)](https://buymeacoffee.com/mickaelpila)

Un composant Lovelace qui affiche un popup (bottom-sheet) inspiré d'iOS : animations fluides,
gestes natifs et boutons d'accès rapide. Ce document décrit l'installation, la configuration
et donne des exemples prêts à l'emploi.

---

## 📖 Sommaire

- Installation
- Principes
- Configuration rapide
- Options detaillees
- Sous-boutons & actions
- Exemples
- Depannage
- Changelog & credits

---

## 📦 Installation

1. Copiez `ios-popup-card.js` dans `/config/www/community/ios-popup-card/`.

2. Déclarez la ressource (UI ou `configuration.yaml`) :

```yaml
lovelace:
  resources:
    - url: /local/community/ios-popup-card/ios-popup-card.js
      type: module
```

1. Rechargez la page (Ctrl/Cmd + F5).

---

## 🧠 Principes

- **Activation** : le popup s'ouvre via navigation (`navigate` vers `#popup` ou `#popup-<hash>`).
- **Contenu** : vous pouvez insérer n'importe quelle carte Lovelace dans le popup.
- **Gestes** : `tap`, `hold` (≥450ms) et `double-tap` (≤280ms) sont détectés sur les sous-boutons.
- **Scroll** : le document de fond est bloqué automatiquement pendant que le popup est ouvert.

---

## ⚙️ Configuration rapide

Configuration minimale :

```yaml
type: custom:ios-popup-card
title: Mon Popup
cards:
  - type: entities
    entities:
      - light.salon
```

Ouvrir depuis un bouton :

```yaml
type: button
tap_action:
  action: navigate
  navigation_path: "#popup"
```

---

## 🧭 Options détaillées

Extraits des options principales :

- `title` (string) — Titre affiché dans l'en-tête.
- `subtitle` (string) — Sous-titre optionnel.
- `popup_background` (string) — Couleur de fond (hex, rgb, nom CSS). Défaut `#ffffff`.
- `popup_background_opacity` (number 0..1) — Opacité du fond. Défaut `0.95`.
- `popup_width` (number 0..100) — Largeur en pourcentage. Défaut `90`.
- `popup_border_radius` (number, px) — Rayon des coins. Défaut `20`.
- `header_background`, `header_text_color`, `handle_color` — Apparence de l'en-tête.
- `shadow_blur` (number) — Intensité de l'ombre.

Remarque : des valeurs vides ne remplacent pas les styles par défaut — la carte applique des fallbacks cohérents.

---

## 🎯 Sous-boutons & actions

Jusqu'à 2 sous-boutons peuvent être affichés dans l'en-tête. Chaque bouton accepte :

- `icon` (ex. `mdi:lightbulb`) — Obligatoire pour afficher le bouton.
- `badge` — Petit label texte ou nombre.
- `tap_action`, `hold_action`, `double_tap_action` — Objets d'action Home Assistant.

Actions courantes : `navigate`, `url`, `more-info`, `toggle`, `call-service`.

Exemple :

```yaml
sub_btn_1:
  icon: mdi:lightbulb
  badge: "3"
  tap_action:
    action: toggle
    entity_id: light.salon
  hold_action:
    action: more-info
    entity_id: light.salon
  double_tap_action:
    action: url
    url_path: https://example.com
```

Conseil : testez vos `entity_id` et services séparément avant de les intégrer au popup.

---

## 🧪 Exemples

### 1) Contrôle des lumières

```yaml
type: custom:ios-popup-card
title: "Contrôle des lumières"
popup_background: "#f5f5f5"
popup_border_radius: 25

sub_btn_1:
  icon: mdi:lightbulb
  badge: on
  tap_action:
    action: toggle
    entity_id: light.salon
  hold_action:
    action: more-info
    entity_id: light.salon

sub_btn_2:
  icon: mdi:palette
  tap_action:
    action: navigate
    navigation_path: /lovelace/lights

cards:
  - type: entities
    entities:
      - light.salon
      - light.chambre
      - light.cuisine
```

### 2) Climatisation

```yaml
type: custom:ios-popup-card
title: "Climatisation"
popup_background: "#ffffff"
popup_background_opacity: 0.98
header_background: "#e3f2fd"

sub_btn_1:
  icon: mdi:thermometer
  badge: "21°C"
  tap_action:
    action: more-info
    entity_id: climate.salon

sub_btn_2:
  icon: mdi:fan
  tap_action:
    action: call-service
    service: climate.set_temperature
    service_data:
      entity_id: climate.salon
      temperature: 22

cards:
  - type: thermostat
    entity: climate.salon
```

### 3) Sécurité (porte)

```yaml
type: custom:ios-popup-card
title: "Sécurité"
subtitle: "Entrée principale"
popup_background: "#fff3e0"

sub_btn_1:
  icon: mdi:door-open
  badge: closed
  tap_action:
    action: more-info
    entity_id: binary_sensor.porte_entree
  double_tap_action:
    action: url
    url_path: https://mon-camera.local:8123

sub_btn_2:
  icon: mdi:lock
  tap_action:
    action: toggle
    entity_id: lock.entree
  hold_action:
    action: toggle
    entity_id: cover.volet_entree

cards:
  - type: entities
    entities:
      - binary_sensor.porte_entree
      - lock.entree
      - cover.volet_entree
  - type: camera
    entity: camera.entree
```

---

## 🩺 Depannage

- Popup invisible : vérifiez le hash (`#popup`), la ressource JS et videz le cache.
- Boutons inactifs : vérifiez `entity_id`, permissions et logs Home Assistant.
- Gestes : `hold` ≥450ms ; `double-tap` ≤280ms.

Pour les erreurs JS, ouvrez la console (F12) et copiez les messages.

---

## 📋 Changelog & credits

- **v2.1** — Intégration `ui_action`, meilleures détections de gestes, fallback pour anciennes configs.

Inspiré par Bubble Card — merci aux contributeurs.

---

Si vous souhaitez, je peux :

- ajouter une section FAQ courte
- fournir des snippets YAML prêts à coller
- documenter un changelog détaillé par version

---

## ❓ FAQ (questions fréquentes)

Q: Comment ouvrir le popup depuis un bouton ?

R: Utilisez une action `navigate` pointant vers le hash configuré :

```yaml
type: button
tap_action:
  action: navigate
  navigation_path: "#popup"
```

Q: Le fond défile lorsque le popup est ouvert, comment l'empêcher ?

R: La carte bloque le scroll du `body` automatiquement quand le popup est ouvert. Si vous observez un scroll, vérifiez qu'aucun autre composant n'interfère.

Q: Puis-je mettre plusieurs cartes lourdes dans le popup ?

R: Oui, mais évitez d'en mettre trop (risque d'UX et de performance). Préférez plusieurs petits cards ou lazy-loading via `custom:swipe-card` ou `custom:auto-entities`.

---

## 🧩 Snippets YAML pratiques

1) Ouvrir le popup depuis une carte bouton (existant) :

```yaml
type: button
name: Ouvrir Popup
tap_action:
  action: navigate
  navigation_path: "#popup"
```

1) Sous-bouton pour basculer une lumière (tap) et afficher les détails (hold) :

```yaml
sub_btn_1:
  icon: mdi:lightbulb
  tap_action:
    action: toggle
    entity_id: light.salon
  hold_action:
    action: more-info
    entity_id: light.salon
```

1) Sous-bouton qui ouvre une page Lovelace (navigation) :

```yaml
sub_btn_2:
  icon: mdi:palette
  tap_action:
    action: navigate
    navigation_path: /lovelace/lights
```

1) Appel de service depuis un sous-bouton (script ou service) :

```yaml
sub_btn_2:
  icon: mdi:run
  tap_action:
    action: call-service
    service: script.scene_nuit
```

---

## 📋 Changelog detaille

- **v2.1** (Mars 2026)
  - Migration des actions vers le sélecteur natif `ui_action`.
  - Gestion complète des gestes pour les sous-boutons (tap / hold / double-tap).
  - Compatibilité ascendante : conversion automatique des anciennes cibles textuelles.
  - Amélioration de l'ouverture/fermeture (animations, verrouillage du scroll du fond).

- **v2.0** (Décembre 2025)
  - Ajout des sous-boutons d'en-tête et badges.
  - Support initial des actions `call-service`, `toggle`, `more-info`, `navigate`.

- **v1.0** (Août 2025)
  - Première version de la carte : affichage du popup, rendu des cartes Lovelace à l'intérieur, interaction basique.

---

Si vous voulez que j'ajoute d'autres snippets (ex.: intégration media_player, scènes, ou automatisations), dites-moi lesquels et je les génèrerai.
