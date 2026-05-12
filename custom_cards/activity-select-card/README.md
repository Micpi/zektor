# Activity Select Card

Carte Home Assistant personnalisée pour sélectionner des activités via des boutons ronds sur une ligne scrollable.

## Installation

1. **Copier le fichier** `activity-select-card.js` dans le dossier `config/www/` de votre Home Assistant.

2. **Ajouter la ressource** dans Home Assistant :
   - Aller dans **Paramètres → Tableaux de bord → ⋮ (menu) → Ressources**
   - Cliquer sur **+ Ajouter une ressource**
   - URL : `/local/activity-select-card.js`
   - Type : **Module JavaScript**

3. **Ajouter la carte** :
   - Modifier un tableau de bord → **+ Ajouter une carte**
   - Chercher **Activity Select Card** dans la liste
   - Tout se configure via l'éditeur graphique !

## Configuration par l'éditeur graphique

Tous les paramètres sont modifiables sans toucher au YAML :

| Paramètre | Description | Défaut |
|---|---|---|
| **Titre carte** | Titre affiché au-dessus des boutons | *(vide)* |
| **Entité** | `input_select` ou `input_text` à piloter | *(optionnel)* |
| **Taille bouton** | Diamètre des boutons en px | `80` |
| **Taille icône** | Taille de l'icône MDI en px | `40` |
| **Taille texte** | Taille de la police du label en px | `12` |
| **Espacement** | Gap entre les boutons en px | `12` |
| **Couleur active** | Couleur du bouton sélectionné | `var(--primary-color)` |
| **Couleur inactive** | Couleur de fond des boutons | `var(--card-background-color)` |

### Pour chaque activité

| Champ | Description |
|---|---|
| **Nom** | Texte affiché sous l'icône (optionnel) |
| **Icône** | Icône MDI, ex: `mdi:television` (optionnel) |
| **Valeur** | Valeur envoyée à l'entité quand on clique |
| **Couleur icône** | Couleur personnalisée de l'icône (optionnel) |

Les activités sont réordonnables avec les boutons ▲▼.

## Exemple YAML (optionnel)

```yaml
type: custom:activity-select-card
title: Activités
entity: input_select.activite
button_size: 80
icon_size: 40
font_size: 12
gap: 12
active_color: "var(--primary-color)"
inactive_color: "var(--card-background-color, #444)"
activities:
  - name: TV
    icon: mdi:television
    value: tv
  - name: Musique
    icon: mdi:music
    value: musique
  - name: Jeux
    icon: mdi:gamepad-variant
    value: jeux
  - name: Film
    icon: mdi:movie
    value: film
  - icon: mdi:dots-horizontal
    value: autre
```

## Fonctionnalités

- **Boutons ronds** avec icône et/ou titre
- **Icônes auto-formatées** : rendu homogène quelle que soit l'icône
- **Scroll horizontal** quand les boutons dépassent la largeur
- **Taille personnalisable** (bouton, icône, texte, espacement)
- **Couleurs personnalisables** (actif/inactif, couleur par icône)
- **Éditeur graphique complet** : aucun YAML nécessaire
- **Compatible `input_select` et `input_text`**
- **Animation tactile** au clic
- **Réordonnement** des activités dans l'éditeur
