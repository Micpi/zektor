# Autopilot HA Factory

Guide trie pour produire des integrations et custom cards Home Assistant en chaine, avec standards constants.

## 1. Contraintes non negociables

### Integrations Python

- Toujours `config_flow.py` + traductions `translations/fr.json` et `translations/en.json`.
- Toujours `DataUpdateCoordinator` pour centraliser I/O reseau.
- Toujours du code async (`async`/`await`) sans blocage.
- Toujours un client API dedie (`api.py`) avec logs verbeux.
- Toujours valider/sanitiser les entr ees utilisateur du config flow.
- Toujours definir explicitement la gestion de reconnexion (backoff exponentiel 1s -> 2s -> 4s -> max 60s).

### Cartes Lovelace

- Toujours exposer `setConfig()`, setter `hass`, `getCardSize()`.
- Toujours gerer la vue sections avec `getGridOptions()`.
- Toujours exposer un editeur graphique (de preference `getConfigForm` + selectors HA).
- Toujours avoir `getConfigElement()` pour les cas avances.
- Toujours respecter le style Naive Flex (accordeons details/summary).
- Toujours eviter les rerenders complets pendant la saisie (pas de recreation globale du DOM editor).

### Versionning et HACS

- Cartes: aligner `package.json` + `hacs.json`.
- Integrations: aligner `manifest.json` + `hacs.json`.
- Publier des GitHub releases (pas uniquement des tags) pour un affichage SemVer correct dans HACS.

## 2. Nouveautes API a surveiller (etat 2026-06-01)

- Frontend custom card: nouvelle suggestion de carte dans le picker via `window.customCards[].getEntitySuggestion` (disponible 2026.6).
- Config flow: deprecation du mode avance annoncee dans le blog dev.
- Frontend components: updates 2026.6 a surveiller pour les composants de formulaire/selectors.

Sources officielles:

- [Home Assistant developers blog](https://developers.home-assistant.io/blog/)
- [Custom card API](https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/)
- [Integration developer docs](https://developers.home-assistant.io/docs/development_index)
- [HACS publish requirements](https://www.hacs.xyz/docs/publish/start/)

## 3. Routine de veille obligatoire

1. Lancer `pwsh -File scripts/check_ha_api_updates.ps1` avant nouvelle serie de dev.
2. Lire `knowledge/ha_api_notes/latest_watch.md`.
3. Si changement detecte: mettre a jour templates et checklist avant de coder.

## 4. Standard de configuration unifie

### Integrations

Schema minimum obligatoire:

- `manifest.json`: `domain`, `name`, `version`, `documentation`, `issue_tracker`, `codeowners`, `config_flow`.
- `config_flow.py`: validation stricte + options flow.
- `coordinator.py`: polling + erreurs reseau gerees + journalisation.

### Custom cards

Schema editeur prefere:

- Utiliser `getConfigForm` et les selectors standards (`entity`, `icon`, `text`, `number`, `boolean`, `theme`).
- Grouper les champs en sections: General, Actions, Styles, Defaults.
- Conserver les champs de style harmonises:
  - `preset`, `shape`, `appearance`, `size`, `elevation`
  - `active_color`, `inactive_color`, `background_color`, `text_color`
  - `auto_text_contrast`

## 5. Catalogue et gouvernance

- Inventaire central: `README_WORKSPACE_CATALOG.md`.
- Regeneration: `pwsh -File scripts/generate_workspace_catalog.ps1`.
- Les ecarts de version doivent etre corriges avant release.

## 6. Pipeline recommande pour production en chaine

1. `HA: Veille API Home Assistant`
2. `HA: Generer catalogue workspace`
3. `HA: Lint Python (pylint + mypy)`
4. `HA: Verifier la config YAML`
5. `HA: Tests integration (pytest)`
6. `HA: Build custom card`

## 7. Definition of done

- Integration: config flow OK, coordinator OK, traductions OK, tests OK.
- Carte: rendu OK desktop/mobile, editeur graphique stable, getCardSize/getGridOptions OK.
- HACS: version alignee + release GitHub publiee.
- Documentation: README de composant et catalogue global a jour.
