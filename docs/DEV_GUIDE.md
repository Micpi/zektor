# Guide développeur – HomeAssistant-AI

> Pour les agents IA et développeurs humains travaillant sur ce workspace.

---

## Prérequis

- **Python 3.12+** (avec `.venv` activé)
- **Node.js 18+** (pour les cartes Lovelace)
- **PowerShell 7+** (`pwsh`)
- **Git**
- **VS Code** avec les extensions recommandées

### Extensions VS Code recommandées

```
ms-python.python
ms-python.pylint
ms-python.mypy-type-checker
esbenp.prettier-vscode
redhat.vscode-yaml
keesschollaart.vscode-home-assistant
GitHub.copilot
```

---

## Environnement Python

```powershell
# Créer le venv (une seule fois)
python -m venv .venv

# Activer
.venv\Scripts\Activate.ps1

# Installer les dépendances
pip install -r tests/requirements.txt
```

---

## Créer une nouvelle intégration

1. Copier le template `templates/integration_template/` → `custom_components/<domain>/`
2. Mettre à jour `manifest.json` (domain, version, requirements)
3. Implémenter `const.py`, `api.py`, `coordinator.py`, `config_flow.py`
4. Créer les entités (`sensor.py`, `switch.py`, etc.)
5. Ajouter les traductions (`translations/fr.json`, `translations/en.json`)
6. Écrire les tests dans `tests/<domain>/`
7. Lancer : `pwsh scripts/test_integration.ps1`

### Structure minimale

```
custom_components/<domain>/
├── __init__.py       → setup_entry / unload_entry
├── manifest.json     → domain, version, requirements, dependencies
├── config_flow.py    → ConfigFlow + OptionsFlow
├── coordinator.py    → DataUpdateCoordinator (appels API)
├── api.py            → client async (aiohttp/asyncio)
├── const.py          → DOMAIN, PLATFORMS, DEFAULT_*
├── sensor.py         → entités sensor
└── translations/
    ├── fr.json
    └── en.json
```

---

## Créer une nouvelle carte Lovelace

```powershell
# Générer le squelette
pwsh scripts/new-custom-card.ps1 -CardName "ma-nouvelle-carte"
```

Puis éditer `custom_cards/ma-nouvelle-carte/ma-nouvelle-carte.js`.

### Structure minimale d'une carte

```javascript
class MaNouvelleCard extends HTMLElement {
  setConfig(config) { /* validation config */ }
  set hass(hass) { /* mise à jour état */ }
  getCardSize() { return 3; }
  static getConfigElement() { /* éditeur visuel */ }
  static getStubConfig() { return {}; }
}
customElements.define('ma-nouvelle-carte', MaNouvelleCard);
```

**Rappel** : l'éditeur visuel doit utiliser le style Naive Flex (accordéons `<details>/<summary>`).

### Build et publication

```powershell
# Build
pwsh scripts/build_card.ps1 -CardName "ma-nouvelle-carte"

# Publier vers HA
pwsh scripts/publish_current_js.ps1 -CurrentFile "custom_cards/ma-nouvelle-carte/ma-nouvelle-carte.js"
```

---

## Tests

```powershell
# Tous les tests
pwsh scripts/test_integration.ps1

# Un test spécifique
.venv\Scripts\python.exe -m pytest tests/<domain>/test_<fichier>.py -v

# Avec couverture
.venv\Scripts\python.exe -m pytest tests/ --cov=custom_components --cov-report=term-missing
```

---

## Linting et validation

```powershell
# YAML
pwsh scripts/check_yaml.ps1

# Python (pylint + mypy)
# Via tâche VS Code : "HA: Lint Python (pylint + mypy)"

# Pipeline complet
# Via tâche VS Code : "HA: Pipeline complet (lint + test + yaml)"
```

---

## Git workflow

```powershell
# Commit + push
pwsh scripts/auto_commit.ps1 -Message "feat: description de la feature"
```

### Convention de messages de commit

- `feat: <description>` → nouvelle feature
- `fix: <description>` → correction de bug
- `refactor: <description>` → refactoring sans changement de comportement
- `docs: <description>` → documentation uniquement
- `chore: <description>` → maintenance (deps, config)

---

## Base de connaissances

Consulter `knowledge/` pour les patterns réutilisables :

| Dossier                      | Contenu                                |
|------------------------------|----------------------------------------|
| `knowledge/websocket_patterns/` | Gestion WebSocket HA              |
| `knowledge/reconnect_patterns/` | Stratégies de reconnexion         |
| `knowledge/mqtt_patterns/`   | Intégrations MQTT                      |
| `knowledge/ha_api_notes/`    | Notes API HA REST et WebSocket         |
| `knowledge/dashboard_patterns/` | Patterns Lovelace réutilisables   |
| `knowledge/performance_notes/`  | Optimisations performance          |
| `knowledge/debug_sessions/`  | Sessions de debug documentées          |

---

## Sécurité (checklist OWASP)

- [ ] Credentials dans `secrets.yaml`, jamais en dur dans le code
- [ ] Validation des inputs utilisateur dans `config_flow` via `config_validation`
- [ ] Logging : ne jamais logguer de tokens, mots de passe, clés API
- [ ] Requêtes HTTP externes : TLS uniquement (`https://`, `wss://`)
- [ ] Dépendances Python : vérifier les CVE avant ajout dans `manifest.json`
