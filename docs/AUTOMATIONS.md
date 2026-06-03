# Automations – HomeAssistant-AI

> Documentation des automations et conventions pour ce workspace.

---

## Organisation

Les automations sont stockées dans `automations/` et peuvent être organisées par domaine :

```
automations/
├── lighting/        → Éclairage automatique
├── climate/         → Chauffage, climatisation
├── security/        → Alarme, présence, caméras
├── media/           → Déclenchement/arrêt des médias
├── presence/        → Arrivée/départ des personnes
├── notifications/   → Alertes et notifications
└── maintenance/     → Maintenance, monitoring système
```

---

## Conventions obligatoires

Chaque automation YAML doit respecter ces règles :

```yaml
automation:
  - id: unique_snake_case_id           # ID unique, jamais modifier après création
    alias: "Domaine – Description courte"  # Format: "Domaine – Action"
    description: "Description détaillée de ce que fait l'automation"
    mode: single                        # single | parallel | queued | restart
    max: 10                             # Pour mode queued/parallel uniquement

    trigger: []      # Au moins un trigger
    condition: []    # Optionnel, toujours explicite
    action: []       # Actions séquentielles
```

### Mode recommandé par type

| Type d'automation         | Mode recommandé |
|---------------------------|-----------------|
| Réponse à événement       | `single`        |
| Notification              | `single`        |
| Éclairage                 | `restart`       |
| Alarme                    | `queued`        |
| Présence (multi-personnes)| `parallel`      |

---

## Patterns courants

### Automation déclenchée par état

```yaml
- id: lights_on_motion_salon
  alias: "Éclairage – Allumage sur mouvement salon"
  description: "Allume les lumières du salon lors de détection de mouvement"
  mode: restart
  trigger:
    - platform: state
      entity_id: binary_sensor.motion_salon
      to: "on"
  condition:
    - condition: sun
      after: sunset
      after_offset: "-00:30:00"
  action:
    - service: light.turn_on
      target:
        area_id: salon
      data:
        brightness_pct: 80
        transition: 1
```

### Automation avec notification

```yaml
- id: notify_door_open_away
  alias: "Sécurité – Porte ouverte en absence"
  description: "Alerte si la porte d'entrée s'ouvre en mode absent"
  mode: single
  trigger:
    - platform: state
      entity_id: binary_sensor.door_front
      to: "on"
  condition:
    - condition: state
      entity_id: alarm_control_panel.home
      state: armed_away
  action:
    - service: notify.mobile_app
      data:
        title: "⚠️ Alerte sécurité"
        message: "La porte d'entrée vient de s'ouvrir en mode absent"
        data:
          push:
            sound: default
            badge: 1
```

### Automation avec variables et templates

```yaml
- id: climate_away_mode
  alias: "Climatisation – Mode absent"
  description: "Réduit la consigne de température en mode absent"
  mode: single
  variables:
    away_temp: 17
    home_temp: 20
  trigger:
    - platform: state
      entity_id: person.cyrille
      to: not_home
  action:
    - service: climate.set_temperature
      target:
        entity_id: climate.salon
      data:
        temperature: "{{ away_temp }}"
```

---

## Blueprints

Les blueprints réutilisables sont dans `blueprints/`.

### Structure d'un blueprint

```yaml
blueprint:
  name: "Nom du blueprint"
  description: "Description détaillée"
  domain: automation
  source_url: "https://github.com/..."
  input:
    entity_id:
      name: "Entité"
      description: "L'entité à surveiller"
      selector:
        entity:
          domain: binary_sensor
    delay_minutes:
      name: "Délai (minutes)"
      description: "Délai avant action"
      default: 5
      selector:
        number:
          min: 1
          max: 60
          unit_of_measurement: min
```

---

## Debugging des automations

```yaml
# Activer les traces (dans configuration.yaml ou UI)
automation:
  - id: mon_automation
    trace:
      stored_traces: 10  # Conserver les 10 dernières exécutions
```

Consulter les traces dans : **Paramètres → Automations → [automation] → Traces**

---

## Packages YAML

Pour organiser les automations par domaine, utiliser les packages dans `packages/` :

```yaml
# packages/lighting/lighting.yaml
automation:
  - id: ...
  - id: ...
```

Puis dans `configuration.yaml` :

```yaml
homeassistant:
  packages: !include_dir_merge_named packages/
```
