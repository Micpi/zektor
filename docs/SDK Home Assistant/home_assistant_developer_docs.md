# Home Assistant — Documentation Développeur Complète
> Référence exhaustive pour agent IA — Source : https://developers.home-assistant.io/
> Dernière mise à jour analysée : Mai 2026

---

## TABLE DES MATIÈRES

1. [Architecture Générale](#1-architecture-générale)
2. [Structure d'une Intégration](#2-structure-dune-intégration)
3. [Manifest d'Intégration](#3-manifest-dintégration)
4. [Config Flow (Configuration UI)](#4-config-flow)
5. [Config Entries](#5-config-entries)
6. [Data Entry Flow](#6-data-entry-flow)
7. [Entités (Entities)](#7-entités)
8. [Récupération de Données (DataUpdateCoordinator)](#8-dataupdate-coordinator)
9. [Plateformes d'Entités](#9-plateformes-dentités)
10. [Integration Quality Scale](#10-integration-quality-scale)
11. [Tests](#11-tests)
12. [API WebSocket](#12-api-websocket)
13. [API REST Supervisor](#13-api-rest-supervisor)
14. [Frontend — Custom Cards](#14-frontend--custom-cards)
15. [Frontend — Custom Strategies et Views](#15-frontend--custom-strategies-et-views)
16. [Apps / Add-ons](#16-apps--add-ons)
17. [Native App Integration](#17-native-app-integration)
18. [Android Development](#18-android-development)
19. [Bonnes Pratiques et Checklist](#19-bonnes-pratiques-et-checklist)
20. [Traductions (i18n)](#20-traductions-i18n)
21. [Authentification](#21-authentification)
22. [Environnement de Développement](#22-environnement-de-développement)

---

## 1. Architecture Générale

### Vue d'ensemble des couches

Home Assistant est un système embarqué complet, pas seulement une application. Il repose sur 3 couches principales :

```
┌─────────────────────────────────────────┐
│              Home Assistant Core        │  ← Interactions utilisateur, IoT, Supervisor
├─────────────────────────────────────────┤
│              Supervisor                 │  ← Gestion de l'OS
├─────────────────────────────────────────┤
│         Operating System (HAOS)         │  ← Linux minimal pour Supervisor + Core
└─────────────────────────────────────────┘
```

### Types d'intégrations

| Type | Description | Exemple |
|------|-------------|---------|
| **IoT domain** | Définit une catégorie d'appareils (light, switch…) | `light`, `sensor` |
| **Device/Service** | Interagit avec des appareils/services externes via un domaine IoT | Philips Hue → entités `light` |
| **Virtual/Helper** | Entités dérivées d'autres données internes | `template`, `input_boolean`, `utility_meter` |
| **Hub** | Gateway vers plusieurs appareils/services | SmartThings, Zigbee2MQTT |
| **Virtual (standard IoT)** | Intégration utilisant un standard IoT existant | U-tec ultraloq → Z-Wave |

**Règle fondamentale** : Les intégrations Device/Service **ne doivent jamais** consommer l'état d'entités d'autres intégrations, à l'exception des entités de localisation (`zone`, `device_tracker`).

### Architecture Core

- **Event Bus** : Bus d'événements central ; tout passe par des événements.
- **State Machine** : Stocke l'état de toutes les entités.
- **Service Registry** : Registre de toutes les actions/services.
- **Component Loader** : Charge les intégrations dynamiquement.
- **Entity Registry / Device Registry** : Registres persistants des entités et appareils.

---

## 2. Structure d'une Intégration

### Structure de fichiers recommandée

```
homeassistant/components/<domain>/
├── __init__.py          # Point d'entrée principal (async_setup, async_setup_entry)
├── manifest.json        # Métadonnées de l'intégration (OBLIGATOIRE)
├── config_flow.py       # Config flow UI (OBLIGATOIRE pour Bronze+)
├── coordinator.py       # DataUpdateCoordinator (si polling coordiné)
├── entity.py            # Classe de base entité partagée (optionnel)
├── sensor.py            # Plateforme sensor
├── switch.py            # Plateforme switch
├── light.py             # Plateforme light
├── ...                  # Autres plateformes
├── services.yaml        # Définition des services personnalisés
├── strings.json         # Chaînes de traduction (clés UI)
└── translations/
    ├── en.json
    └── fr.json
```

**Règle** : Pour les intégrations custom, les fichiers sont dans `<config_dir>/custom_components/<domain>/`. Elles **doivent** avoir une clé `version` dans le manifest. Les intégrations core n'en ont pas besoin.

### `__init__.py` — Structure minimale

```python
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant

DOMAIN = "my_integration"

# Type alias pour ConfigEntry typé (recommandé)
type MyConfigEntry = ConfigEntry[MyCoordinator]

PLATFORMS: list[str] = ["sensor", "switch"]

async def async_setup_entry(hass: HomeAssistant, entry: MyConfigEntry) -> bool:
    """Set up My Integration from a config entry."""
    coordinator = MyCoordinator(hass, entry)
    await coordinator.async_config_entry_first_refresh()
    entry.runtime_data = coordinator
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True

async def async_unload_entry(hass: HomeAssistant, entry: MyConfigEntry) -> bool:
    """Unload a config entry."""
    return await hass.config_entries.async_unload_platforms(entry, PLATFORMS)
```

**Note importante** : Utilisez `entry.runtime_data` (depuis HA 2024.x) plutôt que `hass.data[DOMAIN]` pour stocker les données runtime d'une config entry.

---

## 3. Manifest d'Intégration

### Fichier `manifest.json` complet

```json
{
  "domain": "my_integration",
  "name": "My Integration",
  "codeowners": ["@github_username"],
  "config_flow": true,
  "dependencies": ["other_integration"],
  "documentation": "https://www.home-assistant.io/integrations/my_integration",
  "integration_type": "device",
  "iot_class": "local_polling",
  "issue_tracker": "https://github.com/user/repo/issues",
  "quality_scale": "bronze",
  "requirements": ["my-python-library==1.2.3"],
  "single_config_entry": false,
  "version": "1.0.0"
}
```

### Champs expliqués

| Champ | Obligatoire | Description |
|-------|-------------|-------------|
| `domain` | ✅ | Identifiant unique (snake_case). Doit correspondre au nom du répertoire. |
| `name` | ✅ | Nom lisible. Règles de nommage strictes (voir ci-dessous). |
| `codeowners` | ✅ | GitHub usernames/teams responsables |
| `config_flow` | ✅ si UI | `true` si l'intégration supporte la configuration UI |
| `documentation` | ✅ | URL de la documentation utilisateur |
| `integration_type` | ✅ | `device`, `service`, `hub`, `virtual`, `system`, `helper`, `entity` |
| `iot_class` | ✅ | Classificateur du comportement IoT |
| `requirements` | ✅ si libs | Dépendances pip (`["lib==version"]`) |
| `dependencies` | ⬜ | Autres intégrations HA à charger avant |
| `single_config_entry` | ⬜ | `true` pour interdire plusieurs entrées |
| `quality_scale` | ⬜ | `bronze`, `silver`, `gold`, `platinum` |
| `version` | ✅ custom | Obligatoire pour custom integrations |

### Règles de nommage (`name`)

- Local + Cloud : Cloud → suffixe " Cloud" (ex: "LIFX Cloud") ; Local → nom sans suffixe (ex: "LIFX", **pas** "LIFX Local")
- Cloud pur → nom tel quel, sans suffixe (ex: "iCloud", pas "iCloud Cloud")

### Valeurs `iot_class`

| Valeur | Description |
|--------|-------------|
| `local_polling` | Interrogation locale périodique |
| `local_push` | Push local (abonnement événements) |
| `cloud_polling` | Interrogation cloud périodique |
| `cloud_push` | Push cloud (webhooks, SSE…) |
| `assumed_state` | État supposé (pas de feedback réel) |
| `calculated` | Calculé à partir d'autres données |

### Types d'intégration `integration_type`

| Valeur | Cas d'usage |
|--------|-------------|
| `hub` | Gateway vers plusieurs services/appareils |
| `device` | Un seul appareil par config entry |
| `service` | Un seul service par config entry |
| `virtual` | Intégration virtuelle (supported_by ou iot_standard) |
| `helper` | Helper (template, input_*…) |
| `system` | Système interne |
| `entity` | Définit un type d'entité IoT standard (light, sensor…) |

### `supported_by` (Virtual Integration)

```json
{
  "domain": "yale_home",
  "name": "Yale Home",
  "integration_type": "virtual",
  "supported_by": "august"
}
```
→ Yale Home apparaît dans la liste d'ajout, redirige vers August.

---

## 4. Config Flow

### Principe

Le Config Flow est le système standard (depuis 2018) pour configurer les intégrations via l'UI. Il remplace la configuration dans `configuration.yaml`.

**Fichier** : `config_flow.py`

### Structure minimale

```python
from __future__ import annotations
from typing import Any
import voluptuous as vol
from homeassistant.config_entries import ConfigFlow, ConfigFlowResult
from homeassistant.const import CONF_HOST, CONF_PASSWORD
from .const import DOMAIN

class MyConfigFlow(ConfigFlow, domain=DOMAIN):
    """Handle a config flow for My Integration."""

    VERSION = 1

    async def async_step_user(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle the initial step."""
        errors: dict[str, str] = {}
        
        if user_input is not None:
            # Validation de la connexion
            try:
                await validate_connection(user_input[CONF_HOST])
            except CannotConnect:
                errors["base"] = "cannot_connect"
            except InvalidAuth:
                errors["base"] = "invalid_auth"
            else:
                # Définir un unique_id stable
                await self.async_set_unique_id(user_input[CONF_HOST])
                self._abort_if_unique_id_configured()
                return self.async_create_entry(
                    title=user_input[CONF_HOST],
                    data=user_input,
                )
        
        return self.async_show_form(
            step_id="user",
            data_schema=vol.Schema({
                vol.Required(CONF_HOST): str,
                vol.Required(CONF_PASSWORD): str,
            }),
            errors=errors,
        )
```

### Méthodes importantes

| Méthode | Description |
|---------|-------------|
| `async_set_unique_id(uid)` | Associe un ID unique au flow |
| `_abort_if_unique_id_configured()` | Annule si déjà configuré (même unique_id) |
| `async_create_entry(title, data)` | Crée la config entry |
| `async_show_form(step_id, data_schema, errors)` | Affiche un formulaire |
| `async_abort(reason)` | Annule le flow avec un message |
| `async_update_reload_and_abort(entry, data)` | Met à jour entry + reload + abort |

### Unique ID

- Doit être **stable** (ne change jamais)
- Doit être une **chaîne de caractères**
- Unique au sein du domaine (deux intégrations différentes peuvent avoir le même)
- Exemples valides : adresse MAC, serial number, UUID du device
- **Ne jamais** utiliser l'adresse IP seule (elle peut changer)

### Ré-authentification (Reauth Flow)

Déclenché automatiquement quand les credentials expirent/sont révoqués.

```python
async def async_step_reauth(
    self, entry_data: Mapping[str, Any]
) -> ConfigFlowResult:
    """Handle reauth."""
    return await self.async_step_reauth_confirm()

async def async_step_reauth_confirm(
    self, user_input: dict[str, Any] | None = None
) -> ConfigFlowResult:
    """Handle reauth confirmation."""
    if user_input is not None:
        # Valider les nouveaux credentials
        reauth_entry = self._get_reauth_entry()
        return self.async_update_reload_and_abort(
            reauth_entry,
            data_updates={CONF_PASSWORD: user_input[CONF_PASSWORD]},
        )
    return self.async_show_form(step_id="reauth_confirm", ...)
```

Détecter si on est en reauth : `if self.source == SOURCE_REAUTH`

### Reconfigure Flow

Permet à l'utilisateur de modifier la configuration après setup (ex: changer l'host).

```python
async def async_step_reconfigure(
    self, user_input: dict[str, Any] | None = None
) -> ConfigFlowResult:
    """Handle reconfiguration."""
    if user_input is not None:
        reconfigure_entry = self._get_reconfigure_entry()
        # Vérifier que le unique_id n'a pas changé
        await self.async_set_unique_id(user_input[CONF_HOST])
        self._abort_if_unique_id_mismatch()
        return self.async_update_reload_and_abort(
            reconfigure_entry,
            data_updates=user_input,
        )
    return self.async_show_form(step_id="reconfigure", ...)
```

Détecter si on est en reconfigure : `if self.source == SOURCE_RECONFIGURE`

**Distinction reauth vs reconfigure** :
- **Reauth** : déclenché automatiquement pour gérer les tokens/passwords invalides
- **Reconfigure** : déclenché par l'utilisateur pour changer des paramètres non optionnels (host, port…)

### Options Flow

Gère les paramètres optionnels (scan_interval, features…).

```python
from homeassistant.config_entries import OptionsFlowWithReload

class MyOptionsFlow(OptionsFlowWithReload):
    """Handle options flow."""

    async def async_step_init(
        self, user_input: dict[str, Any] | None = None
    ) -> ConfigFlowResult:
        """Handle options."""
        if user_input is not None:
            return self.async_create_entry(data=user_input)
        return self.async_show_form(
            step_id="init",
            data_schema=vol.Schema({
                vol.Optional(CONF_SCAN_INTERVAL, default=30): int,
            }),
        )
```

Lier l'options flow au config flow :
```python
class MyConfigFlow(ConfigFlow, domain=DOMAIN):
    @staticmethod
    @callback
    def async_get_options_flow(config_entry: ConfigEntry) -> MyOptionsFlow:
        return MyOptionsFlow()
```

**`OptionsFlowWithReload`** : recharge automatiquement l'intégration quand les options changent. Évite d'avoir à gérer un `update_listener` manuellement.

### Stockage des données

- `ConfigEntry.data` → données **nécessaires à la connexion** (host, credentials)
- `ConfigEntry.options` → paramètres **optionnels** (scan_interval, features activées)
- **Ne jamais** muter directement un `ConfigEntry` ; utiliser `async_update_entry()`

### Step externe (OAuth2)

```python
async def async_step_user(self, user_input=None):
    if user_input is None:
        url = self._get_authorize_url()
        return self.async_external_step(
            step_id="auth",
            url=url,
        )
    return self.async_external_step_done(next_step_id="creation")

async def async_step_creation(self, user_input=None):
    # Utiliser les données récupérées via le callback OAuth
    return self.async_create_entry(...)
```

### Discovery (Zeroconf, SSDP, DHCP, mDNS)

Les intégrations peuvent être découvertes automatiquement. Le flow est initié par HA, pas l'utilisateur.

```python
async def async_step_zeroconf(
    self, discovery_info: ZeroconfServiceInfo
) -> ConfigFlowResult:
    """Handle zeroconf discovery."""
    await self.async_set_unique_id(discovery_info.hostname)
    self._abort_if_unique_id_configured(updates={CONF_HOST: discovery_info.host})
    self.context["title_placeholders"] = {"name": discovery_info.name}
    return await self.async_step_user()
```

---

## 5. Config Entries

### Cycle de vie

```
async_setup_entry()  →  [intégration active]  →  async_unload_entry()
                              ↓ (si version change)
                        async_migrate_entry()
                              ↓ (si suppression)
                        async_remove_entry()
```

### Patterns importants

**Stocker les données runtime :**
```python
# ✅ Moderne (recommandé)
entry.runtime_data = coordinator

# ❌ Ancien (à éviter pour les nouvelles intégrations)
hass.data.setdefault(DOMAIN, {})[entry.entry_id] = coordinator
```

**Nettoyer des ressources à la suppression :**
```python
async def async_remove_entry(hass: HomeAssistant, entry: ConfigEntry) -> None:
    """Handle removal of an entry."""
    await entry.runtime_data.async_cleanup()
```
Note : la config entry est **déjà supprimée** de `hass.config_entries` quand cette fonction est appelée.

**Migration de version :**
```python
async def async_migrate_entry(hass: HomeAssistant, config_entry: ConfigEntry) -> bool:
    """Migrate old entry."""
    if config_entry.version == 1:
        new_data = {**config_entry.data}
        new_data[CONF_NEW_FIELD] = "default_value"
        hass.config_entries.async_update_entry(
            config_entry, data=new_data, version=2
        )
    return True
```

### Subentries

Pour une config entry principale avec plusieurs sous-configurations (ex: une intégration météo avec plusieurs localisations) :

```python
# Définir un subentry flow dans la config entry
class MyConfigFlow(ConfigFlow, domain=DOMAIN):
    @classmethod
    def async_get_supported_subentry_types(cls) -> dict[str, type[ConfigSubentryFlow]]:
        return {"location": LocationSubentryFlow}
```

---

## 6. Data Entry Flow

### Retours possibles d'un step

| Type de retour | Méthode | Description |
|----------------|---------|-------------|
| Formulaire | `async_show_form()` | Affiche un formulaire à remplir |
| Création entry | `async_create_entry()` | Crée la config entry et termine |
| Abandon | `async_abort(reason)` | Annule avec message |
| Step externe | `async_external_step()` | Redirige vers URL externe |
| Progress | `async_show_progress()` | Affiche progression tâche longue |

### Schémas et validations avec Voluptuous

```python
import voluptuous as vol
from homeassistant.helpers import selector

data_schema = vol.Schema({
    vol.Required(CONF_HOST): str,
    vol.Optional(CONF_PORT, default=8080): vol.All(int, vol.Range(min=1, max=65535)),
    vol.Required(CONF_USERNAME): selector.selector({"text": {}}),
    vol.Required(CONF_PASSWORD): selector.selector({"text": {"type": "password"}}),
})
```

### Sélecteurs recommandés (Selectors)

```python
from homeassistant.helpers import selector

# Texte simple
selector.selector({"text": {}})
# Mot de passe
selector.selector({"text": {"type": "password"}})
# Nombre
selector.selector({"number": {"min": 1, "max": 100, "step": 1}})
# Booléen
selector.selector({"boolean": {}})
# Entité
selector.selector({"entity": {"domain": "sensor"}})
# Appareil
selector.selector({"device": {}})
# Durée
selector.selector({"duration": {}})
```

### Gestion des erreurs dans les formulaires

```python
errors: dict[str, str] = {}
if user_input is not None:
    try:
        await validate_input(hass, user_input)
    except CannotConnect:
        errors["base"] = "cannot_connect"   # erreur globale
    except InvalidAuth:
        errors["base"] = "invalid_auth"
    except Exception:
        errors["base"] = "unknown"
    else:
        return self.async_create_entry(...)

return self.async_show_form(
    step_id="user",
    data_schema=data_schema,
    errors=errors,  # affiché dans le formulaire
)
```

Les clés d'erreur (`"cannot_connect"`, `"invalid_auth"`) doivent être définies dans `strings.json` → `config.error`.

### Tâches longues dans un flow

```python
async def async_step_user(self, user_input=None):
    if not hasattr(self, "_task"):
        self._task = self.hass.async_create_task(self._long_operation())
    
    if not self._task.done():
        return self.async_show_progress(
            step_id="user",
            progress_action="progress_message_key",
            progress_task=self._task,
        )
    
    return self.async_show_progress_done(next_step_id="finish")
```

---

## 7. Entités

### Classe de base `Entity`

```python
from homeassistant.helpers.entity import Entity

class MyEntity(Entity):
    """Représente une entité."""

    # ─── Identité ─────────────────────────────────────────────
    _attr_unique_id = "my_unique_id"      # Obligatoire pour registry
    _attr_name = "My Entity"              # Nom affiché
    _attr_has_entity_name = True          # Utilise le nom du device
    
    # ─── Device Info ──────────────────────────────────────────
    @property
    def device_info(self) -> DeviceInfo:
        return DeviceInfo(
            identifiers={(DOMAIN, self._device_id)},
            name="My Device",
            manufacturer="Acme Corp",
            model="Widget Pro",
            sw_version="1.2.3",
        )
    
    # ─── État ─────────────────────────────────────────────────
    _attr_available = True               # False si l'appareil est injoignable
    
    # ─── Attributs supplémentaires ────────────────────────────
    @property
    def extra_state_attributes(self) -> dict:
        return {"custom_key": self._custom_value}
```

### Les 3 façons de définir les propriétés

**1. Attributs de classe (recommandé pour les valeurs statiques) :**
```python
class MySensor(SensorEntity):
    _attr_native_unit_of_measurement = UnitOfTemperature.CELSIUS
    _attr_device_class = SensorDeviceClass.TEMPERATURE
    _attr_state_class = SensorStateClass.MEASUREMENT
```

**2. Propriétés Python (pour logique dynamique) :**
```python
@property
def native_value(self) -> float | None:
    return self.coordinator.data[self._sensor_key]["temperature"]
```

**3. Entity Description (recommandé pour définir plusieurs types d'entités) :**
```python
from homeassistant.components.sensor import SensorEntityDescription

SENSORS: tuple[SensorEntityDescription, ...] = (
    SensorEntityDescription(
        key="temperature",
        translation_key="temperature",
        native_unit_of_measurement=UnitOfTemperature.CELSIUS,
        device_class=SensorDeviceClass.TEMPERATURE,
        state_class=SensorStateClass.MEASUREMENT,
    ),
    SensorEntityDescription(
        key="humidity",
        translation_key="humidity",
        native_unit_of_measurement=PERCENTAGE,
        device_class=SensorDeviceClass.HUMIDITY,
    ),
)

class MySensor(CoordinatorEntity[MyCoordinator], SensorEntity):
    entity_description: SensorEntityDescription

    def __init__(self, coordinator, description):
        super().__init__(coordinator)
        self.entity_description = description
        self._attr_unique_id = f"{coordinator.device_id}_{description.key}"
```

### Lifecycle hooks

```python
async def async_added_to_hass(self) -> None:
    """Called when entity is added to HA."""
    # Abonnement aux mises à jour push
    self.async_on_remove(
        async_dispatcher_connect(
            self.hass,
            SIGNAL_NEW_DATA,
            self._handle_update,
        )
    )

async def async_will_remove_from_hass(self) -> None:
    """Called before entity is removed."""
    # Nettoyage des ressources
```

### Gestion de la disponibilité

```python
class MyEntity(CoordinatorEntity):
    @property
    def available(self) -> bool:
        """Return if entity is available."""
        # Toujours inclure super().available pour CoordinatorEntity
        return super().available and self._device_id in self.coordinator.data
```

**Règle** : Marquer `available = False` si l'appareil/service est injoignable, plutôt que de logger une erreur à chaque update.

### Nommage des entités

```python
# Entité principale d'un device (même nom que le device)
class MyMainEntity(Entity):
    _attr_has_entity_name = True
    _attr_name = None  # None = utilise le nom du device

# Entité secondaire
class MySecondaryEntity(Entity):
    _attr_has_entity_name = True
    _attr_translation_key = "signal_strength"  # clé dans strings.json
```

### Types d'entités courants

| Plateforme | Classe de base | Propriétés clés |
|-----------|----------------|-----------------|
| `sensor` | `SensorEntity` | `native_value`, `native_unit_of_measurement`, `device_class`, `state_class` |
| `binary_sensor` | `BinarySensorEntity` | `is_on`, `device_class` |
| `switch` | `SwitchEntity` | `is_on`, `async_turn_on()`, `async_turn_off()` |
| `light` | `LightEntity` | `is_on`, `brightness`, `color_temp`, `rgb_color` |
| `climate` | `ClimateEntity` | `hvac_mode`, `current_temperature`, `target_temperature` |
| `cover` | `CoverEntity` | `is_closed`, `current_cover_position`, `async_open_cover()` |
| `media_player` | `MediaPlayerEntity` | `state`, `volume_level`, `media_title` |
| `button` | `ButtonEntity` | `async_press()` |
| `number` | `NumberEntity` | `native_value`, `native_min_value`, `native_max_value` |
| `select` | `SelectEntity` | `current_option`, `options`, `async_select_option()` |
| `text` | `TextEntity` | `native_value`, `async_set_value()` |
| `image` | `ImageEntity` | `image_url()` |
| `camera` | `Camera` | `async_camera_image()` |
| `event` | `EventEntity` | `event_types`, triggered via `_trigger_event()` |
| `lock` | `LockEntity` | `is_locked`, `async_lock()`, `async_unlock()` |
| `vacuum` | `StateVacuumEntity` | `state`, `battery_level` |
| `fan` | `FanEntity` | `is_on`, `percentage`, `speed_count` |
| `alarm_control_panel` | `AlarmControlPanelEntity` | `state`, `async_alarm_arm_home()` |
| `update` | `UpdateEntity` | `installed_version`, `latest_version`, `async_install()` |
| `todo` | `TodoListEntity` | `todo_items`, `async_create_todo_item()` |
| `siren` | `SirenEntity` | `is_on`, `async_turn_on()` |
| `remote` | `RemoteEntity` | `is_on`, `async_send_command()` |

---

## 8. DataUpdate Coordinator

### Concept

Le `DataUpdateCoordinator` centralise le polling de données pour éviter des requêtes redondantes quand plusieurs entités partagent la même source de données.

### Implémentation standard

```python
# coordinator.py
from datetime import timedelta
import logging
from homeassistant.core import HomeAssistant
from homeassistant.helpers.update_coordinator import DataUpdateCoordinator, UpdateFailed
from .api import MyApiClient, MyApiError

_LOGGER = logging.getLogger(__name__)

class MyCoordinator(DataUpdateCoordinator[dict[str, Any]]):
    """Class to manage fetching data from the API."""

    def __init__(self, hass: HomeAssistant, client: MyApiClient) -> None:
        """Initialize coordinator."""
        super().__init__(
            hass,
            _LOGGER,
            name=DOMAIN,
            update_interval=timedelta(minutes=5),
        )
        self.client = client

    async def _async_update_data(self) -> dict[str, Any]:
        """Fetch data from API endpoint."""
        try:
            return await self.client.get_all_data()
        except AuthError as err:
            raise ConfigEntryAuthFailed from err
        except MyApiError as err:
            raise UpdateFailed(f"Error communicating with API: {err}") from err
```

### Entité avec CoordinatorEntity

```python
from homeassistant.helpers.update_coordinator import CoordinatorEntity

class MySensor(CoordinatorEntity[MyCoordinator], SensorEntity):
    """An entity using CoordinatorEntity."""

    def __init__(self, coordinator: MyCoordinator, device_id: str) -> None:
        super().__init__(coordinator)
        self._device_id = device_id
        self._attr_unique_id = f"{coordinator.config_entry.entry_id}_{device_id}"

    @property
    def native_value(self) -> float | None:
        """Return the sensor value."""
        return self.coordinator.data.get(self._device_id, {}).get("temperature")
```

### Push API avec coordinator

```python
# Si l'API est push, ne pas passer update_interval ni update_method
coordinator = DataUpdateCoordinator(hass, _LOGGER, name=DOMAIN)

# Quand de nouvelles données arrivent via push :
coordinator.async_set_updated_data(new_data)
```

### Appareils dynamiques (ajout post-setup)

```python
async def async_setup_entry(hass, entry, async_add_entities):
    coordinator = entry.runtime_data
    known_devices: set[str] = set()

    def _check_device() -> None:
        current_devices = set(coordinator.data)
        new_devices = current_devices - known_devices
        if new_devices:
            known_devices.update(new_devices)
            async_add_entities([MySensor(coordinator, did) for did in new_devices])

    _check_device()
    entry.async_on_unload(coordinator.async_add_listener(_check_device))
```

### Exceptions à lever dans `_async_update_data`

| Exception | Effet |
|-----------|-------|
| `UpdateFailed` | Entités marquées indisponibles, log d'erreur |
| `ConfigEntryAuthFailed` | Déclenche le reauth flow automatiquement |
| `ConfigEntryNotReady` | HA retente le setup plus tard (backoff exponentiel) |

---

## 9. Plateformes d'Entités

### Déclaration dans `__init__.py`

```python
PLATFORMS = ["sensor", "switch", "light"]

async def async_setup_entry(hass, entry):
    # ...
    await hass.config_entries.async_forward_entry_setups(entry, PLATFORMS)
    return True
```

### Fichier de plateforme (ex: `sensor.py`)

```python
from homeassistant.components.sensor import SensorEntity
from homeassistant.config_entries import ConfigEntry
from homeassistant.core import HomeAssistant
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback

async def async_setup_entry(
    hass: HomeAssistant,
    entry: MyConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    """Set up sensors from a config entry."""
    coordinator = entry.runtime_data
    async_add_entities(
        MySensor(coordinator, description)
        for description in SENSOR_DESCRIPTIONS
    )
```

### Services d'entité personnalisés

```python
# Dans async_setup (pas async_setup_entry !)
from homeassistant.helpers import service

async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    service.async_register_platform_entity_service(
        hass,
        DOMAIN,
        "my_service",
        {vol.Required("param"): str},
        "async_my_service",   # méthode de l'entité à appeler
    )
    return True
```

**Depuis HA 2025.9** : utiliser `service.async_register_platform_entity_service` dans `async_setup` plutôt que `platform.async_register_entity_service` durant le setup de la plateforme.

---

## 10. Integration Quality Scale

### Les 4 niveaux

```
Bronze → Silver → Gold → Platinum
```

#### 🥉 Bronze (baseline — obligatoire pour toute nouvelle intégration)

| Règle | Description |
|-------|-------------|
| `action-setup` | Services enregistrés dans `async_setup` |
| `appropriate-polling` | Intervalle de polling raisonnable (min 5s) |
| `brands` | Assets de marque disponibles (logo, icon) |
| `common-modules` | Patterns communs dans des modules partagés |
| `config-flow` | Setup via UI obligatoire |
| `config-flow-test-coverage` | 100% de couverture de test du config flow |
| `dependency-transparency` | Dépendances déclarées dans le manifest |
| `docs-actions` | Documentation des services disponibles |
| `docs-high-level-description` | Description de haut niveau de l'intégration |
| `docs-installation-instructions` | Instructions d'installation step-by-step |
| `docs-removal-instructions` | Instructions de suppression |
| `entity-event-setup` | Abonnements aux événements dans `async_added_to_hass` |
| `entity-unique-id` | Chaque entité a un unique_id |
| `has-entity-name` | `_attr_has_entity_name = True` |
| `test-before-configure` | Test de connexion dans le config flow |
| `unique-config-entry` | Empêche le double ajout du même device/service |

#### 🥈 Silver (robustesse)

| Règle | Description |
|-------|-------------|
| `action-exceptions` | Services lèvent des exceptions en cas d'échec |
| `config-entry-unloading` | Support du déchargement de config entry |
| `docs-configuration-parameters` | Docs de tous les paramètres de configuration |
| `entity-unavailable` | `available = False` si device injoignable |
| `integration-owner` | Codeowner identifié |
| `log-when-unavailable` | Log une seule fois indisponible, une fois retour |
| `parallel-updates` | Nombre de mises à jour parallèles spécifié |
| `reauthentication-flow` | Reauth disponible via UI |
| `test-coverage` | > 95% de couverture de test |

#### 🥇 Gold (qualité avancée)

| Règle | Description |
|-------|-------------|
| `devices` | L'intégration crée des appareils (device registry) |
| `diagnostics` | Implémente les diagnostics |
| `discovery-update-info` | Mise à jour des infos via discovery |
| `dynamic-devices` | Nouveaux appareils ajoutés automatiquement |
| `entity-descriptions` | Utilise `EntityDescription` |
| `reconfiguration-flow` | Reconfigure flow disponible |
| `stale-devices` | Appareils stales supprimés automatiquement |

#### 🏆 Platinum (excellence)

| Règle | Description |
|-------|-------------|
| `async-dependency` | Dépendance Python est async |
| `inject-websession` | La lib Python accepte une websession injectée |
| `strict-typing` | Typage strict (mypy strict mode) |

---

## 11. Tests

### Structure des tests

```
tests/components/<domain>/
├── conftest.py          # Fixtures partagées
├── test_config_flow.py  # Tests du config flow (100% coverage requis)
├── test_init.py         # Tests de async_setup_entry / async_unload_entry
├── test_sensor.py       # Tests de la plateforme sensor
└── ...
```

### Fixtures essentielles

```python
# conftest.py
import pytest
from unittest.mock import AsyncMock, patch
from homeassistant.core import HomeAssistant
from tests.common import MockConfigEntry

@pytest.fixture
def mock_config_entry() -> MockConfigEntry:
    return MockConfigEntry(
        domain=DOMAIN,
        data={CONF_HOST: "192.168.1.100"},
        unique_id="test_unique_id",
    )

@pytest.fixture
def mock_my_client() -> AsyncMock:
    with patch("homeassistant.components.my_integration.MyApiClient") as mock:
        client = mock.return_value
        client.get_data.return_value = {"temperature": 20.5}
        yield client
```

### Test du Config Flow (exemple complet)

```python
# test_config_flow.py
import pytest
from homeassistant.config_entries import SOURCE_USER
from homeassistant.data_entry_flow import FlowResultType
from homeassistant.core import HomeAssistant

async def test_full_flow(
    hass: HomeAssistant,
    mock_my_client: AsyncMock,
    mock_setup_entry: AsyncMock,
) -> None:
    """Test complete happy flow."""
    result = await hass.config_entries.flow.async_init(
        DOMAIN,
        context={"source": SOURCE_USER},
    )
    assert result["type"] is FlowResultType.FORM
    assert result["step_id"] == "user"

    result = await hass.config_entries.flow.async_configure(
        result["flow_id"],
        {CONF_HOST: "192.168.1.100"},
    )
    assert result["type"] is FlowResultType.CREATE_ENTRY
    assert result["title"] == "My Integration"
    assert result["data"] == {CONF_HOST: "192.168.1.100"}
    mock_setup_entry.assert_called_once()

async def test_flow_cannot_connect(
    hass: HomeAssistant,
    mock_my_client: AsyncMock,
) -> None:
    """Test error on connection failure."""
    mock_my_client.get_data.side_effect = CannotConnect
    result = await hass.config_entries.flow.async_init(
        DOMAIN, context={"source": SOURCE_USER}
    )
    result = await hass.config_entries.flow.async_configure(
        result["flow_id"], {CONF_HOST: "192.168.1.100"}
    )
    assert result["type"] is FlowResultType.FORM
    assert result["errors"] == {"base": "cannot_connect"}
```

### Test du setup d'entrée

```python
async def test_setup_entry(
    hass: HomeAssistant,
    mock_config_entry: MockConfigEntry,
    mock_my_client: AsyncMock,
) -> None:
    """Test successful setup."""
    mock_config_entry.add_to_hass(hass)
    await hass.config_entries.async_setup(mock_config_entry.entry_id)
    await hass.async_block_till_done()
    
    assert mock_config_entry.state is ConfigEntryState.LOADED
    assert hass.states.get("sensor.my_sensor") is not None
```

### Règles de tests obligatoires

1. **100% de couverture** sur le config flow (happy path + tous les cas d'erreur)
2. **Tester le reauth flow** : vérifier qu'il met à jour l'entry existante, ne crée pas de nouvelle
3. **Tester le reconfigure flow** : même logique
4. **Tester l'unicité** : vérifier qu'on ne peut pas ajouter deux fois le même device
5. **Tester le unload** : `async_unload_entry` doit retourner `True`

---

## 12. API WebSocket

### Connexion et authentification

```
Client → ws://<host>/api/websocket
Server → {"type": "auth_required", "ha_version": "2026.5"}
Client → {"type": "auth", "access_token": "<token>"}
Server → {"type": "auth_ok"} ou {"type": "auth_invalid"}
```

### Format des messages

Chaque message doit avoir un `id` unique (entier) pendant la phase command :

```json
{
  "id": 1,
  "type": "get_states"
}
```

### Commandes principales

```json
// Récupérer tous les états
{"id": 1, "type": "get_states"}

// S'abonner aux changements d'état
{"id": 2, "type": "subscribe_events", "event_type": "state_changed"}

// Appeler un service
{
  "id": 3,
  "type": "call_service",
  "domain": "light",
  "service": "turn_on",
  "service_data": {"entity_id": "light.living_room", "brightness": 255}
}

// Récupérer la config
{"id": 4, "type": "get_config"}

// Ping/heartbeat
{"id": 5, "type": "ping"}
// → {"id": 5, "type": "pong"}

// Valider triggers/conditions/actions
{
  "id": 6,
  "type": "validate_config",
  "trigger": {"platform": "state", "entity_id": "switch.test"}
}

// Extraire entités/devices d'une target
{
  "id": 7,
  "type": "extract_target_entities",
  "target": {"device_id": "abc123"}
}
```

### Étendre l'API WebSocket depuis une intégration

```python
from homeassistant.components import websocket_api
import voluptuous as vol

@websocket_api.websocket_command({
    vol.Required("type"): "my_integration/get_data",
    vol.Optional("device_id"): str,
})
@websocket_api.async_response
async def ws_get_data(
    hass: HomeAssistant,
    connection: websocket_api.ActiveConnection,
    msg: dict,
) -> None:
    """Handle WebSocket command."""
    data = await hass.data[DOMAIN].get_data(msg.get("device_id"))
    connection.send_result(msg["id"], {"data": data})

async def async_setup(hass: HomeAssistant, config: ConfigType) -> bool:
    websocket_api.async_register_command(hass, ws_get_data)
    return True
```

**Appel depuis le frontend :**
```javascript
const result = await hass.connection.sendMessagePromise({
  type: "my_integration/get_data",
  device_id: "abc123",
});
```

### API REST complémentaire

| Endpoint | Méthode | Description |
|----------|---------|-------------|
| `/api/` | GET | Info de base |
| `/api/config` | GET | Configuration HA |
| `/api/states` | GET | Tous les états |
| `/api/states/<entity_id>` | GET/POST | État d'une entité |
| `/api/events/<event_type>` | POST | Déclencher un événement |
| `/api/services/<domain>/<service>` | POST | Appeler un service |
| `/api/template` | POST | Rendre un template |
| `/api/error_log` | GET | Log d'erreurs |
| `/api/camera_proxy/<entity_id>` | GET | Image d'une caméra |

**Authentification REST :**
```
Authorization: Bearer <long_lived_access_token>
```

---

## 13. API REST Supervisor

### Base URL

`http://supervisor/` (depuis un add-on) ou via proxy external.

### Authentification

```bash
Authorization: Bearer ${SUPERVISOR_TOKEN}
```

### Endpoints principaux

```
GET  /supervisor/info          # Info du supervisor
GET  /core/info                # Info de HA Core
POST /core/restart             # Redémarrer Core
GET  /core/api/...             # Proxy vers l'API Core

GET  /addons                   # Liste des add-ons
GET  /addons/<slug>/info       # Info d'un add-on
POST /addons/<slug>/start      # Démarrer un add-on
POST /addons/<slug>/stop       # Arrêter un add-on
GET  /addons/<slug>/logs       # Logs d'un add-on

GET  /os/info                  # Info de l'OS
GET  /host/info                # Info de l'hôte
POST /host/reboot              # Reboot de l'hôte

GET  /network/info             # Info réseau
GET  /backups                  # Liste des backups
POST /backups/new/full         # Créer un backup complet
```

---

## 14. Frontend — Custom Cards

### Structure minimale

```javascript
// my-card.js
class MyCard extends HTMLElement {
  // Appelé quand la config change
  setConfig(config) {
    if (!config.entity) throw new Error("Please define an entity");
    this.config = config;
  }

  // Mise à jour du DOM quand hass ou config change
  set hass(hass) {
    if (!this.content) {
      this.innerHTML = `<ha-card><div class="card-content"></div></ha-card>`;
      this.content = this.querySelector("div");
    }
    const state = hass.states[this.config.entity];
    const stateStr = state ? state.state : "unavailable";
    this.content.innerHTML = `The state of ${this.config.entity} is ${stateStr}!`;
  }

  // Taille de la carte (optionnel)
  getCardSize() { return 1; }

  // Layout hints (HA 2024+)
  static getLayoutOptions() {
    return {
      grid_columns: 2,
      grid_rows: 1,
    };
  }
}

customElements.define("my-card", MyCard);

// Enregistrement pour le sélecteur de carte
window.customCards = window.customCards || [];
window.customCards.push({
  type: "my-card",
  name: "My Card",
  description: "A custom card",
  documentationURL: "https://example.com",
});
```

### Accès aux données HA

**Méthode recommandée** (subscribe pour les mises à jour) :
```javascript
// Subscribe à l'état d'une entité
this.dispatchEvent(new CustomEvent("hass-action", {
  bubbles: true,
  composed: true,
  detail: { config: { entity: this.config.entity }, action: "tap" },
}));

// Lire l'état directement depuis hass
const entityState = this.hass.states[this.config.entity];
```

### Éditeur graphique de config

```javascript
class MyCardEditor extends HTMLElement {
  setConfig(config) { this.config = config; }

  get _entity() { return this.config.entity || ""; }

  render() {
    // Créer le formulaire d'édition
  }

  _valueChanged(ev) {
    const newConfig = Object.assign({}, this.config, { entity: ev.detail.value });
    this.dispatchEvent(new CustomEvent("config-changed", {
      detail: { config: newConfig },
      bubbles: true,
      composed: true,
    }));
  }
}

// Associer l'éditeur à la carte
MyCard.getConfigElement = () => document.createElement("my-card-editor");
MyCard.getStubConfig = () => ({ entity: "sensor.example" });
```

### Utilisation de l'éditeur de formulaire intégré (simple)

```javascript
static getConfigElement() {
  // HA gère l'éditeur si on définit getFormSchema
  return document.createElement("ha-form");
}

static getFormSchema() {
  return [
    { name: "entity", required: true, selector: { entity: { domain: "sensor" } } },
    { name: "title", required: false, selector: { text: {} } },
  ];
}
```

### Ressources — Chargement dans le dashboard

```yaml
# Dans configuration.yaml ou via UI
lovelace:
  resources:
    - url: /local/my-card.js
      type: module
```

### Contraintes importantes

- **Pas de React** : utiliser Lit, Preact, Angular, Polymer, ou vanilla JS
- Ne **jamais** muter la configuration reçue dans `setConfig()` ; créer une copie si nécessaire
- Utiliser `loadCardHelpers()` pour créer des éléments Lovelace internes :
  ```javascript
  const helpers = await loadCardHelpers();
  const card = helpers.createCardElement(config);
  ```
- **CSS variables** disponibles pour le thème : `--primary-color`, `--accent-color`, `--card-background-color`, etc.

### Custom Card Feature

```javascript
class MyCardFeature extends HTMLElement {
  static getStubConfig(stateObj) {
    return { entity: stateObj.entity_id };
  }

  setConfig(config) { this.config = config; }
  set hass(hass) { this._hass = hass; }
}

customElements.define("my-card-feature", MyCardFeature);

window.customCardFeatures = window.customCardFeatures || [];
window.customCardFeatures.push({
  type: "my-card-feature",
  name: "My Feature",
  supported: (stateObj) => stateObj.domain === "light",
  configurable: true,
});
```

### CSS Variables pour Features

```css
.my-feature {
  border-radius: var(--feature-border-radius, 12px);
  gap: var(--feature-button-spacing, 12px);
}
```

---

## 15. Frontend — Custom Strategies et Views

### Dashboard Strategy

Une strategy génère l'intégralité d'un dashboard dynamiquement.

```javascript
class MyDashboardStrategy extends HTMLElement {
  static async generate(config, hass) {
    // Générer la config du dashboard
    const entities = Object.keys(hass.states)
      .filter(e => e.startsWith("light."));

    return {
      title: "My Dashboard",
      views: [{
        title: "Lights",
        cards: entities.map(entity_id => ({
          type: "light",
          entity: entity_id,
        })),
      }],
    };
  }
}

customElements.define("ll-strategy-dashboard-my-strategy", MyDashboardStrategy);
```

### View Strategy

Génère une vue spécifique :

```javascript
class MyViewStrategy extends HTMLElement {
  static async generate(config, hass) {
    return {
      cards: [
        { type: "entities", entities: ["light.salon"] },
      ],
    };
  }
}
customElements.define("ll-strategy-view-my-view", MyViewStrategy);
```

### Custom View Layout

```javascript
class MyCustomLayout extends HTMLElement {
  set hass(hass) { this._hass = hass; }
  set lovelace(lovelace) { this._lovelace = lovelace; }
  set cards(cards) {
    this._cards = cards;
    this._renderLayout();
  }
  set badges(badges) { this._badges = badges; }

  setConfig(config) { this.config = config; }

  _renderLayout() {
    // Disposer les cartes dans un layout custom
    this.innerHTML = "";
    const grid = document.createElement("div");
    grid.style.display = "grid";
    this._cards.forEach(card => grid.appendChild(card));
    this.appendChild(grid);
  }
}
customElements.define("ll-custom-layout-my-layout", MyCustomLayout);
```

---

## 16. Apps / Add-ons

### Structure d'un add-on

```
my_addon/
├── config.yaml          # Configuration de l'add-on
├── Dockerfile           # Image Docker
├── run.sh               # Script de démarrage
└── ...
```

### `config.yaml` essentiel

```yaml
name: "My Add-on"
version: "1.0.0"
slug: "my_addon"
description: "Description courte"
arch:
  - aarch64
  - amd64
  - armhf
  - armv7
  - i386

# Accès aux APIs
homeassistant_api: true    # Accès à l'API Core HA
hassio_api: true           # Accès à l'API Supervisor
hassio_role: default       # default | homeassistant | manager | admin

# Ports exposés
ports:
  8080/tcp: 8080

# Options configurables
options:
  port: 8080
schema:
  port: int
```

### Communication depuis un add-on

**Accès à l'API Core HA :**
```bash
# Via proxy interne
curl -X GET \
  -H "Authorization: Bearer ${SUPERVISOR_TOKEN}" \
  -H "Content-Type: application/json" \
  http://supervisor/core/api/states

# WebSocket
ws://supervisor/core/websocket
```

**Accès à l'API Supervisor :**
```bash
curl -X GET \
  -H "Authorization: Bearer ${SUPERVISOR_TOKEN}" \
  http://supervisor/supervisor/info
```

### DNS interne des add-ons

Format : `{REPO}_{SLUG}` en snake_case → remplacer `_` par `-` pour le DNS.

Exemple : `local_my_addon` → DNS : `local-my-addon`

---

## 17. Native App Integration

### Enregistrement de l'app

`POST /api/mobile_app/registrations`

```json
{
  "app_id": "com.example.myapp",
  "app_name": "My App",
  "app_version": "1.0.0",
  "device_id": "unique-device-id",
  "device_name": "iPhone de Paul",
  "manufacturer": "Apple",
  "model": "iPhone 15",
  "os_name": "iOS",
  "os_version": "17.0",
  "supports_encryption": false,
  "app_data": {
    "push_token": "fcm-token-here",
    "push_url": "https://my-push-server.com/push",
    "push_websocket_channel": false
  }
}
```

### Envoi de données (webhook)

Construire l'URL : `<instance_url>/api/webhook/<webhook_id>`

```json
// Mettre à jour la localisation
{
  "type": "update_location",
  "data": {
    "gps": [48.8566, 2.3522],
    "gps_accuracy": 10,
    "battery": 80,
    "speed": 0,
    "altitude": 35
  }
}

// Déclencher un événement
{
  "type": "fire_event",
  "data": {
    "event_type": "my_app_event",
    "event_data": {"key": "value"}
  }
}

// Rendre un template
{
  "type": "render_template",
  "data": {
    "my_tpl": {"template": "Hello {{ states('sensor.temperature') }}°C"}
  }
}

// Récupérer la config
{"type": "get_config"}

// Récupérer les zones
{"type": "get_zones"}
```

### Notifications push

Activer dans `app_data` lors de l'enregistrement :
```json
{
  "push_token": "FCM_TOKEN_HERE",
  "push_url": "https://my-server.com/push",
  "push_websocket_channel": true
}
```

Le notify target sera `notify.mobile_app_<device_name>`.

**Payload envoyé par HA à votre serveur push :**
```json
{
  "push_token": "FCM_TOKEN_HERE",
  "registration_info": {…},
  "message": "Mouvement détecté !",
  "title": "Sécurité",
  "data": {"url": "/lovelace/cameras"}
}
```

---

## 18. Android Development

### Prérequis

- Android Studio (dernière version stable)
- JDK 21 (`JAVA_HOME` requis)
- NDK (installé automatiquement via SDK Tools)
- CMake (idem)

### Setup

```bash
git clone https://github.com/<username>/android.git
cd android
# Ouvrir dans Android Studio > File > New > Project from Version Control
```

### Firebase (notifications)

Pour développement sans Firebase :
```bash
cp .github/mock-google-services.json app/google-services.json
```

Les notifications restent fonctionnelles via WebSocket même sans Firebase.

### Workflow de contribution

1. Fork → clone
2. `git checkout -b feature/my-feature`
3. Développer + tester
4. PR vers la branche `main`

---

## 19. Bonnes Pratiques et Checklist

### Règles fondamentales

```python
# ✅ Toujours utiliser une bibliothèque Python tierce pour les appels API
from my_device_lib import MyDeviceClient
client = MyDeviceClient(host=entry.data[CONF_HOST])
status = await client.get_status()

# ❌ Ne jamais appeler l'API directement depuis l'intégration
import aiohttp
async with aiohttp.ClientSession() as session:
    status = await session.get(f"http://{host}/status")
```

### Async/Await

```python
# ✅ Toujours async pour les opérations I/O
async def _async_update_data(self) -> dict:
    return await self.client.fetch()

# ✅ Utiliser async_add_executor_job pour le code bloquant
result = await hass.async_add_executor_job(blocking_call, arg1, arg2)

# ❌ Ne jamais bloquer l'event loop
import time
time.sleep(1)  # INTERDIT dans l'event loop
```

### Logging

```python
import logging
_LOGGER = logging.getLogger(__name__)

# ✅ Logger une fois quand indisponible, une fois au retour
if not self._was_unavailable:
    _LOGGER.warning("Device %s is unavailable", self._device_id)
    self._was_unavailable = True

# ✅ Level approprié
_LOGGER.debug("Fetching data for %s", self._device_id)    # Debug détaillé
_LOGGER.info("Integration setup complete")                  # Info générale
_LOGGER.warning("Device unreachable, will retry")          # Avertissement
_LOGGER.error("Unexpected error: %s", err)                 # Erreur
```

### Gestion des erreurs

```python
# ✅ Pattern standard pour async_setup_entry
async def async_setup_entry(hass, entry):
    try:
        await coordinator.async_config_entry_first_refresh()
    except ConfigEntryAuthFailed:
        raise  # HA déclenche le reauth flow
    except ConfigEntryNotReady:
        raise  # HA retente plus tard
```

### Constants

```python
# const.py — toujours définir les constantes ici
DOMAIN = "my_integration"
DEFAULT_SCAN_INTERVAL = 30  # secondes
CONF_DEVICE_ID = "device_id"
```

### Type hints

```python
# ✅ Utiliser des types précis (Python 3.12+)
from __future__ import annotations
from typing import Any

async def async_setup_entry(
    hass: HomeAssistant,
    entry: MyConfigEntry,
    async_add_entities: AddConfigEntryEntitiesCallback,
) -> None:
    ...
```

### Règles de développement clé

| ✅ À FAIRE | ❌ À ÉVITER |
|-----------|-------------|
| Utiliser des libs Python tierces pour les API | Appels HTTP directs dans l'intégration |
| `entry.runtime_data` pour stocker les données runtime | `hass.data[DOMAIN]` pour les nouvelles intégrations |
| `async_add_executor_job` pour le code bloquant | Bloquer l'event loop |
| Marquer `available = False` si injoignable | Logger une erreur à chaque poll raté |
| Lever `UpdateFailed` dans `_async_update_data` | Retourner `None` silencieusement |
| Lever `ConfigEntryAuthFailed` si auth invalide | Loguer l'erreur auth et continuer |
| Logger une seule fois par état (up/down) | Spammer les logs |
| Nettoyer via `async_on_remove` | Laisser des listeners orphelins |
| Tests pour chaque chemin de code | Code sans tests |
| Minimum de fonctionnalité pour la première PR | Feature creep |

---

## 20. Traductions (i18n)

### Structure `strings.json`

```json
{
  "config": {
    "step": {
      "user": {
        "title": "Configurer My Integration",
        "description": "Entrez les informations de connexion",
        "data": {
          "host": "Adresse IP ou hostname",
          "password": "Mot de passe"
        },
        "data_description": {
          "host": "L'adresse IP de votre appareil sur le réseau local",
          "password": "Le mot de passe affiché sur l'étiquette de l'appareil"
        }
      }
    },
    "error": {
      "cannot_connect": "Impossible de se connecter",
      "invalid_auth": "Authentification invalide",
      "unknown": "Erreur inattendue"
    },
    "abort": {
      "already_configured": "L'appareil est déjà configuré",
      "reauth_successful": "Ré-authentification réussie"
    }
  },
  "options": {
    "step": {
      "init": {
        "data": {
          "scan_interval": "Intervalle de mise à jour (secondes)"
        }
      }
    }
  },
  "entity": {
    "sensor": {
      "temperature": {
        "name": "Température"
      },
      "humidity": {
        "name": "Humidité"
      }
    }
  }
}
```

### Traductions des services (`strings.json`)

```json
{
  "services": {
    "my_service": {
      "name": "Mon Service",
      "description": "Description du service",
      "fields": {
        "param": {
          "name": "Paramètre",
          "description": "Description du paramètre"
        }
      }
    }
  }
}
```

**Depuis HA 2025.x** : les traductions de services dans `strings.json` ne sont **plus** incluses dans les réponses WebSocket `get_services` ou REST `/api/services`. Utiliser `frontend/get_translations` pour les récupérer.

### Placeholders de traduction

```json
{
  "config": {
    "step": {
      "user": {
        "description": "Configurez {device_name} sur {host}"
      }
    }
  }
}
```

### Fichiers de traduction

- `strings.json` → fichier source (en anglais)
- `translations/en.json` → traduction anglaise (identique à strings.json)
- `translations/fr.json`, etc. → autres langues

---

## 21. Authentification

### Long-Lived Access Tokens

Générés dans l'UI HA (Profil → Tokens d'accès longue durée).

```
Authorization: Bearer <token>
```

### Auth Flow (OAuth2-like)

Pour les intégrations nécessitant OAuth2 externe :

```python
from homeassistant.helpers import config_entry_oauth2_flow

class MyOAuthFlow(config_entry_oauth2_flow.AbstractOAuth2FlowHandler, domain=DOMAIN):
    OAUTH_SCOPES = ["read", "write"]

    @property
    def logger(self) -> logging.Logger:
        return _LOGGER
```

### Application Credentials

Pour les intégrations nécessitant des credentials OAuth2 fournis par l'utilisateur :

```python
# application_credentials.py
from homeassistant.components.application_credentials import AuthorizationServer

async def async_get_authorization_server(hass: HomeAssistant) -> AuthorizationServer:
    return AuthorizationServer(
        authorize_url="https://api.example.com/oauth/authorize",
        token_url="https://api.example.com/oauth/token",
    )
```

---

## 22. Environnement de Développement

### Setup via Devcontainer (recommandé)

1. Installer VS Code + extension Dev Containers + Docker
2. Cloner `home-assistant/core`
3. Ouvrir dans VS Code → "Reopen in Container"
4. Le devcontainer s'installe automatiquement

### Commandes utiles

```bash
# Lancer HA en développement
hass -c config

# Lancer les tests
pytest tests/components/my_integration/ -v

# Lancer avec couverture
pytest tests/components/my_integration/ --cov=homeassistant.components.my_integration

# Vérifier le typage
mypy homeassistant/components/my_integration/

# Linter
ruff check homeassistant/components/my_integration/
ruff format homeassistant/components/my_integration/

# Script de scaffold (créer une nouvelle intégration)
python3 -m script.scaffold integration
```

### Créer un scaffold d'intégration

```bash
# Depuis la racine du repo core
python3 -m script.scaffold integration
# Suivre les instructions interactives
```

Le scaffold génère : `__init__.py`, `manifest.json`, `config_flow.py`, `strings.json`, `translations/en.json`, `sensor.py`, et les fichiers de test.

### Structure du repo pour les custom integrations

```
<config_dir>/
├── custom_components/
│   └── my_integration/
│       ├── __init__.py
│       ├── manifest.json    # version OBLIGATOIRE
│       ├── config_flow.py
│       └── ...
└── configuration.yaml
```

### Debugging

```python
# Activer les logs debug pour une intégration
logger:
  default: info
  logs:
    homeassistant.components.my_integration: debug
```

### Workflow de contribution (core)

1. Fork `home-assistant/core` sur GitHub
2. Créer une branche : `git checkout -b feature/my-integration`
3. Développer + tests
4. `pre-commit run --all-files` (lint, format, types)
5. PR vers `dev` branch (jamais `master`)
6. Les reviewers vérifient l'Integration Quality Scale

### Processus de review

- Toute nouvelle intégration doit atteindre le niveau **Bronze**
- Le scaffold génère déjà la structure requise pour Bronze
- Inclure les tests dès la première PR
- Garder les PRs petites (minimum fonctionnel d'abord, features ensuite)

---

## Annexe — Références rapides

### Imports courants

```python
# Core
from homeassistant.core import HomeAssistant, callback
from homeassistant.config_entries import ConfigEntry, ConfigFlow, ConfigFlowResult
from homeassistant.const import (
    CONF_HOST, CONF_PORT, CONF_USERNAME, CONF_PASSWORD,
    UnitOfTemperature, UnitOfPressure, PERCENTAGE,
)

# Entités
from homeassistant.helpers.entity import Entity, DeviceInfo
from homeassistant.helpers.update_coordinator import (
    DataUpdateCoordinator, CoordinatorEntity, UpdateFailed
)
from homeassistant.exceptions import ConfigEntryAuthFailed, ConfigEntryNotReady

# Plateformes
from homeassistant.components.sensor import SensorEntity, SensorEntityDescription
from homeassistant.components.sensor import SensorDeviceClass, SensorStateClass
from homeassistant.components.binary_sensor import BinarySensorEntity, BinarySensorDeviceClass
from homeassistant.components.switch import SwitchEntity
from homeassistant.components.light import LightEntity, ColorMode

# Helpers
from homeassistant.helpers import selector
from homeassistant.helpers.aiohttp_client import async_get_clientsession
from homeassistant.helpers.entity_platform import AddConfigEntryEntitiesCallback
from homeassistant.helpers.dispatcher import async_dispatcher_connect, async_dispatcher_send
```

### DeviceInfo

```python
from homeassistant.helpers.entity import DeviceInfo

DeviceInfo(
    identifiers={(DOMAIN, device_id)},  # tuple de (domaine, id unique)
    name="Mon Appareil",
    manufacturer="Acme",
    model="Widget Pro 2000",
    sw_version="1.2.3",
    hw_version="rev-B",
    serial_number="SN-ABC123",
    configuration_url=f"http://{host}",
    suggested_area="Salon",
    via_device=(DOMAIN, hub_id),  # si device parent (hub)
)
```

### Parallel Updates

```python
# Dans sensor.py ou autre plateforme
PARALLEL_UPDATES = 1    # 1 update à la fois
PARALLEL_UPDATES = 0    # Illimité (pour push/coordinator)
```

### Scan Interval

```python
# Dans sensor.py (si pas de coordinator)
from datetime import timedelta
SCAN_INTERVAL = timedelta(minutes=5)
```

### Restore State

```python
from homeassistant.helpers.restore_state import RestoreEntity

class MyEntity(RestoreEntity, SensorEntity):
    async def async_added_to_hass(self) -> None:
        await super().async_added_to_hass()
        if (last_state := await self.async_get_last_state()) is not None:
            self._attr_native_value = last_state.state
```

---

*Document généré à partir de https://developers.home-assistant.io/ — Mai 2026*
*Couvre : Core, Config Flow, Entities, Coordinator, Frontend, API WebSocket, Add-ons, Quality Scale, Tests*
