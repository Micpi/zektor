# Workspace Catalog Home Assistant

Inventaire auto-genere des cartes et integrations de ce workspace.
Ce fichier est la SEULE source de verite pour la liste des depots a ajouter dans HACS -
ne pas dupliquer cette liste ailleurs (docs, README, etc.), la referencer a la place.

- Date generation: 2026-07-26 17:42:57
- Regle: HACS et package/manifest doivent etre alignes pour eviter les versions incoherentes.

## Depots a ajouter dans HACS (Parametres > Depots personnalises)

| Nom | Type HACS | URL du depot GitHub |
| --- | --- | --- |
| activity-select-card | Lovelace (Plugin) | https://github.com/Micpi/activity-select-card |
| area-card | Lovelace (Plugin) | https://github.com/Micpi/alpha-area-card |
| blaze-app-card | Lovelace (Plugin) | https://github.com/Micpi/blaze-app-card |
| ha-dock-card | Lovelace (Plugin) | https://github.com/Micpi/ios-dock |
| iOS-PopUp-card | Lovelace (Plugin) | https://github.com/Micpi/ios-popup-card |
| light-slider-card | Lovelace (Plugin) | https://github.com/Micpi/light-slider-card |
| naive-flex-card | Lovelace (Plugin) | https://github.com/Micpi/naive-flex-card |
| pure-thermostat-card | Lovelace (Plugin) | https://github.com/Micpi/pure-thermostat-card |
| scene-manager-card | Lovelace (Plugin) | https://github.com/Micpi/scene-manager-card |
| thermo-halo-card | Lovelace (Plugin) | https://github.com/Micpi/thermo-halo-card |
| ultimate-tabbed-card | Lovelace (Plugin) | https://github.com/Micpi/ultimate-tabbed-card |
| Blaze | Integration | https://github.com/Micpi/blaze-powerzone |
| EPSON | Integration | https://github.com/Micpi/epson-ls12000-ha |
| NAD | Integration | https://github.com/Micpi/nad-avr |
| scene-manager-ultimate | Integration | https://github.com/Micpi/ha-scene-manager-ultimate |
| zektor | Integration | N/A |

## Cartes custom

| Carte | Depot GitHub | Version HACS | Version package | Statut | README |
| --- | --- | --- | --- | --- | --- |
| activity-select-card | https://github.com/Micpi/activity-select-card | 1.2.4 | 1.2.4 | OK | [activity-select-card](custom_cards/activity-select-card/README.md) |
| area-card | https://github.com/Micpi/alpha-area-card | 1.2.11 | 1.2.11 | OK | [area-card](custom_cards/area-card/README.md) |
| blaze-app-card | https://github.com/Micpi/blaze-app-card | 0.2.7 | 0.2.7 | OK | [blaze-app-card](custom_cards/blaze-app-card/README.md) |
| ha-dock-card | https://github.com/Micpi/ios-dock | 0.2.1 | 0.2.1 | OK | [ha-dock-card](custom_cards/ha-dock-card/README.md) |
| iOS-PopUp-card | https://github.com/Micpi/ios-popup-card | 3.0.1 | 3.0.1 | OK | [iOS-PopUp-card](custom_cards/iOS-PopUp-card/README.md) |
| light-slider-card | https://github.com/Micpi/light-slider-card | 1.3.1 | 1.3.1 | OK | [light-slider-card](custom_cards/light-slider-card/README.md) |
| naive-flex-card | https://github.com/Micpi/naive-flex-card | 0.3.1 | 0.3.1 | OK | [naive-flex-card](custom_cards/naive-flex-card/README.md) |
| pure-thermostat-card | https://github.com/Micpi/pure-thermostat-card | 0.2.10 | 0.2.10 | OK | [pure-thermostat-card](custom_cards/pure-thermostat-card/README.md) |
| scene-manager-card | https://github.com/Micpi/scene-manager-card | 1.1.11 | 1.1.11 | OK | [scene-manager-card](custom_cards/scene-manager-card/README.md) |
| thermo-halo-card | https://github.com/Micpi/thermo-halo-card | 0.2.1 | 0.2.1 | OK | [thermo-halo-card](custom_cards/thermo-halo-card/README.md) |
| ultimate-tabbed-card | https://github.com/Micpi/ultimate-tabbed-card | 0.3.13 | 0.3.13 | OK | [ultimate-tabbed-card](custom_cards/ultimate-tabbed-card/README.md) |

## Integrations

| Dossier | Depot GitHub | Domaine | Version manifest | Version HACS | Config flow | Statut | Manifest |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Blaze | https://github.com/Micpi/blaze-powerzone | blaze_powerzone | 1.0.14 | 1.0.14 | True | OK | [blaze_powerzone](integrations/Blaze/custom_components/blaze_powerzone/manifest.json) |
| EPSON | https://github.com/Micpi/epson-ls12000-ha | epson_ls12000 | 0.2.2 | N/A | True | OK | [epson_ls12000](integrations/EPSON/custom_components/epson_ls12000/manifest.json) |
| NAD | https://github.com/Micpi/nad-avr | nad_avr | 0.1.6 | 0.1.6 | True | OK | [nad_avr](integrations/NAD/custom_components/nad_avr/manifest.json) |
| scene-manager-ultimate | https://github.com/Micpi/ha-scene-manager-ultimate | scene_manager | 1.1.2 | 1.1.2 | True | OK | [scene_manager](integrations/scene-manager-ultimate/custom_components/scene_manager/manifest.json) |
| zektor | N/A | zektor | 0.3.8 | 0.3.8 | True | OK | [zektor](integrations/zektor/custom_components/zektor/manifest.json) |

## Points d attention

- Statut MISMATCH: aligner les versions avant release.
- Statut PARTIEL/A COMPLETER: definir une strategie unique de version (hacs + package pour cartes, hacs + manifest pour integrations).
- Depot GitHub = N/A: dossier sans remote Git 'origin' configure (a corriger avant publication HACS).
- Reexecuter ce script apres chaque publication: pwsh -File scripts/generate_workspace_catalog.ps1
