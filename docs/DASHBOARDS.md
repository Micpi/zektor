# Dashboards Lovelace – HomeAssistant-AI

> Documentation des tableaux de bord et conventions pour ce workspace.

---

## Organisation

```
dashboards/
├── template-room-card.yaml   → Template de carte pièce réutilisable
├── vs-code-card.yaml         → Dashboard développement VS Code
├── main/                     → Dashboard principal (à créer)
├── rooms/                    → Dashboards par pièce
├── energy/                   → Suivi énergie
└── admin/                    → Administration et monitoring
```

---

## Design System

Référence : [`themes/design_system.md`](../themes/design_system.md)

| Variable CSS HA               | Valeur dans notre thème |
|-------------------------------|-------------------------|
| `--primary-color`             | `#00AEEF`               |
| `--card-background-color`     | `#1F2937`               |
| `--primary-background-color`  | `#111827`               |
| `--accent-color`              | `#38BDF8`               |

### Utilisation dans les cartes custom

```javascript
// Toujours utiliser les variables CSS HA
this.style.setProperty('background', 'var(--card-background-color)');
```

---

## Cartes personnalisées disponibles

| Carte                  | Type d'usage                            | Import YAML           |
|------------------------|-----------------------------------------|-----------------------|
| `naive-flex-card`      | Layout flexible configurable            | `type: custom:naive-flex-card` |
| `activity-select-card` | Sélection d'activité (scènes, modes)    | `type: custom:activity-select-card` |
| `alpha-area-card`      | Carte de pièce avec entités             | `type: custom:alpha-area-card` |
| `blaze-app-card`       | Contrôle Blaze PowerZone                | `type: custom:blaze-app-card` |
| `ha-dock-card`         | Barre d'accès rapide style iOS          | `type: custom:ha-dock-card` |
| `iOS-PopUp-card`       | Popups style iOS                        | `type: custom:iOS-popup-card` |
| `light-slider-card`    | Contrôle lumières avec slider           | `type: custom:light-slider-card` |
| `pure-thermostat-card` | Thermostat minimaliste                  | `type: custom:pure-thermostat-card` |
| `thermo-halo-card`     | Thermostat avec halo animé              | `type: custom:thermo-halo-card` |
| `ultimate-tabbed-card` | Carte à onglets multi-vues              | `type: custom:ultimate-tabbed-card` |

---

## Layouts recommandés

### Layout grille CSS (standard)

```yaml
type: grid
columns: 3
square: false
cards:
  - type: custom:naive-flex-card
    # ...
  - type: custom:alpha-area-card
    # ...
```

### Layout section masonry (HA 2024.1+)

```yaml
type: sections
sections:
  - type: grid
    title: "Salon"
    cards: []
  - type: grid
    title: "Cuisine"
    cards: []
```

---

## Templates et ressources

### Ressources YAML (dans configuration.yaml ou ressources HA)

```yaml
lovelace:
  resources:
    - url: /local/naive-flex-card.js
      type: module
    - url: /local/alpha-area-card.js
      type: module
    - url: /local/blaze-app-card.js
      type: module
    - url: /local/ha-dock-card.js
      type: module
    - url: /local/iOS-PopUp-card.js
      type: module
    - url: /local/light-slider-card.js
      type: module
    - url: /local/pure-thermostat-card.js
      type: module
    - url: /local/thermo-halo-card.js
      type: module
    - url: /local/ultimate-tabbed-card.js
      type: module
    - url: /local/activity-select-card.js
      type: module
```

### Templates réutilisables

Disponibles dans `templates/` :
- `templates/button_cards/` → Cartes bouton avec button-card
- `templates/room_templates/` → Layout de pièce
- `templates/graphs/` → Graphiques et statistiques
- `templates/media_controls/` → Contrôles médias
- `templates/popup_templates/` → Popups
- `templates/dashboard_sections/` → Sections de dashboard

---

## Publication des cartes

```powershell
# Publier une carte
pwsh scripts/publish_current_js.ps1 -CurrentFile "custom_cards/naive-flex-card/naive-flex-card.js"

# Publier toutes les cartes
pwsh scripts/publish_all_drivers.ps1
```

---

## Bonnes pratiques

1. **Variables CSS** : toujours utiliser les variables HA, jamais de couleurs en dur
2. **Mobile-first** : tester en vue mobile avant desktop
3. **Transitions** : animations CSS < 300ms pour la fluidité
4. **Éditeur visuel** : implémenter `getConfigElement()` sur toutes les cartes (style Naive Flex)
5. **Éviter la duplication** : utiliser les templates YAML (`!include`)
6. **Nommage** : `type: custom:<domain>-<type>-card` (ex: `blaze-app-card`)
