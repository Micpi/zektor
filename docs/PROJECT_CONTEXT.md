# Contexte du projet – HomeAssistant-AI

> Document de référence pour les agents IA (GitHub Copilot, ChatGPT, etc.)
> Lire ce fichier en premier pour comprendre l'ensemble de l'installation.

---

## Vue d'ensemble

Ce workspace est un **environnement de développement Home Assistant** complet, versionné avec Git et intégré à VS Code + GitHub Copilot. Il centralise :

- Des **intégrations Python** (`integrations/`)
- Des **cartes Lovelace personnalisées** (Web Components JS, `custom_cards/`)
- Des **tableaux de bord YAML** Lovelace
- Des **automations et blueprints** YAML
- Des **configurations ESPHome** pour appareils DIY
- Des **packages HA** pour organiser la config par domaine
- Des **thèmes** visuels personnalisés
- Une **base de connaissances** de patterns réutilisables

---

## Structure du workspace

```text
.github/                  → Instructions Copilot (copilot-instructions.md)
.vscode/                  → Config VS Code (settings, tâches, extensions)
automations/              → Automations YAML Home Assistant
blueprints/               → Blueprints HA réutilisables
custom_cards/             → Cartes Lovelace (JS Web Components), 1 dossier = 1 repo Git
dashboards/               → Tableaux de bord YAML Lovelace
docs/                     → Documentation technique (CE DOSSIER)
esphome/                  → Configurations ESPHome pour devices DIY
  ├── common/             ← Config de base partagée
  └── devices/            ← Configs par type de device
examples/                 → Exemples fonctionnels de référence
integrations/             → Intégrations Python HA, 1 dossier = 1 repo Git (source de vérité HACS)
knowledge/                → Base de connaissances patterns & debug
logs/                     → Logs de développement/debug
packages/                 → Packages HA (config par domaine)
  └── lighting/           ← Package éclairage (exemple)
scripts/                  → Scripts PowerShell d'automatisation
templates/                → Templates réutilisables (cartes, intégrations)
tests/                    → Tests unitaires pytest
themes/                   → Thèmes HA + design system
tools/                    → Outils auxiliaires
vscode-lovelace-preview/  → Extension VS Code preview Lovelace (dev)
```

