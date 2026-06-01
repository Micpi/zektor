# iOS Liquid Dock - Instructions pour Agents IA

## Vue d'ensemble du projet
Composant Home Assistant Custom Card créant un dock de navigation animé style iOS avec effets liquides et glassmorphism. Fichier autonome (`ios-dock.js`) implémentant un Web Component vanilla.

## Architecture technique

### Composant principal : `IOSLiquidDockCard`
- **Type** : Web Component (`HTMLElement`) avec Shadow DOM
- **Lifecycle** : Suit le pattern Home Assistant Custom Card (méthodes `setConfig`, `set hass`, `getCardSize`)
- **Versioning** : Flag global `window.__iosDockLoadedV7` prévient double chargement
- **Enregistrement** : Auto-enregistré dans `window.customCards` pour UI Lovelace

### Système de configuration visuelle
La méthode statique `getConfigForm()` retourne un schéma de formulaire HA avec :
- Sélecteurs de couleurs RGB (`color_rgb`) pour active_color, active_icon_color, active_text_color
- Sliders numériques pour opacités (opacity_light/dark, active_bg_opacity)
- Configuration YAML pour boutons (array d'objets {name, icon, link})

### Navigation et détection d'état actif
**Algorithme de scoring unique** (lignes 380-395) :
1. Score 1000+ : Ancre exacte (`#popup`) - priorité popups/dialogues
2. Score 500+ : Chemin exact (`/lovelace/lights`)
3. Score 100+ : Sous-vue (chemin parent, ex: `/lovelace` match `/lovelace/lights`)
4. Un seul bouton actif à la fois (score max gagnant)

**Navigation** : Utilise `window.history.pushState` + événement `location-changed` (pattern HA standard)

### Détection mode éditeur
Double approche (`_isEditorMode()` lignes 287-310) :
- URL : Query param `edit=true`
- DOM : Traversée Shadow DOM recherchant tags EDITOR/PREVIEW/DIALOG ou attributs edit-mode
- Impact : Désactive position fixed en mode édition

### Thème & Color Scheme
- `_getScheme()` : Priorise `this._hass.themes.darkMode`, fallback sur `prefers-color-scheme`
- Variables CSS personnalisées : `--accent`, `--active-icon`, `--active-text`, `--bg-opacity`, `--drop-opacity`
- Opacités séparées pour modes clair/sombre (`opacity_light` / `opacity_dark`)

## Conventions de code

### Gestion d'état
- `_config` : Configuration fusionnée (defaults + user config)
- `_hass` : Objet Home Assistant passé par framework (getter/setter pattern)
- `_lastPath` : Cache pour forcer re-render sur changement URL

### Effets visuels
- Animation liquide : `@keyframes fluidAnimation` avec border-radius dynamiques
- Effet ripple : Élément `.ripple-effect` créé/supprimé au tap (600ms)
- Transition goutte : `cubic-bezier(0.34, 1.56, 0.64, 1)` pour effet rebond

### Styling responsive
- `max-width: min(${max_width}px, calc(100vw - ${side_gap * 2}px))` : S'adapte au viewport
- `scrollbar-width: none` + `::-webkit-scrollbar { display: none }` : Scroll invisible
- Position conditionnelle : `.fixed-bottom` / `.fixed-top` avec attribut `is-editor`

## Modifications fréquentes

### Ajouter propriété configurable
1. Ajouter default dans `setConfig()` defaults
2. Ajouter champ dans `getConfigForm()` schema avec sélecteur approprié
3. Utiliser via `this._config.ma_propriete` dans `render()`

### Modifier détection bouton actif
Modifier le système de scoring (lignes 380-395) dans le template literal de `render()`.

### Changer comportement navigation
Ajuster `_handleTap()` : actuellement supporte `btn.link` et `btn.action === "navigate"`.

## Patterns à respecter
- **Pas de jQuery/React** : Vanilla JS uniquement
- **Shadow DOM obligatoire** : Tous les styles sont scopés
- **Events HA** : Toujours dispatcher `location-changed` après navigation
- **Défensif** : Vérifier `this.shadowRoot` avant render, try/catch sur enregistrement
- **Performance** : Re-render uniquement si changement détecté (_lastPath, _isEditor)

## Debugging
- Console logs : Préfixés `[iOS Dock]` avec version
- Flag de chargement : Vérifier `window.__iosDockLoadedV7` en console
- Mode éditeur : Forcer avec attribut `is-editor` sur élément
