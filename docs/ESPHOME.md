# ESPHome – Guide de développement

> Documentation pour le développement des configurations ESPHome dans ce workspace.

---

## Vue d'ensemble

Le dossier `esphome/` contient les configurations pour les appareils DIY intégrés à Home Assistant via ESPHome.

```
esphome/
├── README.md
├── secrets.yaml            → ⚠️ NE PAS COMMITER (dans .gitignore)
├── common/
│   ├── base.yaml           → Config de base partagée (WiFi, OTA, API, logs)
│   └── sensors_common.yaml → Capteurs diagnostics communs
└── devices/
    ├── esp32/              → Configurations ESP32
    ├── esp01/              → Configurations ESP8266 01s
    ├── d1mini/             → Configurations Wemos D1 Mini
    └── m5stack/            → Configurations M5Stack
```

---

## Démarrage rapide

### 1. Créer le fichier secrets.yaml

```yaml
# esphome/secrets.yaml – NE JAMAIS COMMITER CE FICHIER
wifi_ssid: "MonReseau"
wifi_password: "MonMotDePasse"
wifi_ap_password: "fallback_password"
ota_password: "mot_de_passe_ota_securise"
api_encryption_key: "cle_32_bytes_en_base64=="
```

### 2. Créer une nouvelle config depuis le template

```yaml
# esphome/devices/esp32/mon-device.yaml
substitutions:
  device_name: "sensor-temp-salon"
  friendly_name: "Capteur Salon"

esphome:
  name: ${device_name}
  friendly_name: ${friendly_name}

esp32:
  board: esp32dev
  framework:
    type: arduino

# Inclure la config de base (WiFi, OTA, API, diagnostics)
packages:
  base: !include ../../common/base.yaml
```

---

## Principes de développement

### Stabilité long terme

- Épingler les versions ESPHome : `esphome_version: "2024.x.x"`
- Éviter les features expérimentales en production
- Préférer `update_interval: 30s` ou plus pour économiser le réseau

### Précision numérique

```yaml
sensor:
  - platform: sht3xd
    temperature:
      name: "Température"
      accuracy_decimals: 2   # ← précision réelle du capteur
    humidity:
      name: "Humidité"
      accuracy_decimals: 2
```

> Ne pas utiliser `accuracy_decimals: 0` ou `1` pour des capteurs qui ont une vraie précision décimale.

### Économie d'énergie

```yaml
wifi:
  power_save_mode: none   # Pour ESP alimenté en continu
  # power_save_mode: light  # Pour ESP sur batterie

deep_sleep:
  run_duration: 30s
  sleep_duration: 10min   # Pour capteurs sur batterie
```

---

## Catalogue de capteurs

### Température / Humidité

| Capteur | Plateforme ESPHome    | Précision |
|---------|-----------------------|-----------|
| SHT31   | `sht3xd`              | ±0.3°C    |
| SHT40   | `sht4x`               | ±0.2°C    |
| DHT22   | `dht` type: DHT22     | ±0.5°C    |
| BME280  | `bme280_i2c`          | ±1°C      |
| DS18B20 | `dallas`              | ±0.5°C    |

### Présence / Mouvement

| Capteur      | Plateforme ESPHome | Notes                    |
|--------------|--------------------|--------------------------|
| PIR HC-SR501 | `gpio` binary_sensor | Simple, économique      |
| LD2410       | `ld2410`           | mmWave, présence statique |
| HLK-LD2450   | `hlk_ld2450`       | Multi-personnes          |

---

## Débogage

### Logs en temps réel

```powershell
# Via ESPHome CLI (si installé)
esphome logs esphome/devices/esp32/mon-device.yaml
```

### Activer le debug temporairement

```yaml
logger:
  level: DEBUG   # Changer en INFO en production
  logs:
    wifi: INFO   # Éviter le spam WiFi même en DEBUG
```

---

## Intégration Home Assistant

Les devices ESPHome s'intègrent via :
1. **ESPHome Add-on** (recommandé) : intégration native automatique
2. **API native ESPHome** : découverte automatique par HA

Chaque device s'auto-découvre et expose ses entités directement dans HA.

### Nommage des entités

Le nom des entités dans HA sera : `<friendly_name> <Nom capteur>`

Exemple : `friendly_name: "Salon"` + `name: "Température"` → `sensor.salon_temperature`

---

## Sécurité

- `secrets.yaml` dans `.gitignore` – ne jamais commiter
- Utiliser une `api_encryption_key` unique par device
- `ota_password` différent pour chaque device (ou par réseau)
- Désactiver les logs UART en production (`baud_rate: 0`)
- Mettre à jour ESPHome régulièrement (CVE WiFi, TLS)
