# Contexte du projet – HomeAssistant-AI

> Pour la documentation complète, consulter [`docs/PROJECT_CONTEXT.md`](docs/PROJECT_CONTEXT.md).
> Pour la liste à jour des cartes/intégrations et de leurs dépôts GitHub (HACS), consulter [`README_WORKSPACE_CATALOG.md`](README_WORKSPACE_CATALOG.md).

## Vue d'ensemble

Workspace de développement Home Assistant centralisé. Versionné avec Git, intégré à VS Code + GitHub Copilot. Regroupe intégrations Python, cartes Lovelace, dashboards, automations, ESPHome et thèmes.

## Structure du workspace

```text
.github/                  → Instructions Copilot (copilot-instructions.md)
.vscode/                  → Config VS Code (settings, tâches, extensions)
automations/              → Automations YAML Home Assistant
blueprints/               → Blueprints HA réutilisables
custom_cards/             → Cartes Lovelace (Web Components JS), 1 dossier = 1 repo Git
dashboards/               → Tableaux de bord YAML Lovelace
docs/                     → Documentation technique complète
  ├── PROJECT_CONTEXT.md  ← Contexte complet pour agents IA
  ├── DEV_GUIDE.md        ← Guide développeur
  ├── AUTOMATIONS.md      ← Conventions automations
  ├── DASHBOARDS.md       ← Guide dashboards Lovelace
  └── ESPHOME.md          ← Guide ESPHome
esphome/                  → Configurations ESPHome pour devices DIY
examples/                 → Exemples fonctionnels de référence
integrations/             → Intégrations Python HA, 1 dossier = 1 repo Git (source de vérité HACS)
knowledge/                → Base de connaissances patterns & debug
packages/                 → Packages HA (config organisée par domaine)
scripts/                  → Scripts PowerShell d'automatisation
templates/                → Templates réutilisables
tests/                    → Tests unitaires pytest
themes/                   → Thèmes HA + design system
tools/                    → Outils auxiliaires
```

> Note : `custom_components/` (racine) a été retiré le 2026-07-26 - il
> dupliquait avec du contenu divergent certaines intégrations d'`integrations/`.
> Archivé (non supprimé) dans `_archive/custom_components_root_backup_2026-07-26/`.
> `integrations/` est la seule source de vérité pour les intégrations.

## Projets actifs

La liste à jour (cartes, intégrations, versions, dépôts GitHub) est générée
automatiquement — voir [`README_WORKSPACE_CATALOG.md`](README_WORKSPACE_CATALOG.md).
Ne pas maintenir de liste statique ici, elle se désynchronise vite.

## Design System

Fichier de référence : `themes/design_system.md`

| Variable          | Valeur    |
|-------------------|-----------|
| Primary           | `#00AEEF` |
| Background        | `#111827` |
| Cards             | `#1F2937` |
| Accent            | `#38BDF8` |
| Warning           | `#F59E0B` |
| Error             | `#EF4444` |

## Conventions techniques

- **Python 3.12+** – async/await, DataUpdateCoordinator, config_flow
- **HA minimum version** : 2024.1
- **Tests** : pytest + pytest-homeassistant-custom-component
- **Linting** : pylint + mypy + black
- **Cartes** : éditeur visuel style Naive Flex (accordéons details/summary)
- **JS/TS** : LitElement, Web Components, ESLint + Prettier
- **YAML** : yamllint, redhat.vscode-yaml

## Workflow de développement

1. Créer/modifier l'intégration ou la carte
2. `Ctrl+Shift+P` → `HA: Pipeline complet` pour valider
3. Documenter le pattern dans `knowledge/`
4. Régénérer le catalogue : `pwsh -File scripts/generate_workspace_catalog.ps1`
5. Préparer la release HACS (voir `AGENTS.md`) avant de considérer la tâche terminée
6. `Ctrl+Shift+P` → `HA: Commit & Push`
