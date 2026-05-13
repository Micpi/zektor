# Blaze App Card

Custom Lovelace card to pilot Blaze PowerZone entities as an organized mini-application.

## Features

- Structured tabs: overview, controls, variables, API.
- Automatic discovery of Blaze entities (sensor/number/select/switch/button).
- Direct actions for power and controls.
- Raw API command panel via service `blaze_powerzone.send_raw_command`.
- Visual editor with accordion sections (Naive Flex style).

## Installation

Add this repository as a custom Lovelace repository in HACS, then install the card.

## Resource

```yaml
resources:
  - url: /hacsfiles/blaze-app-card/blaze-app-card.js
    type: module
```

## Example

```yaml
type: custom:blaze-app-card
title: Blaze Control Center
entity_prefix: blaze_powerzone
show_raw_panel: true
# entry_id: 7b4f357278ef4216baaa111222333444
```
