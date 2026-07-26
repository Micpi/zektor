# Home Assistant – Instructions GitHub Copilot

## Contexte du workspace

Ce workspace est dédié au développement Home Assistant :

- **Intégrations Python** (`integrations/`, 1 dossier = 1 repo Git = source de vérité HACS)
- **Cartes Lovelace** (custom cards en JavaScript/TypeScript)
- **Tableaux de bord** (YAML Lovelace)
- **Automations** (YAML)
- **Thèmes** (YAML)
- **Blueprints**

---

## Règles de génération de code

### Qualité générale

- Génère du code **production-ready**, sans placeholder ni TODO laissé en suspens
- Respecte les conventions HA officielles (https://developers.home-assistant.io/)
- Toujours valider le YAML avant de le livrer
- Toujours tester le Python avant de le livrer
- Les erreurs doivent être catchées et loggées, jamais silencieuses

### Architecture Python (intégrations)

- **Toujours** utiliser le `DataUpdateCoordinator` pour centraliser les appels API
- **Toujours** implémenter un `config_flow` avec traduction (`translations/`)
- Utiliser `async`/`await` systématiquement (pas de code synchrone bloquant)
- Structurer selon le pattern :
  ```
  __init__.py       → setup + forward to platforms
  manifest.json     → metadata (domain, version, requirements)
  config_flow.py    → UI config flow + options flow
  coordinator.py    → DataUpdateCoordinator
  api.py            → client HTTP/TCP asynchrone (aiohttp)
  const.py          → constantes (DOMAIN, PLATFORMS, defaults)
  sensor.py         → entités sensor
  switch.py         → entités switch
  button.py         → entités button
  translations/fr.json + en.json
  ```
- Gestion de reconnexion : implémenter un backoff exponentiel (1s → 2s → 4s → max 60s)
- Logging verbeux avec `_LOGGER = logging.getLogger(__name__)`
- Ne jamais stocker de credentials en clair dans les données persistées

### Cartes Lovelace (JavaScript/TypeScript)

- Hériter de `LitElement` ou `HTMLElement` (Web Components)
- Toujours implémenter `setConfig()`, `set hass()`, `getCardSize()`
- Implémenter l'éditeur visuel (`getConfigElement()`)
- Respecter le design system : `themes/design_system.md`
- CSS : variables CSS HA (`--primary-color`, `--card-background-color`, etc.)
- Responsive mobile-first
- Animer avec des transitions CSS subtiles (< 300ms)

#### Standard obligatoire pour les éditeurs visuels

- Le style de référence est **"Configuration de la carte Naive Flex"**.
- Toute nouvelle carte doit reprendre la même ergonomie visuelle :
  - sections en accordéons (`<details>/<summary>`)
  - bordures, paddings, rayons et contrastes identiques
  - champs (`input/select/textarea`) avec le même traitement visuel
  - libellés homogènes (`General`, `Actions`, `Styles`, `Defaults`)
- Éviter les interfaces à onglets custom si ce standard n'est pas explicitement demandé.
- Si une carte existante est modernisée, migrer son éditeur vers ce standard Naive Flex.

### YAML (dashboards, automations, blueprints)

- Utiliser `button-card` pour les cartes personnalisées
- Layouts en grille CSS (`type: grid`)
- Éviter la duplication : utiliser les templates YAML (`!include`)
- Automations : toujours ajouter `mode: single|parallel|queued` explicitement
- Blueprints : décrire chaque `input` avec `name`, `description`, `selector`

### Thèmes

- Dark mode par défaut
- Variables CSS cohérentes avec `themes/design_system.md`
- Toujours fournir une version light et dark

---

## Design System

Consulter **`themes/design_system.md`** avant toute génération de card ou dashboard.

Couleurs principales :

- Primary : `#00AEEF`
- Background : `#111827`
- Cards : `#1F2937`
- Accent : `#38BDF8`
- Warning : `#F59E0B`
- Error : `#EF4444`

---

## Gestion de la qualité

Après chaque génération :

1. Vérifier YAML avec `scripts/check_yaml.ps1`
2. Lancer les tests avec `scripts/test_integration.ps1`
3. Builder les cartes avec `scripts/build_card.ps1 -CardName <nom>`
4. Commiter avec `scripts/auto_commit.ps1 -Message "feat: ..."`

### Règle release HACS obligatoire

Règle détaillée : voir [`AGENTS.md`](../AGENTS.md) (source unique, lue par tous les agents IA du workspace) - ne pas la reformuler ici pour éviter que les deux versions divergent.

Résumé : après toute modification touchant `custom_cards/` ou `integrations/`, préparer une release HACS avant de considérer la tâche terminée (versions alignées, changelog à jour, build régénéré, tag/release GitHub via `scripts/release_hacs.ps1` ou la tâche VS Code `HA: Release HACS détaillée (fichier courant)`), sauf demande explicite contraire de l'utilisateur.

---

## Base de connaissances

Documenter les patterns réutilisables dans `knowledge/` :

- `websocket_patterns/` → gestion WebSocket HA
- `reconnect_patterns/` → stratégies de reconnexion
- `mqtt_patterns/` → intégrations MQTT
- `ha_api_notes/` → notes sur l'API HA REST et WS
- `dashboard_patterns/` → patterns Lovelace réutilisables
- `performance_notes/` → optimisations perf

Après chaque debug session, créer un fichier dans `knowledge/debug_sessions/` avec :

```
Issue: <description>
Cause: <cause racine>
Fix: <solution appliquée>
Validated: YES/NO
```

---

## Templates disponibles

- `templates/button_cards/` → cartes bouton réutilisables
- `templates/room_templates/` → layouts par pièce
- `templates/graphs/` → graphiques et statistiques
- `templates/media_controls/` → contrôles média
- `templates/popup_templates/` → popups
- `templates/dashboard_sections/` → sections de dashboard

---

## Sécurité (OWASP)

- Ne jamais logger des credentials ou tokens
- Valider et sanitiser tous les inputs utilisateur dans `config_flow`
- Utiliser `homeassistant.helpers.config_validation` pour valider les configs
- Pas de requêtes HTTP non-TLS vers des services externes
- Secrets dans `secrets.yaml`, jamais en dur dans le code

---

## Conventions de nommage

- **Python** : `snake_case` pour tout, classes en `PascalCase`
- **JS/TS** : `camelCase` pour variables/fonctions, `PascalCase` pour classes
- **YAML** : `snake_case` pour les identifiants
- **Fichiers** : `snake_case` (Python), `kebab-case` (JS/YAML)
- **Domaine HA** : toujours préfixer par le nom du device (ex: `denon_avr`)

---

## Commandes rapides (VS Code Tasks)

- `Ctrl+Shift+P` → `Tasks: Run Task` → choisir la tâche
- **Pipeline complet** : lint + YAML check + tests
- **Build card** : build du JS minifié
- **Commit & Push** : commit Git avec message
