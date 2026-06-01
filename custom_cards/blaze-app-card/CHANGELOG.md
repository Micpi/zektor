# Changelog

Toutes les evolutions sont listees ici avec un focus strict utilisateur.

## Unreleased

### Added - Unreleased

- Nouvelle experience "console pro" avec onglets metier: `Overview`, `Controls`, `DSP`, `Signal`, `Variables`, `API`.
- Section DSP complete avec detection automatique des controles DSP (`numbers`, `selects`, `switches`, `buttons`).
- Monitoring signal avec jauges colorees (`good` / `warn` / `bad`) pour visualiser rapidement les seuils critiques.
- Support de mini tendances (sparkline) sur gauges lorsque les capteurs exposent `samples`, `history` ou `values`.
- Editeur visuel enrichi: activation/desactivation de chaque onglet et mapping par mots-cles CSV.

### Changed - Unreleased

- Architecture de rendu revue pour une interface plus lisible en exploitation (desktop et mobile).
- Classification des entites rendue configurable afin d'adapter la carte a des modeles Blaze differents sans modifier le code.
- `getCardSize` augmente pour mieux refleter la densite de controles et eviter les cartes tronquees.

### Fixed - Unreleased

- Selection de l'onglet actif maintenant robuste quand certains onglets sont masques via la configuration.
- Affichage de valeurs/labels protege (escape HTML) pour eviter les soucis visuels sur noms speciaux.

## v0.2.2 - 2026-05-13

### Added - v0.2.2

- Publication officielle de la carte Blaze App Card pour installation via HACS.

### Changed - v0.2.2

- Stabilisation du package de distribution HACS pour faciliter l'installation cote utilisateur.

## v0.2.1 - 2026-05-13

### Added - v0.2.1

- Premiere version utilisable de Blaze App Card avec navigation par onglets et pilotage de base.

### Changed - v0.2.1

- Interface et structure initiales alignees pour le controle des entites Blaze PowerZone.

## v0.2.3 - 2026-05-13

- feat(card): publish blaze-app-card
- changed: CHANGELOG.md
- changed: README.md
- changed: blaze-app-card.js
- changed: hacs.json

## v0.2.4 - 2026-05-13

- feat(card): publish blaze-app-card
- changed: CHANGELOG.md
- changed: blaze-app-card.js
- changed: hacs.json

## v0.2.5 - 2026-05-13

- feat(card): publish blaze-app-card
- changed: hacs.json

## v0.2.6 - 2026-05-13

- feat(card): publish blaze-app-card
- changed: blaze-app-card.js
- changed: hacs.json

## v0.2.7 - 2026-06-01

- feat(card): publish blaze-app-card v0.2.7
- changed: .gitignore
- changed: .publish/
- changed: CHANGELOG.md
- changed: README.md
- changed: blaze-app-card.js
- changed: hacs.json
- changed: package-lock.json
- changed: package.json


