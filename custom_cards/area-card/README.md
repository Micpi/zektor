# Alpha Area Card

Cette carte a ete re-ecrite pour de meilleures performances et une configuration plus simple.

## Type Lovelace

```yaml
type: custom:alpha-area-card
```

## Installation Home Assistant

1. Copier le fichier `custom_cards/area-card/alpha-area-card.js` dans `config/www/` de Home Assistant.
2. Ajouter la ressource Lovelace:

```yaml
url: /local/alpha-area-card.js
type: module
```

3. Vider le cache navigateur ou faire un hard refresh.

## Ajout depuis l'interface (carte native)

- Ouvrir le dashboard.
- Cliquer sur Ajouter une carte.
- Rechercher `Alpha Area Card`.
- Configurer visuellement la carte via l'editeur integre.

## Build local

Depuis `custom_cards/area-card`:

```bash
npm run build
```

Fichiers generes:

- `dist/alpha-area-card.js`
- `dist/area-card.js` (compatibilite avec le script `build_card.ps1`)

## Parametres principaux

- title
- area
- entities
- hide_unavailable
- tap_action
- styles
- darken_image
- shadow
- force_dialog
- state_color
- card_mod.style

## Exemple d'origine

Voir le modele d'origine dans:

- ../../examples/cartes Lovelace/area-card-modeles-demo.yaml

## Collection de modeles

Le fichier de demos contient 5 modeles:

1. Origine
2. Compact
3. Contraste eleve
4. Etat dynamique HA
5. Minimal

Chemin:

- ../../examples/cartes Lovelace/area-card-modeles-demo.yaml

