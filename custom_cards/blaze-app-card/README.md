# Blaze App Card

[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-Lovelace-41BDF5?style=for-the-badge&logo=home-assistant&logoColor=white)](https://www.home-assistant.io/)
[![HACS](https://img.shields.io/badge/HACS-Custom%20Card-41BDF5?style=for-the-badge)](https://hacs.xyz)
[![Version](https://img.shields.io/badge/Version-v0.2.6-0EA5E9?style=for-the-badge)](https://github.com/Micpi/blaze-app-card)
[![Type](https://img.shields.io/badge/Type-Professional%20Control%20Panel-0284C7?style=for-the-badge)](https://github.com/Micpi/blaze-app-card)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=000000)](https://buymeacoffee.com/mickaelpila)

Carte Lovelace orientee exploitation professionnelle pour l'integration Blaze PowerZone: pilotage rapide, controle fin, DSP, supervision signal et commandes API dans une seule interface.

---

## Pourquoi cette carte

- Interface "console" claire pour les operations quotidiennes.
- Decouverte automatique des entites Blaze (`sensor`, `number`, `select`, `switch`, `button`).
- Pilotage immediat: boutons, switches, sliders et presets DSP.
- Monitoring visuel des signaux avec jauges et tendances (sparkline) quand des echantillons sont exposes.
- Editeur visuel en accordeons (style Naive Flex), avec mapping configurable par mots-cles.

## Fonctionnalites principales

- Onglets metier: `Overview`, `Controls`, `DSP`, `Signal`, `Variables`, `API`.
- Affichage condense des informations systeme (firmware, uptime, statut, etc.).
- Actions rapides via `button.press`.
- Switches principaux en mode "pill" ON/OFF + switches avances.
- Sliders principaux et sliders DSP detectes automatiquement.
- Selects dynamiques (routing, preset, profils, modes, etc.).
- Gauges de signal avec couleurs de seuil (`good` / `warn` / `bad`).
- Sparkline automatique si l'entite expose `samples`, `history` ou `values` dans les attributs.
- Panneau API brute (`blaze_powerzone.send_raw_command`) activable/desactivable.

## Installation

1. Ajouter le depot dans HACS en tant que "Lovelace" custom repository.
2. Installer `Blaze App Card` depuis HACS.
3. Verifier la ressource JS (HACS le fait generalement automatiquement).

## Ressource Lovelace

```yaml
resources:
  - url: /hacsfiles/blaze-app-card/blaze-app-card.js
    type: module
```

## Exemple minimal

```yaml
type: custom:blaze-app-card
title: Blaze Control Center
entity_prefix: blaze_powerzone
show_raw_panel: true
```

## Exemple avance (pro)

```yaml
type: custom:blaze-app-card
title: Rack Blaze - FOH
entity_prefix: blaze_powerzone
entry_id: 7b4f357278ef4216baaa111222333444

show_raw_panel: true
show_overview: true
show_controls: true
show_dsp: true
show_signal: true
show_variables: true
show_api: true

core_switch_keywords: power,mute,standby,enable,bridge,protect
primary_number_keywords: volume,gain,master,trim,input,output
signal_sensor_keywords: signal,rssi,snr,temperature,voltage,current,power,latency,clip
dsp_keywords: dsp,eq,equalizer,crossover,delay,phase,filter,limiter,compressor,preset,routing
```

## Reference configuration

- `title` (string, defaut: `Blaze Control Center`): titre affiche dans l'entete.
- `entity_prefix` (string, defaut: `blaze_powerzone`): prefix de detection des entites Blaze.
- `blaze_device_filter` (string, defaut: `""`): filtre optionnel pour cibler un ampli Blaze specifique parmi plusieurs devices exposes.
- `entry_id` (string, defaut: `""`): identifiant d'entree integration pour les commandes API.
- `show_raw_panel` (boolean, defaut: `true`): active/desactive le panneau API brute.
- `show_overview` (boolean, defaut: `true`): affiche/masque l'onglet Overview.
- `show_controls` (boolean, defaut: `true`): affiche/masque l'onglet Controls.
- `show_dsp` (boolean, defaut: `true`): affiche/masque l'onglet DSP.
- `show_signal` (boolean, defaut: `true`): affiche/masque l'onglet Signal.
- `show_variables` (boolean, defaut: `true`): affiche/masque l'onglet Variables.
- `show_api` (boolean, defaut: `true`): affiche/masque l'onglet API.
- `core_switch_keywords` (string CSV, defaut: `power,mute,protection,standby,enable,bridge`): mapping des switches prioritaires.
- `primary_number_keywords` (string CSV, defaut: `volume,gain,level,master,trim`): mapping des sliders prioritaires.
- `signal_sensor_keywords` (string CSV, defaut: `signal,rssi,snr,quality,level,input,output,clip,temperature,temp,voltage,current,power,latency`): mapping des capteurs pour gauges et monitoring signal.
- `dsp_keywords` (string CSV, defaut: `dsp,eq,equalizer,crossover,xo,delay,phase,polarity,filter,limiter,compressor,preset,profile,routing,matrix`): mapping des controles DSP.

## Service Home Assistant utilise

```yaml
service: blaze_powerzone.send_raw_command
data:
  command: GET API_VERSION
  entry_id: 7b4f357278ef4216baaa111222333444
```

## FAQ

### La carte n'affiche presque rien

- Verifier `entity_prefix`.
- Si plusieurs amplis sont exposes, verifier `blaze_device_filter` ou laisser le mode Auto.
- Verifier que les entites Blaze existent bien dans l'etat Home Assistant.
- Ajuster les mappings CSV (`*_keywords`) pour forcer le bon classement.

### Pourquoi je ne vois pas de sparkline

La sparkline s'affiche uniquement si le capteur expose un tableau numerique dans ses attributs (`samples`, `history` ou `values`).

### Puis-je masquer des onglets pour simplifier l'interface

Oui, via `show_overview`, `show_controls`, `show_dsp`, `show_signal`, `show_variables`, `show_api`.
