# Blaze PowerZone Connect Integration

Custom Home Assistant integration for Blaze PowerZone Connect amplifiers.

## Installation via HACS

1. Add this repository in HACS as type Integration.
2. Install the integration from HACS.
3. Restart Home Assistant.
4. Add integration: Settings -> Devices & Services -> Add Integration -> Blaze PowerZone Connect.

## Domain

- blaze_powerzone

## Features

- Config flow with zeroconf discovery.
- DataUpdateCoordinator polling.
- Sensors, switches, numbers, selects, and buttons.
- Raw service for advanced API commands:
  - service: blaze_powerzone.send_raw_command
