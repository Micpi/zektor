# Contexte du projet – HomeAssistant-AI

> Document de référence pour les agents IA (GitHub Copilot, ChatGPT, etc.)  
> Lire ce fichier en premier pour comprendre l'ensemble de l'installation.

---

## Vue d'ensemble

Ce workspace est un **environnement de développement Home Assistant** complet, versionné avec Git et intégré à VS Code + GitHub Copilot. Il centralise :

- Des **intégrations Python** (custom_components)
- Des **cartes Lovelace personnalisées** (Web Components JS)
- Des **tableaux de bord YAML** Lovelace
- Des **automations et blueprints** YAML
- Des **configurations ESPHome** pour appareils DIY
- Des **packages HA** pour organiser la config par domaine
- Des **thèmes** visuels personnalisés
- Une **base de connaissances** de patterns réutilisables

---

## Structure du workspace

```
.github/                  → Instructions Copilot (copilot-instructions.md)
.vscode/                  → Config VS Code (settings, tâches, extensions)
automations/              → Automations YAML Home Assistant
blueprints/               → Blueprints HA réutilisables
custom_cards/             → Cartes Lovelace (JS Web Components)
  ├── activity-select-card/
  ├── area-card/
  ├── blaze-app-card/
  ├── ha-dock-card/
  ├── iOS-PopUp-card/
  ├── light-slider-card/
  ├── naive-flex-card/     ← carte de référence pour l'éditeur visuel
  ├── pure-thermostat-card/
  ├── thermo-halo-card/
  └── ultimate-tabbed-card/
custom_components/        → Intégrations HA (à déployer dans HA config)
  └── zektor/             ← Intégration Zektor AVR (complète)
dashboards/               → Tableaux de bord YAML Lovelace
docs/                     → Documentation technique (CE DOSSIER)
esphome/                  → Configurations ESPHome pour devices DIY
  ├── common/             ← Config de base partagée
  └── devices/            ← Configs par type de device
examples/                 → Exemples fonctionnels de référence
integrations/             → Sources des intégrations en développement
  ├── Blaze/              ← Intégration Blaze PowerZone (sub-repo git)
  └── zektor/             ← Stubs/traductions Zektor
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

---

## Projets actifs

### Intégrations Python

| Intégration       | Domaine           | Chemin                       | Status    |
|-------------------|-------------------|------------------------------|-----------|
| Zektor AVR        | `zektor`          | `custom_components/zektor/`  | ✅ Actif  |
| Blaze PowerZone   | `blaze_powerzone` | `integrations/Blaze/`        | 🔧 Dev    |

**Zektor AVR** : Intégration complète pour ampli-tuner Zektor (API TCP). Entités : sensor, switch, button, number, select. Config flow avec traduction FR/EN. DataUpdateCoordinator avec reconnexion backoff exponentiel.

**Blaze PowerZone** : Intégration pour système audio Blaze. Sub-repo git indépendant dans `integrations/Blaze/`. Custom component dans `integrations/Blaze/custom_components/blaze_powerzone/`.

### Cartes Lovelace personnalisées

| Carte                  | Fichier JS                      | Status   |
|------------------------|---------------------------------|----------|
| Activity Select Card   | `activity-select-card.js`       | ✅ Stable |
| Alpha Area Card        | `alpha-area-card.js`            | ✅ Stable |
| Blaze App Card         | `blaze-app-card.js`             | ✅ Stable |
| HA Dock Card           | `ha-dock-card.js`               | ✅ Stable |
| iOS PopUp Card         | `iOS-PopUp-card.js`             | ✅ Stable |
| Light Slider Card      | `light-slider-card.js`          | ✅ Stable |
| Naive Flex Card        | `naive-flex-card.js`            | ✅ Stable |
| Pure Thermostat Card   | `pure-thermostat-card.js`       | ✅ Stable |
| Thermo Halo Card       | `thermo-halo-card.js`           | ✅ Stable |
| Ultimate Tabbed Card   | `ultimate-tabbed-card.js`       | ✅ Stable |

> **Référence éditeur visuel** : `naive-flex-card` – Toutes les nouvelles cartes doivent reprendre son style d'éditeur (accordéons details/summary).

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

| Script                         | Action                                    |
|--------------------------------|-------------------------------------------|
| `scripts/check_yaml.ps1`       | Valide tous les fichiers YAML             |
| `scripts/test_integration.ps1` | Lance les tests pytest                    |
| `scripts/build_card.ps1`       | Build le JS d'une carte                   |
| `scripts/publish_current_js.ps1` | Publie le JS courant vers HA            |
| `scripts/auto_commit.ps1`      | Commit + push Git                         |

### Tâches VS Code (Ctrl+Shift+P → Tasks: Run Task)

- **HA: Pipeline complet** : lint + YAML check + tests
- **HA: Build custom card** : build JS minifié
- **HA: Commit & Push** : commit Git avec message

---

## Sécurité

- Ne jamais logguer de credentials ou tokens
- Valider et sanitiser tous les inputs dans `config_flow`
- Utiliser `homeassistant.helpers.config_validation`
- Pas de requêtes HTTP non-TLS
- Secrets dans `secrets.yaml` / `esphome/secrets.yaml`
