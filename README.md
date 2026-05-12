# HomeAssistant-AI – Workspace de développement

Workspace centralisé pour le développement Home Assistant : intégrations Python,
cartes Lovelace, dashboards, automations et thèmes.

## Prérequis

- Python 3.12+
- Node.js 20+ (pour les custom cards)
- PowerShell 7+ (scripts d'automatisation)
- Git
- VS Code avec les extensions recommandées (voir `.vscode/extensions.json`)

## Installation

```powershell
# Cloner et installer les dépendances Python
git clone <repo-url>
cd HomeAssistant-AI
pip install -r tests/requirements.txt

# Pour les custom cards
cd custom_cards/my-card
npm install
```

## Scripts disponibles

| Script | Description |
| --- | --- |
| `scripts/check_yaml.ps1` | Valide la config YAML Home Assistant |
| `scripts/test_integration.ps1` | Lance les tests pytest |
| `scripts/build_card.ps1 -CardName <nom>` | Build une custom card |
| `scripts/auto_commit.ps1` | Auto commit/push scope HA (`custom_cards/`, `integrations/`) + version/tag auto |
| `scripts/publish_current_js.ps1 -CurrentFile <fichier>` | One-click publish: build carte du fichier actif + commit/version/tag/push |

Guide complet des commandes: [docs/commandes.md](docs/commandes.md)

### Versionning et release automatiques

- Le script `scripts/auto_commit.ps1` ne commit que `custom_cards/` et `integrations/`.
- Il calcule automatiquement la prochaine version SemVer patch depuis le dernier tag `vX.Y.Z`.
- Il met a jour `version` dans `package.json`, `hacs.json`, `manifest.json` des composants modifies.
- Il commit, cree le tag, puis push la branche et le tag (sauf options `-NoPush` / `-NoTag`).
- Le mode `-Watch` commit automatiquement chaque changement detecte.

Exemples:

```powershell
# Commit + tag + push auto
pwsh -File scripts/auto_commit.ps1

# Commit auto en continu toutes les 10s
pwsh -File scripts/auto_commit.ps1 -Watch -IntervalSeconds 10

# Commit local seulement
pwsh -File scripts/auto_commit.ps1 -NoPush
```

- Le workflow GitHub `.github/workflows/auto-release-hacs.yml` cree automatiquement une release a chaque push sur `main` contenant des changements dans `custom_cards/` ou `integrations/`.

## Tâches VS Code

`Ctrl+Shift+P` → `Tasks: Run Task` :

- **HA: Pipeline complet** – lint + tests + YAML check
- **HA: Build custom card** – build JS minifié
- **HA: Tests intégration** – pytest verbose
- **HA: Vérifier la config YAML** – validation YAML
- **HA: Commit & Push** – commit Git

## Structure des intégrations

```text
integrations/mon_integration/
├── __init__.py          # Setup + forward platforms
├── manifest.json        # Métadonnées
├── config_flow.py       # UI config + options flow
├── coordinator.py       # DataUpdateCoordinator
├── api.py               # Client HTTP async (aiohttp)
├── const.py             # Constantes
├── sensor.py            # Entités sensor
├── switch.py            # Entités switch
├── button.py            # Entités button
└── translations/
    ├── fr.json
    └── en.json
```

## Structure des custom cards

```text
custom_cards/ma-carte/
├── ma-carte.js          # Composant principal (LitElement)
├── editor.js            # Éditeur visuel
├── styles.css           # Styles (variables CSS HA)
├── package.json
├── README.md
└── examples/
```

## Design System

Consulter `themes/design_system.md` pour toutes les règles visuelles.

## Base de connaissances

Consulter `knowledge/` pour les patterns réutilisables et les sessions de debug.

## Licence

Usage privé.