> **`custom_components/` (racine)** a existé jusqu'au 2026-07-26 comme copie
> parallèle de certaines intégrations (`epson_ls12000`, `nad_avr`, `zektor`).
> Son contenu avait divergé de celui d'`integrations/` (fichiers différents
> selon l'intégration, sans direction de synchronisation cohérente). Il a été
> déplacé hors du repo Git (`_archive/custom_components_root_backup_2026-07-26/`)
> plutôt que supprimé, le temps de confirmer s'il servait de dossier de
> déploiement local vers une instance HA réelle (voir le `NOTE.md` dans ce
> dossier d'archive). **`integrations/` est désormais la seule source de
> vérité** pour ces intégrations — ne pas recréer de copie parallèle.

---

## Projets actifs

> La liste à jour (versions, statut, URL du dépôt GitHub à ajouter dans HACS)
> est générée automatiquement dans
> [`README_WORKSPACE_CATALOG.md`](../README_WORKSPACE_CATALOG.md) via
> `pwsh -File scripts/generate_workspace_catalog.ps1`. Ne pas dupliquer ce
> tableau ici : un tableau figé se désynchronise vite (constaté lors de
> l'audit du 2026-07-26 - ce fichier ne listait encore que Zektor et Blaze
> alors qu'EPSON, NAD et scene-manager-ultimate existaient déjà, et seules
> 10 des 11 cartes étaient listées).

Notes qui ne changent pas souvent (contexte métier, pas de version) :

- **Zektor AVR** (`zektor`) : ampli-tuner Zektor (API TCP). Entités sensor/switch/button/number/select. Config flow FR/EN. Reconnexion avec backoff exponentiel.
  ⚠️ Cas particulier : ce dossier n'a pas (encore) son propre repo Git indépendant, contrairement aux autres intégrations. Le remote `origin` du workspace lui-même pointe vers `github.com/Micpi/zektor`. À clarifier avant de traiter zektor comme les autres intégrations pour une release HACS.
- **Blaze PowerZone** (`blaze_powerzone`) : système audio Blaze. Repo indépendant dans `integrations/Blaze/`.
- **EPSON LS12000** (`epson_ls12000`) : contrôle vidéoprojecteur Epson. Repo indépendant dans `integrations/EPSON/`.
- **NAD AVR** (`nad_avr`) : ampli-tuner NAD. Repo indépendant dans `integrations/NAD/`.
- **Scene Manager Ultimate** (`scene_manager`) : gestionnaire de scènes. Repo indépendant dans `integrations/scene-manager-ultimate/`.
- **naive-flex-card** : carte de référence pour le style d'éditeur visuel (accordéons `details`/`summary`) — toute nouvelle carte doit le reprendre.

---

## Design System

Fichier de référence : [`themes/design_system.md`](../themes/design_system.md)

| Variable              | Valeur      |
|-----------------------|-------------|
| Primary               | `#00AEEF`   |
| Background            | `#111827`   |
| Cards                 | `#1F2937`   |
| Accent                | `#38BDF8`   |
| Warning               | `#F59E0B`   |
| Error                 | `#EF4444`   |

---

## Conventions techniques

### Python (intégrations)

- **Python 3.12+** avec async/await systématique
- Pattern obligatoire : `DataUpdateCoordinator` + `config_flow` + `translations/`
- Reconnexion backoff exponentiel (1s → 2s → 4s → max 60s)
- Logging verbeux : `_LOGGER = logging.getLogger(__name__)`
- HA minimum version : **2024.1**
- Tests : pytest + `pytest-homeassistant-custom-component`
- Linting : pylint + mypy + black

### JavaScript (cartes Lovelace)

- Web Components (`LitElement` ou `HTMLElement` natif)
- Méthodes obligatoires : `setConfig()`, `set hass()`, `getCardSize()`
- Éditeur visuel : `getConfigElement()` – style Naive Flex
- CSS : variables HA (`--primary-color`, `--card-background-color`, etc.)
- Responsive mobile-first, transitions < 300ms

### YAML (dashboards, automations)

- `snake_case` pour tous les identifiants
- `mode: single|parallel|queued` explicite sur toutes les automations
- Blueprints : chaque `input` avec `name`, `description`, `selector`
- Secrets dans `secrets.yaml`, jamais en dur

### ESPHome

- Stabilité long terme (pas de features expérimentales en prod)
- `accuracy_decimals: 4` pour les valeurs à haute précision
- OTA activé par défaut + capteurs diagnostics (uptime, WiFi signal)
- Credentials dans `esphome/secrets.yaml` (exclu du git)

---

## Workflow de développement

### Scripts disponibles

| Script                            | Action                                   |
|-----------------------------------|-------------------------------------------|
| `scripts/check_yaml.ps1`          | Valide tous les fichiers YAML             |
| `scripts/test_integration.ps1`    | Lance les tests pytest                    |
| `scripts/build_card.ps1`          | Build le JS d'une carte                   |
| `scripts/publish_current_js.ps1`  | Publie le JS courant vers HA              |
| `scripts/publish_current_integration.ps1` | Publie l'intégration courante     |
| `scripts/release_hacs.ps1`        | Release HACS complète (versions, changelog, tag, release GitHub) |
| `scripts/publish_all_drivers.ps1` | Publication globale de toutes les cartes/intégrations |
| `scripts/auto_commit.ps1`         | Commit + push Git                         |
| `scripts/generate_workspace_catalog.ps1` | Régénère `README_WORKSPACE_CATALOG.md` |

### Tâches VS Code (Ctrl+Shift+P → Tasks: Run Task)

- **HA: Pipeline complet** : lint + YAML check + tests
- **HA: Build custom card** : build JS minifié
- **HA: Commit & Push** : commit Git avec message
- **HA: Release HACS détaillée (fichier courant)** : release HACS complète sur le fichier actif

---

## Sécurité

- Ne jamais logguer de credentials ou tokens
- Valider et sanitiser tous les inputs dans `config_flow`
- Utiliser `homeassistant.helpers.config_validation`
- Pas de requêtes HTTP non-TLS
- Secrets dans `secrets.yaml` / `esphome/secrets.yaml`
