# Zektor Audio System

[![HACS](https://img.shields.io/badge/HACS-Custom%20Integration-orange?style=for-the-badge)](https://hacs.xyz)
[![Home Assistant](https://img.shields.io/badge/Home%20Assistant-2024.1%2B-blue?style=for-the-badge&logo=home-assistant)](https://www.home-assistant.io/)
[![Version](https://img.shields.io/badge/Version-v0.3.8-0EA5E9?style=for-the-badge)](https://github.com/Micpi/zektor/releases/latest)
[![Buy Me a Coffee](https://img.shields.io/badge/Buy%20Me%20a%20Coffee-Support-FFDD00?style=for-the-badge&logo=buymeacoffee&logoColor=000000)](https://buymeacoffee.com/mickaelpila)

Home Assistant custom integration for Zektor ProAudio and ClarityAudio matrix amplifiers.

## Installation Via HACS

1. Open HACS in Home Assistant.
2. Go to Integrations, open the menu, then Custom repositories.
3. Add `https://github.com/Micpi/zektor`.
4. Select category `Integration`.
5. Install `Zektor Audio System`.
6. Restart Home Assistant.
7. Go to Settings, Devices & services, Add integration, then search `Zektor Audio System`.

## Features

- Persistent TCP connection.
- Push-driven state updates from the device listener.
- Power, source, digital source, mute, volume, EQ, balance and crossover entities.
- Zone capacity detection.
- Reconnect button.
- Multi-zone support up to 64 zones.

## Configuration

| Parameter | Default |
| --- | --- |
| Host | Required |
| Port | `50005` |
| Name | `Zektor Audio System` |
| Zones | `4`, with auto-detection when possible |

## Manual Installation

Copy `custom_components/zektor` into your Home Assistant `config/custom_components/` directory and restart Home Assistant.

