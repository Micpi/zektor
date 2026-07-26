import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module"

/**
 * Alpha Area Card: carte Lovelace orientee piece, image, entites et badges.
 * Le fichier est autonome afin de rester simple a publier via HACS.
 */

/**
 * Nom du custom element principal declare dans Lovelace.
 */
const CARD_TYPE = "alpha-area-card"
/**
 * Nom du custom element de l editeur visuel.
 */
const CARD_EDITOR_TYPE = "alpha-area-card-editor"
/**
 * Etats Home Assistant a ignorer dans les resumes et affichages utiles.
 */
const UNAVAILABLE_STATES = new Set(["unknown", "unavailable"])
/**
 * Domaines traites comme des lignes de capteurs ou alertes.
 */
const SENSOR_DOMAINS = new Set(["sensor", "binary_sensor"])
/**
 * Domaines qui peuvent recevoir une action toggle par defaut.
 */
const TOGGLE_DOMAINS = new Set([
  "light",
  "switch",
  "fan",
  "input_boolean",
  "humidifier",
  "group",
  "automation",
])

/**
 * Actions supportees pour les boutons d entites.
 */
const ACTION_OPTIONS = [
  "none",
  "more-info",
  "navigate",
  "toggle",
  "url",
  "call-service",
  "fire-dom-event",
]

/**
 * Modes de rendu disponibles pour la carte.
 */
const DISPLAY_TYPES = ["compact", "icon", "picture", "camera"]
/**
 * Positions autorisees pour les features type area-controls.
 */
const FEATURE_POSITIONS = ["bottom", "inline"]
/**
 * Emplacements disponibles pour les entites dans la carte.
 */
const ENTITY_POSITIONS = [
  "bottom-left",
  "bottom-center",
  "bottom-right",
  "top-left",
  "top-center",
  "top-right",
  "title-right",
]
/**
 * Variantes visuelles disponibles pour chaque entite.
 */
const ENTITY_DISPLAY_MODES = ["button", "text", "icon"]
/**
 * Coins disponibles pour placer un badge sur un bouton.
 */
const ENTITY_BADGE_POSITIONS = ["top-right", "top-left", "bottom-right", "bottom-left"]
/**
 * Modes de contenu pris en charge par les badges.
 */
const ENTITY_BADGE_MODES = ["auto", "state", "count_on", "text"]
/**
 * Regles de visibilite disponibles pour les badges.
 */
const ENTITY_BADGE_SHOW_WHEN = ["auto", "always", "active", "on", "nonzero", "state"]
/**
 * Effets typographiques disponibles pour le titre.
 */
const TITLE_EFFECTS = ["none", "shadow", "neon", "outline"]
/**
 * Classes de capteurs resumees automatiquement par defaut.
 */
const DEFAULT_SENSOR_CLASSES = ["temperature", "humidity"]
/**
 * Classes de binary_sensor affichees comme alertes par defaut.
 */
const DEFAULT_ALERT_CLASSES = ["moisture", "motion"]
/**
 * Hauteur de reference utilisee pour stabiliser les valeurs en vh.
 */
const CARD_HEIGHT_VIEWPORT_REFERENCE = 900
/**
 * Classes de capteurs qui se cumulent au lieu de prendre une valeur mediane.
 */
const SUM_SENSOR_CLASSES = new Set(["energy", "gas", "monetary", "power", "volume", "water"])
/**
 * Types de feature acceptes pour les controles de zone.
 */
const AREA_CONTROL_FEATURE_TYPES = new Set(["area-controls", "area_controls"])
/**
 * Etats consideres inactifs pour couleurs, badges et actions visuelles.
 */
const INACTIVE_STATES = new Set([
  "off",
  "closed",
  "locked",
  "idle",
  "standby",
  "paused",
  "unavailable",
  "unknown",
])
/**
 * Alias de couleurs Home Assistant acceptes dans la configuration.
 */
const COLOR_TOKENS = {
  primary: "var(--primary-color, #03A9F4)",
  accent: "var(--accent-color, var(--primary-color, #03A9F4))",
  disabled: "var(--disabled-color, #BDBDBD)",
  red: "var(--red-color, #F44336)",
  pink: "var(--pink-color, #E91E63)",
  purple: "var(--purple-color, #9C27B0)",
  "deep-purple": "var(--deep-purple-color, #673AB7)",
  indigo: "var(--indigo-color, #3F51B5)",
  blue: "var(--blue-color, #2196F3)",
  "light-blue": "var(--light-blue-color, #03A9F4)",
  cyan: "var(--cyan-color, #00BCD4)",
  teal: "var(--teal-color, #009688)",
  green: "var(--green-color, #4CAF50)",
  "light-green": "var(--light-green-color, #8BC34A)",
  lime: "var(--lime-color, #CDDC39)",
  yellow: "var(--yellow-color, #FFEB3B)",
  amber: "var(--amber-color, #FFC107)",
  orange: "var(--orange-color, #FF9800)",
  "deep-orange": "var(--deep-orange-color, #FF5722)",
  brown: "var(--brown-color, #795548)",
  grey: "var(--grey-color, #9E9E9E)",
  "blue-grey": "var(--blue-grey-color, #607D8B)",
  black: "#000000",
  white: "#FFFFFF",
}

/**
 * Icones par device_class pour les sensors numeriques.
 */
const SENSOR_DEVICE_CLASS_ICONS = {
  apparent_power: "mdi:flash",
  battery: "mdi:battery",
  carbon_dioxide: "mdi:molecule-co2",
  carbon_monoxide: "mdi:molecule-co",
  current: "mdi:current-ac",
  energy: "mdi:lightning-bolt",
  gas: "mdi:meter-gas",
  humidity: "mdi:water-percent",
  illuminance: "mdi:brightness-5",
  monetary: "mdi:cash",
  power: "mdi:flash",
  pressure: "mdi:gauge",
  signal_strength: "mdi:wifi",
  temperature: "mdi:thermometer",
  timestamp: "mdi:clock-outline",
  voltage: "mdi:sine-wave",
  volume: "mdi:water",
  water: "mdi:water",
}

/**
 * Icones off/on par device_class pour les binary_sensors.
 */
const BINARY_SENSOR_DEVICE_CLASS_ICONS = {
  battery: ["mdi:battery-outline", "mdi:battery"],
  cold: ["mdi:thermometer", "mdi:snowflake"],
  connectivity: ["mdi:lan-disconnect", "mdi:lan-connect"],
  door: ["mdi:door-closed", "mdi:door-open"],
  garage_door: ["mdi:garage", "mdi:garage-open"],
  gas: ["mdi:check-circle-outline", "mdi:alert-circle"],
  heat: ["mdi:thermometer", "mdi:fire"],
  light: ["mdi:brightness-5", "mdi:brightness-7"],
  lock: ["mdi:lock", "mdi:lock-open-variant"],
  moisture: ["mdi:water-off", "mdi:water-alert"],
  motion: ["mdi:motion-sensor-off", "mdi:motion-sensor"],
  moving: ["mdi:pause-circle-outline", "mdi:motion"],
  occupancy: ["mdi:home-outline", "mdi:home"],
  opening: ["mdi:square-outline", "mdi:square-off-outline"],
  plug: ["mdi:power-plug-off", "mdi:power-plug"],
  power: ["mdi:power-plug-off", "mdi:power-plug"],
  presence: ["mdi:home-outline", "mdi:home-account"],
  problem: ["mdi:check-circle-outline", "mdi:alert-circle"],
  running: ["mdi:stop-circle-outline", "mdi:play-circle"],
  safety: ["mdi:shield-check", "mdi:shield-alert"],
  smoke: ["mdi:check-circle-outline", "mdi:smoke-detector-alert"],
  sound: ["mdi:volume-off", "mdi:volume-high"],
  tamper: ["mdi:shield-check", "mdi:shield-alert"],
  update: ["mdi:package-variant", "mdi:package-up"],
  vibration: ["mdi:vibrate-off", "mdi:vibrate"],
  window: ["mdi:window-closed", "mdi:window-open"],
}

/**
 * Icones par device_class pour les covers.
 */
const COVER_DEVICE_CLASS_ICONS = {
  awning: "mdi:awning",
  blind: "mdi:blinds",
  curtain: "mdi:curtains",
  damper: "mdi:circle-slice-8",
  door: "mdi:door",
  garage: "mdi:garage",
  gate: "mdi:gate",
  shade: "mdi:roller-shade",
  shutter: "mdi:window-shutter",
  window: "mdi:window-closed",
}

/**
 * Icones de secours par domaine lorsque HA ne fournit rien.
 */
const DOMAIN_ICONS = {
  alarm_control_panel: "mdi:shield-home",
  automation: "mdi:robot",
  button: "mdi:gesture-tap-button",
  calendar: "mdi:calendar",
  camera: "mdi:cctv",
  climate: "mdi:thermostat",
  conversation: "mdi:chat",
  device_tracker: "mdi:map-marker",
  fan: "mdi:fan",
  group: "mdi:google-circles-communities",
  humidifier: "mdi:air-humidifier",
  image: "mdi:image",
  input_boolean: "mdi:toggle-switch-off",
  input_button: "mdi:gesture-tap-button",
  input_datetime: "mdi:calendar-clock",
  input_number: "mdi:numeric",
  input_select: "mdi:format-list-bulleted",
  input_text: "mdi:form-textbox",
  light: "mdi:lightbulb",
  lock: "mdi:lock",
  media_player: "mdi:speaker",
  number: "mdi:numeric",
  person: "mdi:account",
  remote: "mdi:remote",
  scene: "mdi:palette",
  script: "mdi:script-text",
  select: "mdi:format-list-bulleted",
  sensor: "mdi:gauge",
  siren: "mdi:bullhorn",
  switch: "mdi:toggle-switch-off",
  update: "mdi:package-up",
  vacuum: "mdi:robot-vacuum",
  water_heater: "mdi:water-boiler",
  weather: "mdi:weather-partly-cloudy",
}

/**
 * Valeurs visuelles par defaut de la carte.
 */
const STYLE_DEFAULTS = {
  button_icon_color_on: "var(--primary-color, #00AEEF)",
  button_icon_color_off: "var(--secondary-text-color, #9CA3AF)",
  badge_text_color: "var(--text-primary-color, #FFFFFF)",
  button_light_color_on: "var(--state-light-active-color, var(--primary-color, #00AEEF))",
  badge_background: "var(--primary-color, #00AEEF)",
  title_color: "var(--primary-text-color, #f8fafc)",
  title_effect: "shadow",
  title_font_size: "1.3rem",
  title_font_weight: "600",
  title_text_transform: "none",
  title_text_shadow: "",
  image_blur: "0px",
  border_radius: "16px",
}

/**
 * Valeurs par defaut appliquees a chaque entite.
 */
const ENTITY_DEFAULTS = {
  position: "",
  display_mode: "button",
  show_name: false,
  show_state: false,
  icon: "",
  icon_on: "",
  icon_off: "",
  text: "",
  icon_color_on: "",
  icon_color_off: "",
  text_color_on: "",
  text_color_off: "",
  background_color_on: "",
  background_color_off: "",
}

/**
 * Configuration minimale normalisee avant rendu et edition.
 */
const DEFAULT_CONFIG = {
  title: "",
  area: "",
  display_type: "picture",
  icon: "",
  image: "",
  camera_entity: "",
  aspect_ratio: "16:9",
  height: "",
  color: "",
  auto_area_entities: true,
  hide_unavailable: false,
  entity_sort: "none",
  include_domains: [],
  exclude_domains: [],
  exclude_entities: [],
  sensor_classes: [...DEFAULT_SENSOR_CLASSES],
  alert_classes: [...DEFAULT_ALERT_CLASSES],
  features: [],
  features_position: "bottom",
  max_entities: 0,
  entities: [],
  entity_defaults: { ...ENTITY_DEFAULTS },
  styles: { ...STYLE_DEFAULTS },
  darken_image: true,
  shadow: false,
  force_dialog: false,
  state_color: false,
}

/**
 * Convertit une valeur inconnue en chaine sure.
 */
const safeText = (value) => (value === null || value === undefined ? "" : String(value))

/**
 * Clone les objets de configuration simples sans conserver de references.
 */
const deepClone = (value) => JSON.parse(JSON.stringify(value))

/**
 * Conserve uniquement les cles de configuration actuelles de la carte.
 */
const pickKnownConfig = (config = {}) => {
  const known = {}
  for (const [key, value] of Object.entries(config || {})) {
    if (Object.prototype.hasOwnProperty.call(DEFAULT_CONFIG, key)) {
      known[key] = value
    }
  }
  return known
}

/**
 * Echappe du texte avant injection dans le HTML genere.
 */
const escapeHtml = (value) =>
  safeText(value).replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    }
    return map[char]
  })

/**
 * Alias explicite pour echapper les attributs HTML.
 */
const escapeAttribute = escapeHtml

/**
 * Transforme une entree entity YAML en objet exploitable.
 */
const parseEntityConfig = (rawEntity) => {
  if (typeof rawEntity === "string") {
    return { entity: rawEntity }
  }
  if (!rawEntity || typeof rawEntity !== "object" || !rawEntity.entity) {
    return null
  }
  return { ...rawEntity }
}

/**
 * Convertit une liste texte en tableau d entites.
 */
const parseEntitiesText = (text) =>
  safeText(text)
    .split(/\r?\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean)

/**
 * Convertit une liste texte en domaines normalises.
 */
const parseDomainsText = (text) =>
  safeText(text)
    .split(/\r?\n|,|;/)
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)

/**
 * Decoupe les champs texte multi-valeurs separes par virgule ou retour ligne.
 */
const parseStringList = (text) =>
  safeText(text)
    .split(/\r?\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean)

/**
 * Normalise une liste obligatoire avec fallback.
 */
const normalizeStringList = (value, fallback = [], lowerCase = false) => {
  if (value === undefined || value === null || value === "") {
    return [...fallback]
  }

  const list = Array.isArray(value) ? value : parseStringList(value)
  const normalized = list.map((item) => {
    const text = safeText(item).trim()
    return lowerCase ? text.toLowerCase() : text
  })
  return normalized.filter(Boolean)
}

/**
 * Normalise une liste optionnelle sans ajouter de valeurs par defaut.
 */
const normalizeOptionalStringList = (value, lowerCase = false) => {
  const list = Array.isArray(value) ? value : parseStringList(value)
  return list
    .map((item) => {
      const text = safeText(item).trim()
      return lowerCase ? text.toLowerCase() : text
    })
    .filter(Boolean)
}

/**
 * Valide une valeur de select contre une liste autorisee.
 */
const normalizeSelect = (value, allowed, fallback) =>
  allowed.includes(value) ? value : fallback

/**
 * Valide la position d une entite.
 */
const normalizeEntityPosition = (value, fallback = "bottom-right") =>
  ENTITY_POSITIONS.includes(value) ? value : fallback

/**
 * Valide le mode d affichage d une entite.
 */
const normalizeEntityDisplayMode = (value, fallback = "button") =>
  ENTITY_DISPLAY_MODES.includes(value) ? value : fallback

/**
 * Valide la position d un badge.
 */
const normalizeEntityBadgePosition = (value, fallback = "top-right") =>
  ENTITY_BADGE_POSITIONS.includes(value) ? value : fallback

/**
 * Valide le mode de contenu d un badge.
 */
const normalizeEntityBadgeMode = (value, fallback = "auto") =>
  ENTITY_BADGE_MODES.includes(value) ? value : fallback

/**
 * Valide la condition d affichage d un badge.
 */
const normalizeEntityBadgeShowWhen = (value, fallback = "auto") =>
  ENTITY_BADGE_SHOW_WHEN.includes(value) ? value : fallback

/**
 * Valide l effet applique au titre.
 */
const normalizeTitleEffect = (value, fallback = "shadow") =>
  TITLE_EFFECTS.includes(value) ? value : fallback

/**
 * Determine si une entite est active selon son etat HA.
 */
const isEntityActive = (entityState) => {
  if (!entityState || INACTIVE_STATES.has(entityState.state)) {
    return false
  }
  return Boolean(entityState.state)
}

/**
 * Convertit un token couleur HA ou conserve une couleur CSS brute.
 */
const resolveColorToken = (value, fallback = "") => {
  const color = safeText(value || fallback).trim()
  return COLOR_TOKENS[color] || color
}

/**
 * Valide une taille CSS simple avant de l injecter dans le rendu.
 */
const normalizeCssSize = (value, fallback = "") => {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? `${value}px` : fallback
  }

  const text = safeText(value).trim()
  if (!text) {
    return fallback
  }

  if (/^\d+(?:\.\d+)?$/.test(text)) {
    return `${text}px`
  }

  if (/^\d+(?:\.\d+)?(?:px|rem|em|vh|svh|lvh|dvh|vw|vmin|vmax|%)$/i.test(text)) {
    return text
  }

  if (/^(?:calc|min|max|clamp)\([^;{}<>]+\)$/i.test(text) || /^var\([^;{}<>]+\)$/i.test(text)) {
    return text
  }

  return fallback
}

/**
 * Extrait une hauteur numerique lorsque la valeur est deja en pixels.
 */
const getPixelHeightFromCssSize = (value) => {
  const match = safeText(value).trim().match(/^(\d+(?:\.\d+)?)px$/i)
  return match ? Number(match[1]) : 0
}

/**
 * Transforme les hauteurs vh en pixels stables entre mobile et desktop.
 */
const resolveStableCardHeight = (value, fallback = "") => {
  const normalized = normalizeCssSize(value)
  if (!normalized) {
    return fallback
  }

  const viewportMatch = normalized.match(/^(\d+(?:\.\d+)?)(?:vh|svh|lvh|dvh)$/i)
  if (!viewportMatch) {
    return normalized
  }

  const pixels = (Number(viewportMatch[1]) / 100) * CARD_HEIGHT_VIEWPORT_REFERENCE
  return Number.isFinite(pixels) && pixels > 0 ? `${Math.round(pixels)}px` : fallback
}

/**
 * Traduit les medias HA en URLs servies par Home Assistant.
 */
const getImageServePath = (value) => {
  const text = safeText(value).trim()
  if (!text) {
    return ""
  }

  const imageServeMatch = text.match(/^(\/api\/image\/serve\/[^/]+)\/(?:original|\d+x\d+)$/)
  if (imageServeMatch) {
    return `${imageServeMatch[1]}/original`
  }

  if (text.startsWith("media-source://image_upload/")) {
    const imageId = text.split("/").pop()
    return imageId ? `/api/image/serve/${imageId}/original` : ""
  }

  if (text.startsWith("media-source://media_source/local/")) {
    return `/media/local/${text.slice("media-source://media_source/local/".length)}`
  }

  return ""
}

/**
 * Normalise les valeurs d image venant du YAML ou du picker HA.
 */
const normalizeImageSourceValue = (value) => {
  if (value === undefined || value === null) {
    return ""
  }

  if (typeof value === "string") {
    const text = safeText(value).trim()
    return getImageServePath(text) || text
  }

  if (typeof value !== "object") {
    return ""
  }

  const mediaContentId = value.media_content_id || value.mediaContentId
  const thumbnail = value.metadata?.thumbnail || value.thumbnail
  const direct = value.url || value.path || value.image || mediaContentId
  return getImageServePath(direct) || getImageServePath(thumbnail) || safeText(thumbnail || direct).trim()
}

/**
 * Detecte les URLs que le navigateur peut charger directement.
 */
const isNativeBrowserImageUrl = (value) =>
  /^(?:https?:)?\/\//i.test(value) || /^(?:data|blob):/i.test(value)

/**
 * Valide une configuration d action d entite.
 */
const normalizeActionConfig = (actionConfig, fallbackAction = "more-info") => {
  if (!actionConfig || typeof actionConfig !== "object") {
    return { action: fallbackAction }
  }

  const action = safeText(actionConfig.action) || fallbackAction
  if (!ACTION_OPTIONS.includes(action)) {
    return { action: fallbackAction }
  }

  return {
    ...actionConfig,
    action,
  }
}

/**
 * Formate un nombre avec les helpers HA quand ils existent.
 */
const formatNumber = (hass, value, precision) => {
  const numeric = Number(value)
  if (Number.isNaN(numeric)) {
    return safeText(value)
  }

  const locale = hass?.locale?.language || undefined
  const digits = Number.isFinite(precision) ? precision : 2
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(numeric)
}

/**
 * Choisit le meilleur libelle disponible pour une entite.
 */
const getEntityName = (hass, entityState, fallbackEntityId, entityConfig = {}) => {
  if (entityConfig.name) {
    return safeText(entityConfig.name)
  }

  if (hass?.formatEntityName && entityState) {
    try {
      return hass.formatEntityName(entityState)
    } catch (_error) {
      // Older HA builds or custom frontend bundles may expose a partial formatter.
    }
  }

  return entityState?.attributes?.friendly_name || fallbackEntityId
}

/**
 * Choisit l icone la plus specifique pour une entite.
 */
const getEntityIcon = (hass, entityState, entityConfig = {}) => {
  const entityId = entityConfig.entity || entityState?.entity_id || ""
  const domain = entityId.split(".")[0]
  const registryIcon = hass?.entities?.[entityId]?.icon
  const explicitIcon = entityConfig.icon || entityState?.attributes?.icon || registryIcon

  if (explicitIcon) {
    return explicitIcon
  }

  const state = entityState?.state
  const deviceClass = safeText(entityState?.attributes?.device_class).toLowerCase()

  if (domain === "binary_sensor") {
    const pair = BINARY_SENSOR_DEVICE_CLASS_ICONS[deviceClass]
    if (pair) {
      return state === "on" ? pair[1] : pair[0]
    }
    return state === "on" ? "mdi:checkbox-marked-circle" : "mdi:checkbox-blank-circle-outline"
  }

  if (domain === "sensor") {
    return SENSOR_DEVICE_CLASS_ICONS[deviceClass] || DOMAIN_ICONS.sensor
  }

  if (domain === "cover") {
    return COVER_DEVICE_CLASS_ICONS[deviceClass] || "mdi:window-shutter"
  }

  if (domain === "light") {
    return state === "on" ? "mdi:lightbulb-on" : "mdi:lightbulb"
  }

  if (domain === "switch" || domain === "input_boolean") {
    return state === "on" ? "mdi:toggle-switch" : "mdi:toggle-switch-off"
  }

  if (domain === "lock") {
    return state === "unlocked" ? "mdi:lock-open-variant" : "mdi:lock"
  }

  return DOMAIN_ICONS[domain] || "mdi:checkbox-blank-circle-outline"
}

/**
 * Declenche une navigation Lovelace sans rechargement complet.
 */
const applyNavigation = (path, replace = false) => {
  if (!path) {
    return
  }
  if (replace) {
    history.replaceState(null, "", path)
  } else {
    history.pushState(null, "", path)
  }
  window.dispatchEvent(new Event("location-changed"))
}

/**
 * Emet un evenement compose compatible avec Home Assistant.
 */
const fireCustomEvent = (node, type, detail = {}) => {
  node.dispatchEvent(
    new CustomEvent(type, {
      detail,
      bubbles: true,
      composed: true,
    })
  )
}

/**
 * Execute l action HA demandee par un bouton d entite.
 */
const performAction = (node, hass, entityConfig, actionConfig) => {
  const action = actionConfig?.action || "more-info"

  if (action === "none") {
    return
  }

  if (action === "more-info") {
    if (!entityConfig?.entity) {
      return
    }
    fireCustomEvent(node, "hass-more-info", { entityId: entityConfig.entity })
    return
  }

  if (action === "navigate") {
    applyNavigation(actionConfig.navigation_path, Boolean(actionConfig.navigation_replace))
    return
  }

  if (action === "url") {
    if (actionConfig.url_path) {
      window.open(actionConfig.url_path, "_blank", "noopener,noreferrer")
    }
    return
  }

  if (action === "toggle") {
    if (!entityConfig?.entity) {
      return
    }
    hass.callService("homeassistant", "toggle", {
      entity_id: entityConfig.entity,
    })
    return
  }

  if (action === "call-service") {
    const service = safeText(actionConfig.service)
    if (!service.includes(".")) {
      return
    }
    const [domain, serviceName] = service.split(".")
    hass.callService(domain, serviceName, actionConfig.service_data || {}, actionConfig.target)
    return
  }

  if (action === "fire-dom-event") {
    fireCustomEvent(node, "ll-custom", actionConfig)
  }
}

/**
 * Retrouve les entites associees a une zone HA.
 */
const resolveAreaEntities = (hass, areaId) => {
  if (!hass?.areas || !hass?.entities) {
    return []
  }

  const area = hass.areas[areaId]
  if (!area) {
    return []
  }

  const result = []
  for (const [entityId, metadata] of Object.entries(hass.entities)) {
    if (metadata.hidden || metadata.disabled_by) {
      continue
    }

    if (metadata.entity_category === "diagnostic" || metadata.entity_category === "config") {
      continue
    }

    const deviceArea = metadata.device_id ? hass.devices?.[metadata.device_id]?.area_id : null
    if (metadata.area_id === area.area_id || deviceArea === area.area_id) {
      result.push(entityId)
    }
  }

  return result
}

/**
 * Determine si une entite doit utiliser la couleur d etat HA.
 */
const shouldUseStateColor = (entityConfig, cardConfig) => {
  if (typeof entityConfig.state_color === "boolean") {
    return entityConfig.state_color
  }
  return Boolean(cardConfig.state_color)
}

/**
 * Calcule le texte d etat visible pour une entite.
 */
const getDisplayState = (hass, entityState, entityRegistryItem, entityConfig) => {
  if (entityConfig.display_state !== undefined) {
    return safeText(entityConfig.display_state)
  }

  if (!entityState) {
    return ""
  }

  if (entityConfig.attribute) {
    const raw = entityState.attributes?.[entityConfig.attribute]
    let formatted = raw
    if (hass?.formatEntityAttributeValue) {
      try {
        formatted = hass.formatEntityAttributeValue(entityState, entityConfig.attribute, raw)
      } catch (_error) {
        formatted = raw
      }
    }
    return `${safeText(entityConfig.prefix)}${safeText(formatted)}${safeText(entityConfig.suffix)}`.trim()
  }

  if (UNAVAILABLE_STATES.has(entityState.state)) {
    return entityState.state
  }

  if (hass?.formatEntityState) {
    try {
      return hass.formatEntityState(entityState)
    } catch (_error) {
      // Repli vers le formatage local ci-dessous.
    }
  }

  const unit = safeText(entityState.attributes?.unit_of_measurement)
  const domain = entityState.entity_id.split(".")[0]

  if (SENSOR_DOMAINS.has(domain) || unit) {
    const precision = Number.isFinite(entityRegistryItem?.display_precision)
      ? entityRegistryItem.display_precision
      : undefined
    const formatted = formatNumber(hass, entityState.state, precision)
    return `${formatted}${unit ? ` ${unit}` : ""}`.trim()
  }

  return safeText(entityState.state)
}

/**
 * Element Lovelace principal responsable du rendu de la carte.
 */
class AlphaAreaCard extends HTMLElement {
  /**
   * Retourne l element editeur utilise par Lovelace.
   */
  static getConfigElement() {
    return document.createElement(CARD_EDITOR_TYPE)
  }

  /**
   * Fournit une configuration vierge lors de l ajout de carte.
   */
  static getStubConfig() {
    return {}
  }

  /**
   * Annonce a Lovelace que la carte occupe toute la largeur.
   */
  static getGridOptions() {
    return {
      columns: "full",
      min_columns: 12,
      max_columns: 12,
    }
  }

  /**
   * Indique que la carte ne depend pas d attributs HTML observes.
   */
  static get observedAttributes() {
    return []
  }

  /**
   * Prepare le shadow DOM et les handlers persistants.
   */
  constructor() {
    super()
    this.attachShadow({ mode: "open" })
    // Etat Home Assistant injecte par Lovelace.
    this._hass = null
    // Configuration normalisee utilisee par le rendu.
    this.config = deepClone(DEFAULT_CONFIG)
    // Modele derive de la config et de l etat HA pour eviter de recalculer dans le template.
    this._renderModel = {
      area: null,
      areaEntityIds: [],
      entitiesDialog: [],
      entitiesToggle: [],
      entitiesSensors: [],
      entitiesAlerts: [],
      sensorSummaries: [],
      cameraEntity: "",
    }
    // Signature du dernier rendu, utile pour couper les rerenders identiques.
    this._lastStateSnapshot = ""
    // Timers de tap par entite pour distinguer tap simple et double tap.
    this._entityClickTimers = new Map()
    // Handlers binds une seule fois afin de pouvoir les retirer proprement a chaque rendu.
    this._boundOnEntityClick = this._onEntityClick.bind(this)
    this._boundOnEntityDoubleClick = this._onEntityDoubleClick.bind(this)
    this._boundOnEntityContextMenu = this._onEntityContextMenu.bind(this)
    this._boundOnEntityPointerDown = this._onEntityPointerDown.bind(this)
    this._boundOnEntityPointerEnd = this._onEntityPointerEnd.bind(this)
  }

  /**
   * Normalise la configuration recue avant de la rendre ou l editer.
   */
  setConfig(config) {
    const incoming = pickKnownConfig(config)
    const merged = {
      ...deepClone(DEFAULT_CONFIG),
      ...incoming,
      styles: {
        ...deepClone(DEFAULT_CONFIG.styles),
        ...(incoming.styles || {}),
      },
      entity_defaults: {
        ...deepClone(DEFAULT_CONFIG.entity_defaults),
        ...(incoming.entity_defaults || {}),
      },
    }

    if (merged.entities && !Array.isArray(merged.entities)) {
      throw new Error("Le parametre entities doit etre un tableau.")
    }

    merged.include_domains = Array.isArray(merged.include_domains)
      ? merged.include_domains.map((domain) => safeText(domain).toLowerCase()).filter(Boolean)
      : parseDomainsText(merged.include_domains)

    merged.exclude_domains = Array.isArray(merged.exclude_domains)
      ? merged.exclude_domains.map((domain) => safeText(domain).toLowerCase()).filter(Boolean)
      : parseDomainsText(merged.exclude_domains)

    merged.exclude_entities = normalizeOptionalStringList(merged.exclude_entities)
    merged.sensor_classes = normalizeStringList(
      merged.sensor_classes,
      DEFAULT_SENSOR_CLASSES,
      true
    )
    merged.alert_classes = normalizeStringList(merged.alert_classes, DEFAULT_ALERT_CLASSES, true)
    merged.display_type = normalizeSelect(merged.display_type, DISPLAY_TYPES, "picture")
    merged.features_position = normalizeSelect(
      merged.features_position,
      FEATURE_POSITIONS,
      "bottom"
    )
    merged.features = Array.isArray(merged.features) ? merged.features.filter(Boolean) : []
    merged.camera_entity = safeText(merged.camera_entity)
    merged.image = normalizeImageSourceValue(merged.image)
    merged.height = normalizeCssSize(merged.height)
    merged.styles.border_radius = normalizeCssSize(merged.styles.border_radius, "16px")
    merged.styles.title_font_size = normalizeCssSize(merged.styles.title_font_size, "1.3rem")
    merged.styles.title_effect = normalizeTitleEffect(merged.styles.title_effect, "shadow")
    merged.entity_defaults.position = normalizeEntityPosition(merged.entity_defaults.position, "")
    merged.entity_defaults.display_mode = normalizeEntityDisplayMode(
      merged.entity_defaults.display_mode,
      "button"
    )

    this.config = merged
    this._computeRenderModel()
    this._render()
  }

  /**
   * Recoit l etat Home Assistant et limite les rerenders inutiles.
   */
  set hass(hass) {
    const previous = this._hass
    this._hass = hass

    if (!hass) {
      return
    }

    if (!previous) {
      this._computeRenderModel()
      this._render()
      return
    }

    if (this._shouldRefresh(previous, hass)) {
      this._computeRenderModel()
      this._render()
    }
  }

  /**
   * Expose l etat Home Assistant courant aux helpers internes.
   */
  get hass() {
    return this._hass
  }

  /**
   * Convertit la hauteur configuree en taille approximative de carte.
   */
  getCardSize() {
    return this._getCardRows()
  }

  /**
   * Retourne les options de grille dynamiques de l instance.
   */
  getGridOptions() {
    return {
      columns: "full",
      min_columns: 12,
      max_columns: 12,
    }
  }

  /**
   * Calcule un nombre de lignes indicatif pour les anciennes vues.
   */
  _getCardRows() {
    const configuredHeight = resolveStableCardHeight(this.config?.height)
    const pixelHeight = getPixelHeightFromCssSize(configuredHeight)
    if (pixelHeight) {
      return Math.max(1, Math.ceil(pixelHeight / 50))
    }

    if (this.config?.display_type === "compact") {
      return 2
    }
    if (this.config?.display_type === "icon") {
      return 3
    }
    return 4
  }

  /**
   * Verifie si un changement HA necessite un rerender.
   */
  _shouldRefresh(previousHass, nextHass) {
    if (!nextHass || !previousHass) {
      return true
    }

    if (previousHass.locale !== nextHass.locale || previousHass.themes !== nextHass.themes) {
      return true
    }

    const tracked = [
      ...this._renderModel.entitiesDialog,
      ...this._renderModel.entitiesToggle,
      ...this._renderModel.entitiesSensors,
      ...this._renderModel.entitiesAlerts,
      ...this._renderModel.sensorSummaries,
    ]

    if (this._renderModel.cameraEntity) {
      tracked.push({ entity: this._renderModel.cameraEntity })
    }

    const trackedEntityIds = new Set()
    const addTrackedEntity = (entityId) => {
      const id = safeText(entityId).trim()
      if (!id) {
        return
      }

      trackedEntityIds.add(id)

      const previousMembers = previousHass.states?.[id]?.attributes?.entity_id
      const nextMembers = nextHass.states?.[id]?.attributes?.entity_id
      const memberLists = [previousMembers, nextMembers]
      memberLists.forEach((members) => {
        if (Array.isArray(members)) {
          members.forEach((memberId) => trackedEntityIds.add(memberId))
        }
      })
    }

    for (const entityConfig of tracked) {
      if (Array.isArray(entityConfig.source_entities)) {
        entityConfig.source_entities.forEach((entityId) => addTrackedEntity(entityId))
      } else if (entityConfig.entity) {
        addTrackedEntity(entityConfig.entity)
      }

      const badgeEntityId = this._getEntityBadgeSourceId(entityConfig)
      if (badgeEntityId) {
        addTrackedEntity(badgeEntityId)
      }
    }

    for (const entityId of trackedEntityIds) {
      if (previousHass.states[entityId] !== nextHass.states[entityId]) {
        return true
      }
    }

    const areaId = this.config.area
    if (areaId && previousHass.areas?.[areaId] !== nextHass.areas?.[areaId]) {
      return true
    }

    const needsRegistryRefresh =
      this.config.auto_area_entities ||
      this._hasAreaControlsFeature() ||
      this.config.display_type === "camera" ||
      !Array.isArray(this.config.entities) ||
      this.config.entities.length === 0

    if (
      needsRegistryRefresh &&
      (previousHass.entities !== nextHass.entities ||
        previousHass.devices !== nextHass.devices ||
        previousHass.areas !== nextHass.areas)
    ) {
      return true
    }

    return false
  }

  /**
   * Construit les groupes d entites utilises par le rendu.
   */
  _computeRenderModel() {
    const hass = this._hass
    if (!hass) {
      return
    }

    const areaId = this.config.area
    const area = areaId ? hass.areas?.[areaId] || null : null
    const areaEntityIds = areaId ? resolveAreaEntities(hass, areaId) : []
    const hasExplicitEntities = Array.isArray(this.config.entities) && this.config.entities.length

    const shouldUseAreaEntities = this.config.auto_area_entities || this._hasAreaControlsFeature()
    const configured =
      hasExplicitEntities
        ? this.config.entities
        : shouldUseAreaEntities
          ? areaEntityIds
          : []

    const includeDomains = new Set(
      (this.config.include_domains || []).map((domain) => safeText(domain))
    )
    const excludeDomains = new Set(
      (this.config.exclude_domains || []).map((domain) => safeText(domain))
    )
    const excludedEntities = new Set(this.config.exclude_entities || [])
    const sensorClasses = new Set(this.config.sensor_classes || [])
    const alertClasses = new Set(this.config.alert_classes || [])
    const autoAreaSource = !hasExplicitEntities && Boolean(shouldUseAreaEntities)
    const hasAreaControlsFeature = this._hasAreaControlsFeature()
    const areaControls = this._getAreaControls()

    let parsedEntities = configured
      .map(parseEntityConfig)
      .filter(Boolean)
      .filter((item) => item.entity)
      .filter((item) => !excludedEntities.has(item.entity))

    if (includeDomains.size) {
      parsedEntities = parsedEntities.filter((item) => {
        const domain = safeText(item.entity).split(".")[0]
        return includeDomains.has(domain)
      })
    }

    if (excludeDomains.size) {
      parsedEntities = parsedEntities.filter((item) => {
        const domain = safeText(item.entity).split(".")[0]
        return !excludeDomains.has(domain)
      })
    }

    if (this.config.entity_sort === "name") {
      parsedEntities.sort((left, right) => {
        const leftName = getEntityName(
          hass,
          hass.states?.[left.entity],
          left.entity,
          left
        ).toLowerCase()
        const rightName = getEntityName(
          hass,
          hass.states?.[right.entity],
          right.entity,
          right
        ).toLowerCase()
        return leftName.localeCompare(rightName)
      })
    }

    if (this.config.entity_sort === "domain") {
      parsedEntities.sort((left, right) => {
        const leftDomain = left.entity.split(".")[0]
        const rightDomain = right.entity.split(".")[0]
        if (leftDomain === rightDomain) {
          return left.entity.localeCompare(right.entity)
        }
        return leftDomain.localeCompare(rightDomain)
      })
    }

    const maxEntities = Number(this.config.max_entities) || 0
    if (maxEntities > 0) {
      parsedEntities = parsedEntities.slice(0, maxEntities)
    }

    const entitiesDialog = []
    const entitiesToggle = []
    const entitiesSensors = []
    const entitiesAlerts = []
    const sensorCandidates = []

    for (const entityConfig of parsedEntities) {
      const domain = entityConfig.entity.split(".")[0]
      const entityState = hass.states?.[entityConfig.entity]
      const deviceClass = safeText(entityState?.attributes?.device_class).toLowerCase()

      if (autoAreaSource && domain === "camera" && this.config.display_type === "camera") {
        continue
      }

      if (autoAreaSource && domain === "binary_sensor" && alertClasses.has(deviceClass)) {
        if (entityState?.state === "on") {
          entitiesAlerts.push(entityConfig)
        }
        continue
      }

      if (autoAreaSource && domain === "sensor" && sensorClasses.has(deviceClass)) {
        sensorCandidates.push(entityConfig)
        continue
      }

      if (SENSOR_DOMAINS.has(domain) || entityConfig.attribute) {
        entitiesSensors.push(entityConfig)
        continue
      }

      const areaControlConfig = hasAreaControlsFeature
        ? this._getAreaControlConfig(entityConfig, domain, areaControls)
        : null

      if (
        !this.config.force_dialog &&
        ((!hasAreaControlsFeature && TOGGLE_DOMAINS.has(domain)) || areaControlConfig)
      ) {
        entitiesToggle.push(
          areaControlConfig && typeof areaControlConfig === "object"
            ? {
                ...entityConfig,
                ...areaControlConfig,
                entity: areaControlConfig.entity_id || entityConfig.entity,
              }
            : entityConfig
        )
        continue
      }

      entitiesDialog.push(entityConfig)
    }

    this._renderModel = {
      area,
      areaEntityIds,
      entitiesDialog,
      entitiesToggle,
      entitiesSensors,
      entitiesAlerts,
      sensorSummaries: this._buildSensorSummaries(sensorCandidates),
      cameraEntity: this._resolveCameraEntity(areaEntityIds, parsedEntities),
    }
  }

  /**
   * Detecte la presence d une feature area-controls.
   */
  _hasAreaControlsFeature() {
    return (this.config.features || []).some((feature) => {
      const type = typeof feature === "string" ? feature : feature?.type
      return AREA_CONTROL_FEATURE_TYPES.has(safeText(type))
    })
  }

  /**
   * Lit la liste des controles declares dans les features.
   */
  _getAreaControls() {
    const feature = (this.config.features || []).find((item) => {
      const type = typeof item === "string" ? item : item?.type
      return AREA_CONTROL_FEATURE_TYPES.has(safeText(type))
    })
    return Array.isArray(feature?.controls) ? feature.controls : []
  }

  /**
   * Associe une entite a un controle area-controls si possible.
   */
  _getAreaControlConfig(entityConfig, domain, controls) {
    if (!controls.length) {
      return TOGGLE_DOMAINS.has(domain)
    }

    for (const control of controls) {
      if (typeof control === "string" && control === domain) {
        return true
      }

      if (control?.entity_id === entityConfig.entity) {
        return {
          ...control,
          entity: control.entity_id,
        }
      }
    }

    return false
  }

  /**
   * Choisit la camera a utiliser en mode camera.
   */
  _resolveCameraEntity(areaEntityIds, parsedEntities) {
    const configured = safeText(this.config.camera_entity)
    if (configured.startsWith("camera.")) {
      return configured
    }

    const explicitCamera = parsedEntities.find((entityConfig) =>
      safeText(entityConfig.entity).startsWith("camera.")
    )
    if (explicitCamera) {
      return explicitCamera.entity
    }

    return areaEntityIds.find((entityId) => entityId.startsWith("camera.")) || ""
  }

  /**
   * Regroupe les capteurs similaires en resumes compacts.
   */
  _buildSensorSummaries(sensorCandidates) {
    const groups = new Map()

    for (const entityConfig of sensorCandidates) {
      const entityState = this._hass?.states?.[entityConfig.entity]
      if (!entityState) {
        continue
      }

      if (UNAVAILABLE_STATES.has(entityState.state)) {
        continue
      }

      const numeric = Number(entityState.state)
      if (!Number.isFinite(numeric)) {
        continue
      }

      const deviceClass = safeText(entityState.attributes?.device_class).toLowerCase()
      const unit = safeText(entityState.attributes?.unit_of_measurement)
      const key = `${deviceClass}|${unit}`
      const group = groups.get(key) || {
        deviceClass,
        unit,
        values: [],
        entities: [],
      }

      group.values.push(numeric)
      group.entities.push(entityConfig)
      groups.set(key, group)
    }

    return [...groups.values()].map((group) => {
      const values = [...group.values].sort((left, right) => left - right)
      const isSum = SUM_SENSOR_CLASSES.has(group.deviceClass)
      const raw = isSum
        ? values.reduce((sum, value) => sum + value, 0)
        : values[Math.floor(values.length / 2)]
      const firstEntity = group.entities[0]
      const registryItem = this._hass?.entities?.[firstEntity.entity]
      const precision = Number.isFinite(registryItem?.display_precision)
        ? registryItem.display_precision
        : Number.isInteger(raw)
          ? 0
          : 1

      return {
        entity: firstEntity.entity,
        icon: this._getSensorClassIcon(group.deviceClass),
        name: this._formatDeviceClassLabel(group.deviceClass),
        source_entities: group.entities.map((entityConfig) => entityConfig.entity),
        display_state: `${formatNumber(this._hass, raw, precision)}${group.unit ? ` ${group.unit}` : ""}`,
      }
    })
  }

  /**
   * Retourne l icone par defaut d une classe de capteur.
   */
  _getSensorClassIcon(deviceClass) {
    return SENSOR_DEVICE_CLASS_ICONS[deviceClass] || "mdi:gauge"
  }

  /**
   * Transforme une device_class en libelle lisible.
   */
  _formatDeviceClassLabel(deviceClass) {
    const labels = {
      apparent_power: "Puissance apparente",
      battery: "Batterie",
      carbon_dioxide: "CO2",
      carbon_monoxide: "CO",
      current: "Intensite",
      energy: "Energie",
      gas: "Gaz",
      humidity: "Humidite",
      illuminance: "Luminosite",
      monetary: "Cout",
      power: "Puissance",
      pressure: "Pression",
      temperature: "Temperature",
      voltage: "Tension",
      water: "Eau",
    }
    return labels[deviceClass] || safeText(deviceClass).replace(/_/g, " ")
  }

  /**
   * Determine l image de fond selon le mode courant.
   */
  _getBackgroundImage() {
    const hass = this._hass
    if (!hass) {
      return ""
    }

    if (this.config.display_type === "camera") {
      return this._getCameraImageUrl(this._renderModel.cameraEntity)
    }

    if (this.config.display_type !== "picture") {
      return ""
    }

    const explicitImage = normalizeImageSourceValue(this.config.image)
    const areaPicture = this._renderModel.area?.picture
    const selected = explicitImage || areaPicture

    if (!selected) {
      return ""
    }

    return this._resolveImageUrl(selected)
  }

  /**
   * Prepare une URL image stable pour navigateur et application mobile.
   */
  _resolveImageUrl(value) {
    const selected = normalizeImageSourceValue(value)
    if (!selected) {
      return ""
    }

    if (selected.startsWith("/") || isNativeBrowserImageUrl(selected)) {
      return selected
    }

    try {
      return new URL(selected, window.location.href).toString()
    } catch (_error) {
      return selected
    }
  }

  /**
   * Construit l URL camera_proxy relative pour Home Assistant.
   */
  _getCameraImageUrl(entityId) {
    if (!entityId) {
      return ""
    }

    const cameraState = this._hass?.states?.[entityId]
    const cacheKey = encodeURIComponent(cameraState?.last_updated || cameraState?.last_changed || "")
    return `/api/camera_proxy/${entityId}?t=${cacheKey}`
  }

  /**
   * Choisit l icone de la carte ou de la zone.
   */
  _getAreaIcon() {
    return this.config.icon || this._renderModel.area?.icon || "mdi:home-map-marker"
  }

  /**
   * Convertit le ratio configure en syntaxe CSS aspect-ratio.
   */
  _getAspectRatioCss() {
    const value = safeText(this.config.aspect_ratio || "16:9").trim()
    if (!value) {
      return "16 / 9"
    }

    if (/^\d+(\.\d+)?%$/.test(value)) {
      const numeric = Number(value.replace("%", ""))
      return Number.isFinite(numeric) && numeric > 0 ? `100 / ${numeric}` : "16 / 9"
    }

    const ratioMatch = value.match(/^(\d+(?:\.\d+)?)(?:\s*[:x]\s*(\d+(?:\.\d+)?))?$/i)
    if (!ratioMatch) {
      return "16 / 9"
    }

    const width = Number(ratioMatch[1])
    const height = Number(ratioMatch[2] || 1)
    return width > 0 && height > 0 ? `${width} / ${height}` : "16 / 9"
  }

  /**
   * Prepare le filtre image en limitant les cas fragiles sur iOS.
   */
  _getImageFilter(styles = {}) {
    const blur = normalizeCssSize(styles.image_blur, "0px")
    if (!blur || /^0(?:\.0+)?(?:px|rem|em|vh|svh|lvh|dvh|vw|vmin|vmax|%)?$/i.test(blur)) {
      return "none"
    }
    return `blur(${blur})`
  }

  /**
   * Calcule l overlay d assombrissement applique au-dessus de l image.
   */
  _getOverlayBackground() {
    const value = this.config.darken_image
    const strength =
      typeof value === "number"
        ? Math.max(0, Math.min(0.82, value))
        : value
          ? 0.58
          : 0.16
    const top = Math.max(0.02, strength * 0.15).toFixed(2)
    const bottom = strength.toFixed(2)

    return `linear-gradient(180deg, rgba(15, 23, 42, ${top}) 0%, rgba(15, 23, 42, ${bottom}) 82%)`
  }

  /**
   * Bloque la propagation pour garder le focus sur le bouton d entite.
   */
  _stopEntityEvent(event) {
    event.stopPropagation()
    event.stopImmediatePropagation?.()
  }

  /**
   * Active l etat visuel appuye du bouton d entite.
   */
  _onEntityPointerDown(event) {
    this._stopEntityEvent(event)
    event.currentTarget?.focus?.({ preventScroll: true })
    event.currentTarget?.classList?.add("is-pressing")
  }

  /**
   * Retire l etat appuye du bouton d entite.
   */
  _onEntityPointerEnd(event) {
    this._stopEntityEvent(event)
    event.currentTarget?.classList?.remove("is-pressing")
  }

  /**
   * Execute le tap simple apres avoir laisse passer un double tap potentiel.
   */
  _onEntityClick(event) {
    this._stopEntityEvent(event)

    if (!this._hass) {
      return
    }

    const entityId = event.currentTarget?.dataset?.entityId
    if (!entityId) {
      return
    }

    const config = this._findEntityConfig(entityId)
    if (!config) {
      return
    }

    const timer = this._entityClickTimers.get(entityId)
    if (timer) {
      clearTimeout(timer)
    }

    const nextTimer = window.setTimeout(() => {
      this._runEntityAction(config, "tap_action")
      this._entityClickTimers.delete(entityId)
    }, 220)

    this._entityClickTimers.set(entityId, nextTimer)
  }

  /**
   * Execute l action double tap de l entite.
   */
  _onEntityDoubleClick(event) {
    this._stopEntityEvent(event)
    event.preventDefault()

    const entityId = event.currentTarget?.dataset?.entityId
    if (!entityId) {
      return
    }

    const timer = this._entityClickTimers.get(entityId)
    if (timer) {
      clearTimeout(timer)
      this._entityClickTimers.delete(entityId)
    }

    const config = this._findEntityConfig(entityId)
    if (!config) {
      return
    }

    this._runEntityAction(config, "double_tap_action")
  }

  /**
   * Execute l action hold ou clic droit de l entite.
   */
  _onEntityContextMenu(event) {
    this._stopEntityEvent(event)
    event.preventDefault()

    const entityId = event.currentTarget?.dataset?.entityId
    if (!entityId) {
      return
    }

    const timer = this._entityClickTimers.get(entityId)
    if (timer) {
      clearTimeout(timer)
      this._entityClickTimers.delete(entityId)
    }

    const config = this._findEntityConfig(entityId)
    if (!config) {
      return
    }

    this._runEntityAction(config, "hold_action")
  }

  /**
   * Retrouve la configuration rendue pour une entite.
   */
  _findEntityConfig(entityId) {
    const list = [
      ...this._renderModel.entitiesDialog,
      ...this._renderModel.entitiesToggle,
      ...this._renderModel.entitiesSensors,
      ...this._renderModel.entitiesAlerts,
      ...this._renderModel.sensorSummaries,
    ]
    return list.find((item) => item.entity === entityId)
  }

  /**
   * Fournit l action par defaut d une entite.
   */
  _defaultEntityAction(entityConfig, actionKey) {
    const entityId = entityConfig?.entity || ""
    const domain = entityId.split(".")[0]

    if (actionKey === "tap_action") {
      return this._renderModel.entitiesToggle.includes(entityConfig) && TOGGLE_DOMAINS.has(domain)
        ? { action: "toggle" }
        : { action: "more-info" }
    }

    if (actionKey === "hold_action") {
      return { action: "more-info" }
    }

    if (actionKey === "double_tap_action") {
      return { action: "none" }
    }

    return { action: "none" }
  }

  /**
   * Normalise puis execute l action d une entite.
   */
  _runEntityAction(entityConfig, actionKey) {
    if (!this._hass || !entityConfig) {
      return
    }

    const defaultAction = this._defaultEntityAction(entityConfig, actionKey)
    const selectedAction = entityConfig[actionKey] || defaultAction
    const fallbackAction = actionKey === "tap_action" ? "more-info" : "none"
    const normalized = normalizeActionConfig(selectedAction, fallbackAction)

    performAction(this, this._hass, entityConfig, normalized)
  }

  /**
   * Assemble les options visuelles finales d une entite.
   */
  _getEntityPresentation(entityConfig, asSensorLine = false) {
    const defaults = this.config.entity_defaults || DEFAULT_CONFIG.entity_defaults
    const styles = this.config.styles || STYLE_DEFAULTS
    const displayMode = normalizeEntityDisplayMode(
      entityConfig.display_mode || entityConfig.display || defaults.display_mode,
      asSensorLine ? "button" : "button"
    )

    const showName =
      typeof entityConfig.show_name === "boolean"
        ? entityConfig.show_name
        : typeof defaults.show_name === "boolean"
          ? defaults.show_name
          : asSensorLine

    const showState =
      typeof entityConfig.show_state === "boolean"
        ? entityConfig.show_state
        : typeof defaults.show_state === "boolean"
          ? defaults.show_state
          : asSensorLine

    return {
      displayMode,
      showName: asSensorLine || showName,
      showState: asSensorLine || showState,
      text: entityConfig.text || defaults.text || "",
      icon: entityConfig.icon || defaults.icon || "",
      iconOn: entityConfig.icon_on || defaults.icon_on || "",
      iconOff: entityConfig.icon_off || defaults.icon_off || "",
      iconColorOn:
        entityConfig.icon_color_on || defaults.icon_color_on || styles.button_icon_color_on,
      iconColorOff:
        entityConfig.icon_color_off || defaults.icon_color_off || styles.button_icon_color_off,
      textColorOn:
        entityConfig.text_color_on ||
        defaults.text_color_on ||
        entityConfig.icon_color_on ||
        defaults.icon_color_on ||
        styles.button_icon_color_on,
      textColorOff:
        entityConfig.text_color_off ||
        defaults.text_color_off ||
        entityConfig.icon_color_off ||
        defaults.icon_color_off ||
        styles.button_icon_color_off,
      backgroundColorOn:
        entityConfig.background_color_on ||
        entityConfig.button_color_on ||
        defaults.background_color_on,
      backgroundColorOff:
        entityConfig.background_color_off ||
        entityConfig.button_color_off ||
        defaults.background_color_off,
    }
  }

  /**
   * Transforme la presentation d entite en variables CSS inline.
   */
  _getEntityButtonStyle(presentation) {
    const vars = {
      "--mac-entity-icon-color-on": resolveColorToken(presentation.iconColorOn),
      "--mac-entity-icon-color-off": resolveColorToken(presentation.iconColorOff),
      "--mac-entity-text-color-on": resolveColorToken(presentation.textColorOn),
      "--mac-entity-text-color-off": resolveColorToken(presentation.textColorOff),
      "--mac-entity-background-on": resolveColorToken(presentation.backgroundColorOn),
      "--mac-entity-background-off": resolveColorToken(presentation.backgroundColorOff),
    }

    return Object.entries(vars)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([name, value]) => `${name}: ${value};`)
      .join(" ")
  }

  /**
   * Calcule la position finale d une entite.
   */
  _getEntityPosition(entityConfig, fallbackPosition) {
    const defaultPosition = this.config.entity_defaults?.position
    return normalizeEntityPosition(entityConfig.position || defaultPosition, fallbackPosition)
  }

  /**
   * Prepare les groupes de rendu pour chaque position disponible.
   */
  _makePositionBuckets() {
    return ENTITY_POSITIONS.reduce((buckets, position) => {
      buckets[position] = []
      return buckets
    }, {})
  }

  /**
   * Rend les boutons d une position donnee.
   */
  _renderPositionZone(buckets, position) {
    return `<div class=\"entity-zone zone-${position}\">${buckets[position].join("")}</div>`
  }

  /**
   * Rend un bouton, texte ou icone d entite.
   */
  _renderEntityButton(entityConfig, asSensorLine = false) {
    const hass = this._hass
    const entityState = hass?.states?.[entityConfig.entity]

    if (!entityState && this.config.hide_unavailable) {
      return ""
    }

    if (entityState && UNAVAILABLE_STATES.has(entityState.state) && this.config.hide_unavailable) {
      return ""
    }

    const presentation = this._getEntityPresentation(entityConfig, asSensorLine)
    const isOn = isEntityActive(entityState)
    const iconConfig = {
      ...entityConfig,
      icon:
        (isOn ? presentation.iconOn : presentation.iconOff) ||
        presentation.icon ||
        entityConfig.icon,
    }
    const icon = getEntityIcon(hass, entityState, iconConfig)
    const name = getEntityName(hass, entityState, entityConfig.entity, entityConfig)
    const displayState = getDisplayState(
      hass,
      entityState,
      hass?.entities?.[entityConfig.entity],
      entityConfig
    )
    const title = displayState ? `${name}: ${displayState}` : name
    const displayMode = presentation.displayMode
    const labelText = presentation.text || (presentation.showName || displayMode === "text" ? name : "")
    const buttonStyle = this._getEntityButtonStyle(presentation)

    const stateColorAttr = shouldUseStateColor(entityConfig, this.config)
      ? ' data-state-color="1"'
      : ""
    const sensorHtml = presentation.showState && displayState
      ? `<span class=\"sensor-value\">${escapeHtml(displayState)}</span>`
      : ""

    const badgeHtml = this._renderEntityBadge(entityConfig, displayState)

    return `
      <button type=\"button\" class=\"entity entity--${displayMode} ${asSensorLine ? "sensor" : "action"} ${entityConfig.alert ? "alert" : ""} ${isOn ? "is-on" : ""}\" data-entity-id=\"${escapeAttribute(entityConfig.entity)}\" title=\"${escapeAttribute(title)}\" style=\"${escapeAttribute(buttonStyle)}\"${stateColorAttr}>
        <ha-icon icon=\"${escapeAttribute(icon)}\" class=\"entity-icon\"></ha-icon>
        ${labelText ? `<span class=\"entity-label\">${escapeHtml(labelText)}</span>` : ""}
        ${sensorHtml}
        ${badgeHtml}
      </button>
    `
  }

  /**
   * Lit les options badge imbriquees dans entity.badge.
   */
  _getNestedBadgeConfig(entityConfig = {}) {
    const rawBadge = entityConfig.badge
    return rawBadge && typeof rawBadge === "object" ? rawBadge : {}
  }

  /**
   * Choisit l entite source du badge.
   */
  _getEntityBadgeSourceId(entityConfig = {}) {
    const nested = this._getNestedBadgeConfig(entityConfig)
    return safeText(
      nested.entity || nested.entity_id || nested.source_entity || entityConfig.badge_entity || entityConfig.entity
    ).trim()
  }

  /**
   * Compte les membres actifs d un groupe utilise en badge.
   */
  _getBadgeMemberCount(entityId) {
    const state = this._hass?.states?.[entityId]
    const members = state?.attributes?.entity_id
    if (!Array.isArray(members) || members.length === 0) {
      return null
    }

    return members.reduce((count, memberId) => {
      return this._hass?.states?.[memberId]?.state === "on" ? count + 1 : count
    }, 0)
  }

  /**
   * Extrait une valeur numerique exploitable par le badge.
   */
  _getBadgeNumericValue(entityId, text = "") {
    const memberCount = this._getBadgeMemberCount(entityId)
    if (memberCount !== null) {
      return memberCount
    }

    const sourceState = this._hass?.states?.[entityId]
    const rawState = safeText(sourceState?.state).trim()
    if (rawState) {
      const stateValue = Number(rawState.replace(",", "."))
      if (Number.isFinite(stateValue)) {
        return stateValue
      }
    }

    const rawText = safeText(text).trim()
    if (rawText) {
      const textValue = Number(rawText.replace(",", "."))
      if (Number.isFinite(textValue)) {
        return textValue
      }
    }

    return null
  }

  /**
   * Formate l etat de l entite source du badge.
   */
  _getBadgeDisplayState(entityId) {
    const sourceState = this._hass?.states?.[entityId]
    if (!sourceState) {
      return ""
    }

    return getDisplayState(this._hass, sourceState, this._hass?.entities?.[entityId], {
      entity: entityId,
    })
  }

  /**
   * Calcule le contenu, la visibilite et le style d un badge.
   */
  _getEntityBadgeConfig(entityConfig, displayState) {
    const rawBadge = entityConfig.badge
    if (rawBadge === false || rawBadge?.enabled === false) {
      return null
    }

    const nested = this._getNestedBadgeConfig(entityConfig)
    const pickText = (...values) => {
      for (const value of values) {
        const text = safeText(value).trim()
        if (text) {
          return text
        }
      }
      return ""
    }

    const sourceEntityId = this._getEntityBadgeSourceId(entityConfig)
    const sourceState = this._hass?.states?.[sourceEntityId]
    const mode = normalizeEntityBadgeMode(nested.mode || entityConfig.badge_mode)
    const showWhen = normalizeEntityBadgeShowWhen(
      nested.show_when || nested.showWhen || entityConfig.badge_show_when
    )
    const expectedState = pickText(nested.state, nested.show_state, entityConfig.badge_state)
    const flatBadgeKeys = [
      "badge_entity",
      "badge_mode",
      "badge_show_when",
      "badge_state",
      "badge_text",
      "badge_icon",
      "badge_color",
      "badge_background",
      "badge_border_color",
      "badge_position",
    ]
    const hasCustomBadge =
      rawBadge === true ||
      Object.keys(nested).length > 0 ||
      flatBadgeKeys.some((key) => entityConfig[key] !== undefined && entityConfig[key] !== "")

    const memberCount = this._getBadgeMemberCount(sourceEntityId)
    const numericValue = this._getBadgeNumericValue(sourceEntityId)
    const sourceIsDifferent = Boolean(sourceEntityId && sourceEntityId !== entityConfig.entity)
    let text = pickText(nested.text, entityConfig.badge_text)

    if (!text) {
      if (mode === "count_on") {
        text = numericValue !== null ? safeText(numericValue) : ""
      } else if (mode === "auto" && memberCount !== null) {
        text = memberCount > 0 ? safeText(memberCount) : ""
      } else if (mode === "state" || (mode === "auto" && sourceIsDifferent)) {
        text = this._getBadgeDisplayState(sourceEntityId)
      } else if (rawBadge === true) {
        text = displayState
      }
    }

    const icon = pickText(nested.icon, entityConfig.badge_icon)

    if (!hasCustomBadge && !text && !icon) {
      return null
    }

    const sourceIsVisible = (() => {
      if (showWhen === "always") {
        return true
      }
      if (showWhen === "state") {
        return expectedState ? safeText(sourceState?.state) === expectedState : false
      }
      if (showWhen === "on") {
        return sourceState?.state === "on"
      }
      if (showWhen === "active") {
        return isEntityActive(sourceState)
      }
      if (showWhen === "nonzero") {
        const value = this._getBadgeNumericValue(sourceEntityId, text)
        return value !== null && value > 0
      }
      if (mode === "text") {
        return Boolean(text || icon)
      }
      if (mode === "count_on" || memberCount !== null) {
        const value = this._getBadgeNumericValue(sourceEntityId, text)
        return value !== null && value > 0
      }
      if (sourceIsDifferent) {
        const value = this._getBadgeNumericValue(sourceEntityId, text)
        return value !== null ? value > 0 : isEntityActive(sourceState)
      }
      return Boolean(text || icon)
    })()

    if (!sourceIsVisible || (!text && !icon)) {
      return null
    }

    const vars = {
      "--mac-entity-badge-color": resolveColorToken(
        nested.color || entityConfig.badge_color || "var(--mac-badge-text-color)"
      ),
      "--mac-entity-badge-background": resolveColorToken(
        nested.background ||
          entityConfig.badge_background ||
          entityConfig.badge_color_on ||
          "var(--mac-badge-background)"
      ),
      "--mac-entity-badge-border-color": resolveColorToken(
        nested.border_color || entityConfig.badge_border_color || "rgba(255, 255, 255, 0.28)"
      ),
    }

    return {
      text,
      icon,
      position: normalizeEntityBadgePosition(nested.position || entityConfig.badge_position),
      style: Object.entries(vars)
        .filter(([, value]) => value !== undefined && value !== null && value !== "")
        .map(([name, value]) => `${name}: ${value};`)
        .join(" "),
    }
  }

  /**
   * Rend le HTML du badge d entite.
   */
  _renderEntityBadge(entityConfig, displayState) {
    const badge = this._getEntityBadgeConfig(entityConfig, displayState)
    if (!badge) {
      return ""
    }

    return `
      <span class=\"entity-badge badge-${badge.position}\" style=\"${escapeAttribute(badge.style)}\">
        ${badge.icon ? `<ha-icon class=\"entity-badge-icon\" icon=\"${escapeAttribute(badge.icon)}\"></ha-icon>` : ""}
        ${badge.text ? `<span>${escapeHtml(badge.text)}</span>` : ""}
      </span>
    `
  }

  /**
   * Construit les variables CSS globales de la carte.
   */
  _computeCardCssVariables() {
    const styles = this.config.styles || {}
    const vars = {
      "--mac-accent-color": resolveColorToken(this.config.color, styles.button_icon_color_on),
      "--mac-button-icon-color-on": styles.button_icon_color_on,
      "--mac-button-icon-color-off": styles.button_icon_color_off,
      "--mac-badge-text-color": styles.badge_text_color,
      "--mac-button-light-color-on": styles.button_light_color_on,
      "--mac-badge-background": styles.badge_background,
      "--mac-title-color": styles.title_color,
      "--mac-title-effect": styles.title_effect,
      "--mac-title-font-size": normalizeCssSize(styles.title_font_size, "1.3rem"),
      "--mac-title-font-weight": styles.title_font_weight,
      "--mac-title-text-transform": styles.title_text_transform,
      "--mac-title-text-shadow": styles.title_text_shadow,
      "--mac-image-blur": styles.image_blur,
      "--mac-card-border-radius": normalizeCssSize(styles.border_radius, "16px"),
    }

    return Object.entries(vars)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([name, value]) => `${name}: ${value};`)
      .join(" ")
  }

  /**
   * Determine l ombre de texte finale du titre.
   */
  _getTitleTextShadow(styles) {
    const customShadow = safeText(styles.title_text_shadow).trim()
    if (customShadow) {
      return customShadow
    }

    switch (normalizeTitleEffect(styles.title_effect, "shadow")) {
      case "neon":
        return "0 0 5px var(--mac-title-color), 0 0 18px var(--mac-accent-color)"
      case "outline":
        return "0 1px 0 rgba(0, 0, 0, 0.75), 1px 0 0 rgba(0, 0, 0, 0.75), -1px 0 0 rgba(0, 0, 0, 0.75), 0 -1px 0 rgba(0, 0, 0, 0.75)"
      case "shadow":
        return "0 1px 3px rgba(0, 0, 0, 0.55)"
      default:
        return "none"
    }
  }

  /**
   * Produit le HTML/CSS final de la carte.
   */
  _render() {
    if (!this.shadowRoot || !this._hass || !this.config) {
      return
    }

    const displayType = this.config.display_type || "picture"
    const compact = displayType === "compact"
    const areaName = this._renderModel.area?.name || this.config.area || ""
    const title = this.config.title || areaName || "Selectionner une zone"
    const backgroundImage = this._getBackgroundImage()
    const areaIcon = this._getAreaIcon()
    const aspectRatio = this._getAspectRatioCss()
    const configuredHeight = resolveStableCardHeight(this.config.height)
    const defaultHeight = compact ? "112px" : displayType === "icon" ? "140px" : "180px"
    const cardHeight = configuredHeight || defaultHeight
    const fixedHeight = Boolean(configuredHeight)
    const styles = this.config.styles || {}
    const imageFilter = this._getImageFilter(styles)
    const overlayBackground = this._getOverlayBackground()
    const entityBuckets = this._makePositionBuckets()
    const addEntity = (entity, asSensorLine, fallbackPosition) => {
      const position = this._getEntityPosition(entity, fallbackPosition)
      const rendered = this._renderEntityButton(entity, asSensorLine)
      if (rendered) {
        entityBuckets[position].push(rendered)
      }
    }

    this._renderModel.sensorSummaries.forEach((entity) => addEntity(entity, true, "top-left"))
    this._renderModel.entitiesSensors.forEach((entity) => addEntity(entity, true, "top-left"))
    this._renderModel.entitiesAlerts.forEach((entity) =>
      addEntity({ ...entity, alert: true }, false, "title-right")
    )

    this._renderModel.entitiesDialog
      .filter((entity) => entity.entity.startsWith("media_player."))
      .forEach((entity) => addEntity(entity, false, "bottom-left"))

    this._renderModel.entitiesDialog
      .filter((entity) => !entity.entity.startsWith("media_player."))
      .forEach((entity) => addEntity(entity, false, "bottom-right"))

    this._renderModel.entitiesToggle.forEach((entity, index) => {
      const fallbackPosition =
        this.config.features_position === "inline" && index === 0 ? "title-right" : "bottom-right"
      addEntity(entity, false, fallbackPosition)
    })

    const topZones = ["top-left", "top-center", "top-right"]
    const bottomZones = ["bottom-left", "bottom-center", "bottom-right"]
    const hasTopZones = topZones.some((position) => entityBuckets[position].length)
    const hasBottomZones = bottomZones.some((position) => entityBuckets[position].length)
    const hasTitleRight = entityBuckets["title-right"].length > 0
    const entitySnapshot = ENTITY_POSITIONS.map(
      (position) => `${position}:${entityBuckets[position].join("")}`
    ).join("|")

    const stateSnapshot = JSON.stringify({
      title,
      displayType,
      backgroundImage,
      areaIcon,
      aspectRatio,
      cardHeight,
      fixedHeight,
      imageFilter,
      overlayBackground,
      entitySnapshot,
      vars: this._computeCardCssVariables(),
      stateColor: Boolean(this.config.state_color),
      shadow: Boolean(this.config.shadow),
      hasTopZones,
      hasBottomZones,
      hasTitleRight,
      styles,
    })

    if (stateSnapshot === this._lastStateSnapshot) {
      return
    }
    this._lastStateSnapshot = stateSnapshot

    const cardStyle = this._computeCardCssVariables()
    const titleTextShadow = this._getTitleTextShadow(styles)
    const titleStyle = `
      ${styles.title_font_weight ? `font-weight:${styles.title_font_weight};` : ""}
      ${styles.title_text_transform ? `text-transform:${styles.title_text_transform};` : ""}
      text-shadow:${titleTextShadow};
    `

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          --mac-accent-color: ${STYLE_DEFAULTS.button_icon_color_on};
          --mac-button-icon-color-on: ${STYLE_DEFAULTS.button_icon_color_on};
          --mac-button-icon-color-off: ${STYLE_DEFAULTS.button_icon_color_off};
          --mac-badge-text-color: ${STYLE_DEFAULTS.badge_text_color};
          --mac-button-light-color-on: ${STYLE_DEFAULTS.button_light_color_on};
          --mac-badge-background: ${STYLE_DEFAULTS.badge_background};
          --mac-title-color: ${STYLE_DEFAULTS.title_color};
          --mac-title-font-size: ${STYLE_DEFAULTS.title_font_size};
          --mac-title-font-weight: ${STYLE_DEFAULTS.title_font_weight};
          --mac-title-text-transform: ${STYLE_DEFAULTS.title_text_transform};
          --mac-title-text-shadow: ${STYLE_DEFAULTS.title_text_shadow};
          --mac-image-blur: ${STYLE_DEFAULTS.image_blur};
          --mac-card-border-radius: ${STYLE_DEFAULTS.border_radius};
          --mac-card-height: ${cardHeight};
          --mac-aspect-ratio: ${aspectRatio};
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          height: var(--mac-card-height);
        }

        ha-card {
          position: relative;
          overflow: hidden;
          width: 100%;
          max-width: 100%;
          min-width: 0;
          box-sizing: border-box;
          border-radius: var(--mac-card-border-radius, var(--ha-card-border-radius, 16px));
          background: var(--card-background-color, #1f2937);
          color: var(--primary-text-color, #f8fafc);
          min-height: var(--mac-card-height);
          max-height: var(--mac-card-height);
          aspect-ratio: auto;
          height: var(--mac-card-height);
          display: flex;
          flex-direction: column;
          justify-content: stretch;
          transition: box-shadow 160ms ease;
          border: 1px solid color-mix(in srgb, var(--divider-color, rgba(148, 163, 184, 0.28)) 70%, transparent);
          ${cardStyle}
        }

        .bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          overflow: hidden;
          border-radius: inherit;
        }

        .bg img {
          display: block;
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: ${imageFilter};
          transform: ${imageFilter === "none" ? "none" : "scale(1.04)"};
        }

        .overlay {
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: inherit;
          background: ${overlayBackground};
        }

        .content {
          position: relative;
          z-index: 1;
          display: grid;
          grid-template-rows: auto auto minmax(0, 1fr) auto;
          gap: 6px;
          padding: 12px 14px;
          height: 100%;
          min-height: 0;
          overflow: hidden;
          box-sizing: border-box;
        }

        .topline {
          display: grid;
          grid-template-columns: minmax(0, 1fr) auto;
          align-items: start;
          gap: 10px;
        }

        .title {
          font-size: var(--mac-title-font-size, 1.3rem);
          letter-spacing: 0;
          font-weight: var(--mac-title-font-weight);
          color: var(--mac-title-color);
          text-transform: var(--mac-title-text-transform);
          text-shadow: var(--mac-title-text-shadow);
          margin: 0;
          min-width: 0;
          overflow-wrap: anywhere;
          ${titleStyle}
        }

        .inline-meta {
          display: ${hasTitleRight ? "flex" : "none"};
          align-items: center;
          justify-content: flex-end;
          gap: 6px;
          flex-wrap: wrap;
        }

        .entity-zones {
          display: grid;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 8px;
          min-width: 0;
          min-height: 0;
          align-items: start;
        }

        .entity-zones.is-empty {
          display: none;
        }

        .bottom-zones {
          align-items: end;
        }

        .content-spacer {
          min-height: 0;
        }

        .entity-zone {
          display: flex;
          align-items: center;
          flex-wrap: wrap;
          gap: 6px;
          min-width: 0;
          min-height: 0;
        }

        .zone-top-left,
        .zone-bottom-left {
          justify-content: flex-start;
        }

        .zone-top-center,
        .zone-bottom-center {
          justify-content: center;
        }

        .zone-top-right,
        .zone-bottom-right,
        .zone-title-right {
          justify-content: flex-end;
        }

        .area-icon {
          position: absolute;
          right: 12px;
          bottom: 8px;
          z-index: 0;
          color: var(--mac-accent-color);
          opacity: ${backgroundImage ? "0.16" : "0.24"};
          --mdc-icon-size: ${compact ? "56px" : "86px"};
          pointer-events: none;
        }

        ha-card.has-background .area-icon {
          color: var(--primary-text-color, #f8fafc);
        }

        .entity {
          position: relative;
          border: 0;
          border-radius: 999px;
          background: var(--mac-entity-background-off, rgba(17, 24, 39, 0.32));
          color: var(--mac-entity-text-color-off, var(--mac-button-icon-color-off));
          display: inline-flex;
          align-items: center;
          gap: 6px;
          min-width: 0;
          max-width: 100%;
          overflow: visible;
          cursor: pointer;
          padding: 6px 8px;
          transition: background 150ms ease, transform 150ms ease, color 150ms ease;
        }

        .entity:hover {
          background: var(--mac-entity-background-hover, rgba(17, 24, 39, 0.48));
        }

        .entity:focus-visible {
          outline: 2px solid var(--mac-accent-color);
          outline-offset: 2px;
        }

        .entity:active,
        .entity.is-pressing {
          transform: scale(0.97);
        }

        .entity.is-pressing {
          background: var(--mac-entity-background-pressed, rgba(17, 24, 39, 0.58));
        }

        .entity.is-on.is-pressing {
          background: var(--mac-entity-background-on, rgba(17, 24, 39, 0.48));
        }

        .entity.is-on {
          color: var(--mac-entity-text-color-on, var(--mac-button-icon-color-on));
          background: var(--mac-entity-background-on, rgba(17, 24, 39, 0.38));
        }

        .entity.is-on[data-state-color="1"] {
          color: var(--state-light-color, var(--mac-button-icon-color-on));
        }

        .entity.is-on[data-state-color="1"] .entity-icon {
          color: var(--state-light-color, var(--mac-button-icon-color-on));
        }

        .entity.sensor {
          border-radius: 12px;
          background: var(--mac-entity-background-off, rgba(2, 6, 23, 0.2));
          padding: 3px 8px;
        }

        .entity.alert {
          color: var(--warning-color, #f59e0b);
          background: rgba(245, 158, 11, 0.18);
        }

        .entity-label {
          font-size: 0.74rem;
          opacity: 0.86;
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .sensor-value {
          font-size: 0.8rem;
          font-weight: 600;
          white-space: nowrap;
        }

        .entity-icon {
          width: 22px;
          height: 22px;
          --mdc-icon-size: 22px;
          color: var(--mac-entity-icon-color-off, currentColor);
          ${this.config.shadow ? "filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4));" : ""}
        }

        .entity.is-on .entity-icon {
          color: var(--mac-entity-icon-color-on, currentColor);
        }

        .entity--text {
          border-radius: 6px;
          background: transparent;
          padding: 2px 0;
        }

        .entity--text:hover,
        .entity--text.is-on {
          background: transparent;
        }

        .entity--text .entity-icon {
          display: none;
        }

        .entity--icon {
          width: 34px;
          height: 34px;
          justify-content: center;
          padding: 6px;
        }

        .entity--icon .entity-label,
        .entity--icon .sensor-value {
          display: none;
        }

        .entity-badge {
          position: absolute;
          top: auto;
          right: auto;
          bottom: auto;
          left: auto;
          min-width: 14px;
          max-width: 30px;
          height: 14px;
          border-radius: 999px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 1px;
          font-size: 9px;
          font-weight: 700;
          padding: 0 3px;
          background: var(--mac-entity-badge-background, var(--mac-badge-background));
          color: var(--mac-entity-badge-color, var(--mac-badge-text-color));
          border: 1px solid var(--mac-entity-badge-border-color, rgba(255, 255, 255, 0.28));
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.36);
          pointer-events: none;
          overflow: hidden;
          text-overflow: ellipsis;
          line-height: 1;
          white-space: nowrap;
        }

        .badge-top-right {
          top: -4px;
          right: -4px;
        }

        .badge-top-left {
          top: -4px;
          left: -4px;
        }

        .badge-bottom-right {
          right: -4px;
          bottom: -4px;
        }

        .badge-bottom-left {
          left: -4px;
          bottom: -4px;
        }

        .entity-badge span {
          min-width: 0;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .entity-badge-icon {
          width: 9px;
          height: 9px;
          --mdc-icon-size: 9px;
        }

        @media (max-width: 600px) {
          .entity {
            padding: 5px 7px;
          }

          .entity-icon {
            width: 20px;
            height: 20px;
            --mdc-icon-size: 20px;
          }

          .sensor-value {
            font-size: 0.75rem;
          }
        }
      </style>

      <ha-card class=\"display-${displayType} ${compact ? "is-compact" : ""} ${fixedHeight ? "has-fixed-height" : ""} ${backgroundImage ? "has-background" : "no-background"}\">
        ${backgroundImage ? `<div class=\"bg\"><img src=\"${escapeAttribute(backgroundImage)}\" alt=\"${escapeAttribute(title)}\"></div><div class=\"overlay\"></div>` : ""}
        <ha-icon class=\"area-icon\" icon=\"${escapeAttribute(areaIcon)}\"></ha-icon>
        <div class=\"content\">
          <div class=\"topline\">
            <h3 class=\"title\">${escapeHtml(title)}</h3>
            <div class=\"inline-meta\">${this._renderPositionZone(entityBuckets, "title-right")}</div>
          </div>
          <div class=\"entity-zones top-zones ${hasTopZones ? "" : "is-empty"}\">
            ${this._renderPositionZone(entityBuckets, "top-left")}
            ${this._renderPositionZone(entityBuckets, "top-center")}
            ${this._renderPositionZone(entityBuckets, "top-right")}
          </div>
          <div class=\"content-spacer\"></div>
          <div class=\"entity-zones bottom-zones ${hasBottomZones ? "" : "is-empty"}\">
            ${this._renderPositionZone(entityBuckets, "bottom-left")}
            ${this._renderPositionZone(entityBuckets, "bottom-center")}
            ${this._renderPositionZone(entityBuckets, "bottom-right")}
          </div>
        </div>
      </ha-card>
    `

    this.shadowRoot.querySelectorAll("button.entity").forEach((button) => {
      button.removeEventListener("click", this._boundOnEntityClick)
      button.removeEventListener("dblclick", this._boundOnEntityDoubleClick)
      button.removeEventListener("contextmenu", this._boundOnEntityContextMenu)
      button.removeEventListener("pointerdown", this._boundOnEntityPointerDown)
      button.removeEventListener("pointerup", this._boundOnEntityPointerEnd)
      button.removeEventListener("pointercancel", this._boundOnEntityPointerEnd)
      button.removeEventListener("pointerleave", this._boundOnEntityPointerEnd)
      button.addEventListener("click", this._boundOnEntityClick)
      button.addEventListener("dblclick", this._boundOnEntityDoubleClick)
      button.addEventListener("contextmenu", this._boundOnEntityContextMenu)
      button.addEventListener("pointerdown", this._boundOnEntityPointerDown)
      button.addEventListener("pointerup", this._boundOnEntityPointerEnd)
      button.addEventListener("pointercancel", this._boundOnEntityPointerEnd)
      button.addEventListener("pointerleave", this._boundOnEntityPointerEnd)
    })
  }
}

/**
 * Editeur visuel Home Assistant pour configurer la carte.
 */
class AlphaAreaCardEditor extends LitElement {
  /**
   * Declare les proprietes reactives de l editeur LitElement.
   */
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
      _jsonErrors: { type: Object },
      _activeEntityTab: { type: String },
      _activeEntityIndex: { type: Number },
    }
  }

  /**
   * Normalise la configuration recue avant de la rendre ou l editer.
   */
  setConfig(config) {
    const incoming = pickKnownConfig(config)
    this.config = {
      ...deepClone(DEFAULT_CONFIG),
      ...incoming,
      styles: {
        ...DEFAULT_CONFIG.styles,
        ...(incoming.styles || {}),
      },
      entity_defaults: {
        ...DEFAULT_CONFIG.entity_defaults,
        ...(incoming.entity_defaults || {}),
      },
    }
    this.config.display_type = normalizeSelect(this.config.display_type, DISPLAY_TYPES, "picture")
    this.config.features_position = normalizeSelect(
      this.config.features_position,
      FEATURE_POSITIONS,
      "bottom"
    )
    this.config.image = normalizeImageSourceValue(this.config.image)
    this.config.height = normalizeCssSize(this.config.height)
    this.config.styles.border_radius = normalizeCssSize(this.config.styles.border_radius, "16px")
    this.config.styles.title_font_size = normalizeCssSize(
      this.config.styles.title_font_size,
      "1.3rem"
    )
    this.config.styles.title_effect = normalizeTitleEffect(this.config.styles.title_effect, "shadow")
    this.config.entity_defaults.position = normalizeEntityPosition(
      this.config.entity_defaults.position,
      ""
    )
    this.config.entity_defaults.display_mode = normalizeEntityDisplayMode(
      this.config.entity_defaults.display_mode,
      "button"
    )
    this._activeEntityTab = this._activeEntityTab || "list"
    this._activeEntityIndex = Number.isInteger(this._activeEntityIndex)
      ? this._activeEntityIndex
      : 0
    this._jsonErrors = {}
  }

  /**
   * Emet la configuration nettoyee vers Lovelace.
   */
  _emit(config) {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._pruneConfig(config) },
        bubbles: true,
        composed: true,
      })
    )
  }

  /**
   * Retire les valeurs par defaut avant sauvegarde YAML.
   */
  _pruneConfig(config) {
    const cleaned = {}

    for (const [key, value] of Object.entries(config || {})) {
      if (!Object.prototype.hasOwnProperty.call(DEFAULT_CONFIG, key)) {
        continue
      }

      if (key === "styles") {
        const styles = this._pruneObject(value, DEFAULT_CONFIG.styles)
        if (Object.keys(styles).length) {
          cleaned.styles = styles
        }
        continue
      }

      if (key === "entity_defaults") {
        const entityDefaults = this._pruneObject(value, DEFAULT_CONFIG.entity_defaults)
        if (Object.keys(entityDefaults).length) {
          cleaned.entity_defaults = entityDefaults
        }
        continue
      }

      if (this._isDefaultValue(value, DEFAULT_CONFIG[key])) {
        continue
      }

      if (value === "" || value === undefined || value === null) {
        continue
      }

      cleaned[key] = value
    }

    return cleaned
  }

  /**
   * Nettoie un objet imbrique en retirant ses valeurs par defaut.
   */
  _pruneObject(value, defaults = {}) {
    const cleaned = {}
    for (const [key, item] of Object.entries(value || {})) {
      if (!this._isDefaultValue(item, defaults[key]) && item !== "" && item !== undefined) {
        cleaned[key] = item
      }
    }
    return cleaned
  }

  /**
   * Compare deux valeurs de configuration serialisables.
   */
  _isDefaultValue(value, defaultValue) {
    return JSON.stringify(value) === JSON.stringify(defaultValue)
  }

  /**
   * Ecrit une valeur dans la config par chemin pointe.
   */
  _setValue(path, value) {
    const updated = structuredClone(this.config)
    const parts = path.split(".")
    let node = updated

    for (let index = 0; index < parts.length - 1; index += 1) {
      const key = parts[index]
      if (!node[key] || typeof node[key] !== "object") node[key] = {}
      node = node[key]
    }

    node[parts[parts.length - 1]] = value
    this.config = updated
    this._emit(updated)
  }

  /**
   * Supprime une valeur dans la config par chemin pointe.
   */
  _removeValue(path) {
    const updated = structuredClone(this.config)
    const parts = path.split(".")
    let node = updated

    for (let index = 0; index < parts.length - 1; index += 1) {
      node = node[parts[index]]
      if (!node) return
    }

    delete node[parts[parts.length - 1]]
    this.config = updated
    this._emit(updated)
  }

  /**
   * Met a jour une valeur texte depuis un champ standard.
   */
  _onInput(path, event) {
    const value = event.target.value
    if (value === "") {
      this._removeValue(path)
      return
    }
    this._setValue(path, value)
  }

  /**
   * Met a jour une valeur booleenne depuis une checkbox.
   */
  _onBoolean(path, event) {
    this._setValue(path, event.target.checked)
  }

  /**
   * Valide puis sauvegarde une taille CSS.
   */
  _onCssSize(path, event) {
    const raw = safeText(event.target.value).trim()
    if (!raw) {
      this._removeValue(path)
      return
    }

    const normalized = normalizeCssSize(raw)
    if (normalized) {
      this._setValue(path, normalized)
    }
  }

  /**
   * Lit une valeur de configuration par chemin pointe.
   */
  _readConfigPath(path) {
    const parts = path.split(".")
    let node = this.config
    for (const part of parts) {
      node = node?.[part]
    }
    return node
  }

  /**
   * Recupere une valeur depuis un selecteur HA ou un input natif.
   */
  _getSelectorValue(event) {
    if (event?.detail && Object.prototype.hasOwnProperty.call(event.detail, "value")) {
      return event.detail.value
    }
    return event?.target?.value
  }

  /**
   * Convertit la sortie du color picker HA en couleur CSS.
   */
  _normalizePickerColor(value) {
    if (Array.isArray(value) && value.length >= 3) {
      const [red, green, blue] = value.map((item) =>
        Math.max(0, Math.min(255, Math.round(Number(item) || 0)))
      )
      return `#${[red, green, blue]
        .map((channel) => channel.toString(16).padStart(2, "0"))
        .join("")}`
    }

    if (value && typeof value === "object") {
      if (Array.isArray(value.rgb_color)) {
        return this._normalizePickerColor(value.rgb_color)
      }
      if (value.value !== undefined) {
        return this._normalizePickerColor(value.value)
      }
    }

    return safeText(value).trim()
  }

  /**
   * Sauvegarde une valeur issue d un ha-selector.
   */
  _onSelectorInput(path, event) {
    const value = safeText(this._getSelectorValue(event)).trim()
    if (!value) {
      this._removeValue(path)
      return
    }
    this._setValue(path, value)
  }

  /**
   * Sauvegarde une couleur issue du picker HA.
   */
  _onColorSelector(path, event) {
    const value = this._normalizePickerColor(this._getSelectorValue(event))
    if (!value) {
      this._removeValue(path)
      return
    }
    this._setValue(path, value)
  }

  /**
   * Sauvegarde une image issue du picker media HA.
   */
  _onImagePicker(path, event) {
    const value = normalizeImageSourceValue(this._getSelectorValue(event))
    if (!value) {
      this._removeValue(path)
      return
    }
    this._setValue(path, value)
  }

  /**
   * Convertit une couleur CSS simple en hex pour le picker.
   */
  _toHexColor(value, fallback = "#c7a975") {
    if (!value || typeof value !== "string") return fallback
    const normalized = value.trim()
    if (/^#([0-9a-fA-F]{6})$/.test(normalized)) return normalized
    if (/^#([0-9a-fA-F]{3})$/.test(normalized)) {
      const [r, g, b] = normalized.slice(1).split("")
      return `#${r}${r}${g}${g}${b}${b}`
    }
    return fallback
  }

  /**
   * Rend un picker d icone HA avec champ texte de secours.
   */
  _renderIconPicker(label, path, placeholder = "mdi:home") {
    const value = this._readConfigPath(path) || ""

    return html`
      <div class="picker-field">
        <label>${label}</label>
        <ha-selector
          class="native-picker"
          .hass="${this.hass}"
          .selector="${{ icon: { placeholder } }}"
          .value="${value}"
          @value-changed="${(event) => this._onSelectorInput(path, event)}"
        ></ha-selector>
        <input
          class="fallback-input"
          .value="${value}"
          placeholder="${placeholder}"
          @change="${(event) => this._onInput(path, event)}"
        />
      </div>
    `
  }

  /**
   * Rend un picker image HA avec champ texte de secours.
   */
  _renderImagePicker(label, path, placeholder = "/local/images/zone.jpg") {
    const value = normalizeImageSourceValue(this._readConfigPath(path))

    return html`
      <div class="picker-field">
        <label>${label}</label>
        <ha-picture-upload
          class="native-picker image-picker"
          .hass="${this.hass}"
          .value="${value || null}"
          select-media
          @change="${(event) => this._onImagePicker(path, event)}"
        ></ha-picture-upload>
        <input
          class="fallback-input"
          .value="${value}"
          placeholder="${placeholder}"
          @change="${(event) => this._onInput(path, event)}"
        />
      </div>
    `
  }

  /**
   * Rend un picker couleur HA avec champ texte de secours.
   */
  _renderColorField(label, path, fallback) {
    const value = this._readConfigPath(path) || ""
    const hexValue = this._toHexColor(value, fallback)

    return html`
      <div class="color-field">
        <label>${label}</label>
        <ha-selector
          class="native-picker"
          .hass="${this.hass}"
          .selector="${{
            ui_color: {
              default_color: fallback,
              include_none: true,
              include_state: true,
            },
          }}"
          .value="${value || fallback}"
          @value-changed="${(event) => this._onColorSelector(path, event)}"
        ></ha-selector>
        <div class="color-row">
          <input
            class="color-input"
            type="color"
            .value="${hexValue}"
            @change="${(event) => this._setValue(path, event.target.value)}"
          />
          <input
            .value="${value}"
            @change="${(event) => this._onInput(path, event)}"
            placeholder="${fallback}"
          />
        </div>
      </div>
    `
  }

  /**
   * Ajoute une entite vide a la configuration.
   */
  _addEntity() {
    const entities = this.config.entities || []
    this._activeEntityIndex = entities.length
    this._activeEntityTab = "entity"
    this._setValue("entities", [...entities, ""])
  }

  /**
   * Supprime une entite de la liste configuree.
   */
  _removeEntity(index) {
    const entities = this.config.entities || []
    const updated = entities.filter((_, i) => i !== index)
    this._activeEntityIndex = Math.max(0, Math.min(this._activeEntityIndex || 0, updated.length - 1))
    this._setValue("entities", updated)
  }

  /**
   * Remplace l entite principale d une ligne.
   */
  _setEntity(index, value) {
    const entities = this.config.entities || []
    const updated = [...entities]
    const current = updated[index]

    if (current && typeof current === "object") {
      updated[index] = {
        ...current,
        entity: value,
      }
    } else {
      updated[index] = value
    }
    this._setValue("entities", updated)
  }

  /**
   * Deplace une entite dans l ordre d affichage.
   */
  _moveEntity(index, direction) {
    const entities = [...(this.config.entities || [])]
    const target = direction === "up" ? index - 1 : index + 1
    if (target < 0 || target >= entities.length) {
      return
    }

    const current = entities[index]
    entities[index] = entities[target]
    entities[target] = current
    this._setValue("entities", entities)
  }

  /**
   * Ouvre le sous-onglet de reglage d une entite.
   */
  _selectEntity(index) {
    this._activeEntityIndex = index
    this._activeEntityTab = "entity"
    this.requestUpdate()
  }

  /**
   * Change le sous-onglet actif des entites.
   */
  _setEntityTab(tab) {
    this._activeEntityTab = tab
    this.requestUpdate()
  }

  /**
   * Retire les champs vides d une entite avant sauvegarde.
   */
  _cleanEntityItem(item) {
    if (!item || typeof item !== "object") {
      return item
    }

    const cleaned = { ...item }
    for (const [key, value] of Object.entries(cleaned)) {
      if (key === "entity") {
        continue
      }
      if (value === "" || value === undefined || value === null) {
        delete cleaned[key]
      }
    }

    return Object.keys(cleaned).length === 1 && cleaned.entity ? cleaned.entity : cleaned
  }

  /**
   * Applique une modification ciblee sur une entite.
   */
  _updateEntityItem(index, updater) {
    const entities = [...(this.config.entities || [])]
    const current = entities[index]
    if (current === undefined) {
      return
    }

    const entityConfig =
      current && typeof current === "object" ? { ...current } : { entity: safeText(current) }

    updater(entityConfig)
    entities[index] = this._cleanEntityItem(entityConfig)
    this._setValue("entities", entities)
  }

  /**
   * Ecrit ou supprime une option d entite.
   */
  _setEntityOption(index, key, value) {
    this._updateEntityItem(index, (entityConfig) => {
      if (value === "" || value === undefined || value === null) {
        delete entityConfig[key]
      } else {
        entityConfig[key] = value
      }
    })
  }

  /**
   * Sauvegarde une option texte d entite.
   */
  _onEntityInput(index, key, event) {
    this._setEntityOption(index, key, safeText(event.target.value).trim())
  }

  /**
   * Sauvegarde une option booleenne d entite.
   */
  _onEntityBoolean(index, key, event) {
    this._setEntityOption(index, key, event.target.checked)
  }

  /**
   * Retourne l action par defaut d un editeur d action.
   */
  _getActionFallback(actionKey) {
    return actionKey === "tap_action" ? "more-info" : "none"
  }

  /**
   * Lit et normalise l action configuree d une entite.
   */
  _readEntityAction(index, actionKey) {
    const entityConfig = parseEntityConfig((this.config.entities || [])[index]) || {}
    return normalizeActionConfig(entityConfig[actionKey], this._getActionFallback(actionKey))
  }

  /**
   * Sauvegarde une action complete sur une entite.
   */
  _setEntityAction(index, actionKey, actionConfig) {
    this._updateEntityItem(index, (entityConfig) => {
      const cleaned = { ...actionConfig }
      for (const [key, value] of Object.entries(cleaned)) {
        if (key === "action") {
          continue
        }
        if (value === "" || value === undefined || value === null) {
          delete cleaned[key]
        }
      }
      entityConfig[actionKey] = cleaned
    })
  }

  /**
   * Change le type d action d une entite.
   */
  _updateEntityActionType(index, actionKey, action) {
    const current = this._readEntityAction(index, actionKey)
    this._setEntityAction(index, actionKey, {
      ...current,
      action,
    })
  }

  /**
   * Met a jour un champ simple d action d entite.
   */
  _updateEntityActionInput(index, actionKey, key, event) {
    const current = this._readEntityAction(index, actionKey)
    const value = safeText(event.target.value).trim()
    if (!value) {
      delete current[key]
    } else {
      current[key] = value
    }
    this._setEntityAction(index, actionKey, current)
  }

  /**
   * Valide et sauvegarde un champ JSON d action d entite.
   */
  _updateEntityActionJson(index, actionKey, key, event) {
    const errorKey = `entity.${index}.${actionKey}.${key}`
    const raw = safeText(event.target.value).trim()
    if (!raw) {
      const current = this._readEntityAction(index, actionKey)
      delete current[key]
      this._setEntityAction(index, actionKey, current)
      this._jsonErrors = { ...this._jsonErrors, [errorKey]: "" }
      return
    }

    try {
      const parsed = JSON.parse(raw)
      const current = this._readEntityAction(index, actionKey)
      current[key] = parsed
      this._setEntityAction(index, actionKey, current)
      this._jsonErrors = { ...this._jsonErrors, [errorKey]: "" }
    } catch (_error) {
      this._jsonErrors = {
        ...this._jsonErrors,
        [errorKey]: "JSON invalide. Utiliser un objet JSON valide.",
      }
      this.requestUpdate()
    }
  }

  /**
   * Rend le panneau d action d une entite.
   */
  _renderEntityActionEditor(index, actionKey, label) {
    const actionConfig = this._readEntityAction(index, actionKey)
    const actionType = actionConfig.action || "none"
    const dataError = this._jsonErrors?.[`entity.${index}.${actionKey}.service_data`] || ""
    const targetError = this._jsonErrors?.[`entity.${index}.${actionKey}.target`] || ""

    return html`
      <div class="action-block">
        <label>${label}</label>
        <select
          .value="${actionType}"
          @change="${(event) => this._updateEntityActionType(index, actionKey, event.target.value)}"
        >
          ${ACTION_OPTIONS.map((option) => html`<option value="${option}">${option}</option>`)}
        </select>

        ${actionType === "navigate"
          ? html`
              <label>Chemin de navigation</label>
              <input
                .value="${actionConfig.navigation_path || ""}"
                placeholder="/lovelace/cuisine"
                @input="${(event) =>
                  this._updateEntityActionInput(index, actionKey, "navigation_path", event)}"
              />
            `
          : ""}
        ${actionType === "url"
          ? html`
              <label>URL</label>
              <input
                .value="${actionConfig.url_path || ""}"
                placeholder="https://example.com"
                @input="${(event) =>
                  this._updateEntityActionInput(index, actionKey, "url_path", event)}"
              />
            `
          : ""}
        ${actionType === "call-service"
          ? html`
              <label>Service</label>
              <input
                .value="${actionConfig.service || ""}"
                placeholder="light.turn_on"
                @input="${(event) =>
                  this._updateEntityActionInput(index, actionKey, "service", event)}"
              />

              <label>Service data (JSON objet)</label>
              <textarea
                .value="${actionConfig.service_data
                  ? JSON.stringify(actionConfig.service_data, null, 2)
                  : ""}"
                placeholder='{"brightness_pct": 80}'
                @change="${(event) =>
                  this._updateEntityActionJson(index, actionKey, "service_data", event)}"
              ></textarea>
              ${dataError ? html`<div class="error-text">${dataError}</div>` : ""}

              <label>Target (JSON objet)</label>
              <textarea
                .value="${actionConfig.target ? JSON.stringify(actionConfig.target, null, 2) : ""}"
                placeholder='{"entity_id": "light.cuisine"}'
                @change="${(event) =>
                  this._updateEntityActionJson(index, actionKey, "target", event)}"
              ></textarea>
              ${targetError ? html`<div class="error-text">${targetError}</div>` : ""}
            `
          : ""}
      </div>
    `
  }

  /**
   * Determine si le badge est active pour une entite.
   */
  _isEntityBadgeEnabled(entityConfig = {}) {
    if (entityConfig.badge === false || entityConfig.badge?.enabled === false) {
      return false
    }
    return Boolean(
      entityConfig.badge === true ||
        (entityConfig.badge && typeof entityConfig.badge === "object") ||
        entityConfig.badge_entity ||
        entityConfig.badge_mode ||
        entityConfig.badge_show_when ||
        entityConfig.badge_state ||
        entityConfig.badge_text ||
        entityConfig.badge_icon ||
        entityConfig.badge_color ||
        entityConfig.badge_background ||
        entityConfig.badge_border_color ||
        entityConfig.badge_position
    )
  }

  /**
   * Active ou desactive les options badge d une entite.
   */
  _setEntityBadgeEnabled(index, enabled) {
    this._updateEntityItem(index, (entityConfig) => {
      if (enabled) {
        entityConfig.badge = true
        return
      }

      entityConfig.badge = false
      delete entityConfig.badge_entity
      delete entityConfig.badge_mode
      delete entityConfig.badge_show_when
      delete entityConfig.badge_state
      delete entityConfig.badge_text
      delete entityConfig.badge_icon
      delete entityConfig.badge_color
      delete entityConfig.badge_background
      delete entityConfig.badge_border_color
      delete entityConfig.badge_position
    })
  }

  /**
   * Rend le select du contenu de badge.
   */
  _renderBadgeModeSelect(value, onChange) {
    const labels = {
      auto: "Automatique",
      state: "État de l'entité badge",
      count_on: "Nombre allumé",
      text: "Texte fixe",
    }

    return html`
      <select .value="${value || "auto"}" @change="${onChange}">
        ${ENTITY_BADGE_MODES.map(
          (mode) => html`<option value="${mode}">${labels[mode]}</option>`
        )}
      </select>
    `
  }

  /**
   * Rend le select de visibilite de badge.
   */
  _renderBadgeVisibilitySelect(value, onChange) {
    const labels = {
      auto: "Automatique",
      always: "Toujours",
      active: "Source active",
      on: "Source allumée",
      nonzero: "Nombre supérieur à 0",
      state: "État précis",
    }

    return html`
      <select .value="${value || "auto"}" @change="${onChange}">
        ${ENTITY_BADGE_SHOW_WHEN.map(
          (mode) => html`<option value="${mode}">${labels[mode]}</option>`
        )}
      </select>
    `
  }

  /**
   * Rend le select de position de badge.
   */
  _renderBadgePositionSelect(value, onChange) {
    const labels = {
      "top-right": "Haut droite",
      "top-left": "Haut gauche",
      "bottom-right": "Bas droite",
      "bottom-left": "Bas gauche",
    }

    return html`
      <select .value="${value || "top-right"}" @change="${onChange}">
        ${ENTITY_BADGE_POSITIONS.map(
          (position) => html`<option value="${position}">${labels[position]}</option>`
        )}
      </select>
    `
  }

  /**
   * Rend le select de position d entite.
   */
  _renderPositionSelect(value, onChange, includeAuto = true) {
    const labels = {
      "bottom-left": "Bas gauche",
      "bottom-center": "Bas centre",
      "bottom-right": "Bas droite",
      "top-left": "Haut gauche",
      "top-center": "Haut centre",
      "top-right": "Haut droite",
      "title-right": "Titre droite",
    }

    return html`
      <select .value="${value || ""}" @change="${onChange}">
        ${includeAuto ? html`<option value="">Automatique</option>` : ""}
        ${ENTITY_POSITIONS.map(
          (position) => html`<option value="${position}">${labels[position]}</option>`
        )}
      </select>
    `
  }

  /**
   * Rend le select de mode d affichage d entite.
   */
  _renderDisplayModeSelect(value, onChange, includeDefault = true) {
    const labels = {
      button: "Bouton",
      text: "Texte",
      icon: "Icône seule",
    }

    return html`
      <select .value="${value || ""}" @change="${onChange}">
        ${includeDefault ? html`<option value="">Défaut</option>` : ""}
        ${ENTITY_DISPLAY_MODES.map(
          (mode) => html`<option value="${mode}">${labels[mode]}</option>`
        )}
      </select>
    `
  }

  /**
   * Rend un picker d icone pour une option d entite.
   */
  _renderEntityIconPicker(label, index, key, placeholder = "mdi:home", overrideValue = undefined) {
    const entities = this.config.entities || []
    const parsed = parseEntityConfig(entities[index]) || {}
    const value = overrideValue !== undefined ? overrideValue : parsed[key] || ""

    return html`
      <div class="picker-field">
        <label>${label}</label>
        <ha-selector
          class="native-picker"
          .hass="${this.hass}"
          .selector="${{ icon: { placeholder } }}"
          .value="${value}"
          @value-changed="${(event) =>
            this._setEntityOption(index, key, safeText(this._getSelectorValue(event)).trim())}"
        ></ha-selector>
        <input
          class="fallback-input"
          .value="${value}"
          placeholder="${placeholder}"
          @change="${(event) => this._onEntityInput(index, key, event)}"
        />
      </div>
    `
  }

  /**
   * Rend un picker couleur pour une option d entite.
   */
  _renderEntityColorField(label, index, key, fallback) {
    const entities = this.config.entities || []
    const parsed = parseEntityConfig(entities[index]) || {}
    const value = parsed[key] || ""
    const hexValue = this._toHexColor(value, fallback)

    return html`
      <div class="color-field">
        <label>${label}</label>
        <ha-selector
          class="native-picker"
          .hass="${this.hass}"
          .selector="${{
            ui_color: {
              default_color: fallback,
              include_none: true,
              include_state: true,
            },
          }}"
          .value="${value || fallback}"
          @value-changed="${(event) =>
            this._setEntityOption(index, key, this._normalizePickerColor(this._getSelectorValue(event)))}"
        ></ha-selector>
        <div class="color-row">
          <input
            class="color-input"
            type="color"
            .value="${hexValue}"
            @change="${(event) => this._setEntityOption(index, key, event.target.value)}"
          />
          <input
            .value="${value}"
            @change="${(event) => this._onEntityInput(index, key, event)}"
            placeholder="${fallback}"
          />
        </div>
      </div>
    `
  }

  /**
   * Rend la liste compacte des entites configurees.
   */
  _renderEntitiesField() {
    const entities = this.config.entities || []

    return html`
      <div class="entities-field">
        <div class="entities-header">
          <label>Entités</label>
          <button class="add-button" @click="${() => this._addEntity()}" title="Ajouter une entité" type="button">
            + Ajouter
          </button>
        </div>

        ${entities.length === 0
          ? html`<div class="empty-state">Aucune entité sélectionnée</div>`
          : html`<div class="entities-list">
              ${entities.map((entity, index) => {
                const parsed = parseEntityConfig(entity)
                const entityId = parsed?.entity || ""
                const isAdvanced = Boolean(
                  parsed &&
                  typeof entity === "object" &&
                  Object.keys(entity).some((key) => key !== "entity")
                )
                return html`
                  <div class="entity-row">
                    <button
                      class="entity-row-main"
                      @click="${() => this._selectEntity(index)}"
                      title="Configurer cette entité"
                      type="button"
                    >
                      <span>${entityId || `Entité ${index + 1}`}</span>
                      ${isAdvanced ? html`<small>personnalisée</small>` : ""}
                    </button>
                    <div class="entity-actions">
                      <button
                        class="move-button"
                        @click="${() => this._selectEntity(index)}"
                        title="Configurer"
                        type="button"
                      >
                        ⚙
                      </button>
                      <button
                        class="move-button"
                        @click="${() => this._moveEntity(index, "up")}"
                        ?disabled="${index === 0}"
                        title="Monter"
                        type="button"
                      >
                        ↑
                      </button>
                      <button
                        class="move-button"
                        @click="${() => this._moveEntity(index, "down")}"
                        ?disabled="${index === entities.length - 1}"
                        title="Descendre"
                        type="button"
                      >
                        ↓
                      </button>
                    </div>
                    <button
                      class="remove-button"
                      @click="${() => this._removeEntity(index)}"
                      title="Retirer cette entité"
                      type="button"
                    >
                      ✕
                    </button>
                    ${isAdvanced
                      ? html`<div class="entity-hint">
                          Mode avancé actif (name/icon/attribute/actions personnalisés)
                        </div>`
                      : ""}
                  </div>
                `
              })}
            </div>`}
      </div>
    `
  }

  /**
   * Rend le sous-onglet de parametrage detaille d une entite.
   */
  _renderEntityDetailsTab() {
    const entities = this.config.entities || []
    const index = Math.max(0, Math.min(this._activeEntityIndex || 0, entities.length - 1))
    const parsed = parseEntityConfig(entities[index])

    if (!parsed) {
      return html`<div class="empty-state">Ajoutez une entité pour ouvrir ses réglages.</div>`
    }

    const badgeEnabled = this._isEntityBadgeEnabled(parsed)
    const nestedBadge = parsed.badge && typeof parsed.badge === "object" ? parsed.badge : {}
    const badgeEntity = parsed.badge_entity || nestedBadge.entity || nestedBadge.entity_id || ""
    const badgeMode = parsed.badge_mode || nestedBadge.mode || "auto"
    const badgeShowWhen = parsed.badge_show_when || nestedBadge.show_when || nestedBadge.showWhen || "auto"
    const badgeState = parsed.badge_state || nestedBadge.state || nestedBadge.show_state || ""
    const badgeText = parsed.badge_text || nestedBadge.text || ""
    const badgeIcon = parsed.badge_icon || nestedBadge.icon || ""
    const badgePosition = parsed.badge_position || nestedBadge.position || "top-right"

    return html`
      <div class="entity-detail">
        <label>Entité à configurer</label>
        <select
          .value="${String(index)}"
          @change="${(event) => this._selectEntity(Number(event.target.value))}"
        >
          ${entities.map((entity, optionIndex) => {
            const item = parseEntityConfig(entity)
            return html`
              <option value="${String(optionIndex)}" ?selected="${optionIndex === index}">
                ${item?.entity || `Entité ${optionIndex + 1}`}
              </option>
            `
          })}
        </select>

        <label>Entité</label>
        <ha-entity-picker
          .hass="${this.hass}"
          .value="${parsed.entity || ""}"
          allow-custom-entity
          @value-changed="${(event) => this._setEntity(index, event.detail.value)}"
        ></ha-entity-picker>

        <label>Position</label>
        ${this._renderPositionSelect(parsed.position || "", (event) =>
          this._setEntityOption(index, "position", event.target.value)
        )}

        <label>Affichage</label>
        ${this._renderDisplayModeSelect(parsed.display_mode || parsed.display || "", (event) =>
          this._setEntityOption(index, "display_mode", event.target.value)
        )}

        <label>Texte du bouton</label>
        <input
          .value="${parsed.text || ""}"
          placeholder="Lumière, TV, Ventilateur..."
          @change="${(event) => this._onEntityInput(index, "text", event)}"
        />

        <label>Nom affiché</label>
        <input
          .value="${parsed.name || ""}"
          placeholder="Nom personnalisé"
          @change="${(event) => this._onEntityInput(index, "name", event)}"
        />

        <label>
          <input
            type="checkbox"
            .checked="${!!parsed.show_name}"
            @change="${(event) => this._onEntityBoolean(index, "show_name", event)}"
          />
          Afficher le nom
        </label>

        <label>
          <input
            type="checkbox"
            .checked="${!!parsed.show_state}"
            @change="${(event) => this._onEntityBoolean(index, "show_state", event)}"
          />
          Afficher l'état
        </label>

        ${this._renderEntityIconPicker("Icône", index, "icon", "mdi:lightbulb")}
        ${this._renderEntityIconPicker("Icône active", index, "icon_on", "mdi:lightbulb-on")}
        ${this._renderEntityIconPicker("Icône inactive", index, "icon_off", "mdi:lightbulb-outline")}

        <div class="entity-detail-columns">
          ${this._renderEntityColorField("Couleur icône active", index, "icon_color_on", "#03A9F4")}
          ${this._renderEntityColorField("Couleur icône inactive", index, "icon_color_off", "#9CA3AF")}
          ${this._renderEntityColorField("Couleur texte active", index, "text_color_on", "#FFFFFF")}
          ${this._renderEntityColorField("Couleur texte inactive", index, "text_color_off", "#CBD5E1")}
          ${this._renderEntityColorField("Fond bouton actif", index, "background_color_on", "#164E63")}
          ${this._renderEntityColorField("Fond bouton inactif", index, "background_color_off", "#111827")}
        </div>

        <div class="entity-subsection">
          <div class="subsection-title">Actions de cette entité</div>
          ${this._renderEntityActionEditor(index, "tap_action", "Tap")}
          ${this._renderEntityActionEditor(index, "hold_action", "Hold / clic droit")}
          ${this._renderEntityActionEditor(index, "double_tap_action", "Double tap")}
        </div>

        <div class="entity-subsection">
          <label>
            <input
              type="checkbox"
              .checked="${badgeEnabled}"
              @change="${(event) => this._setEntityBadgeEnabled(index, event.target.checked)}"
            />
            Badge sur cette entité
          </label>

          ${badgeEnabled
            ? html`
                <label>Entité source du badge</label>
                <ha-entity-picker
                  .hass="${this.hass}"
                  .value="${badgeEntity}"
                  allow-custom-entity
                  @value-changed="${(event) =>
                    this._setEntityOption(index, "badge_entity", event.detail.value || "")}"
                ></ha-entity-picker>

                <label>Contenu du badge</label>
                ${this._renderBadgeModeSelect(badgeMode, (event) =>
                  this._setEntityOption(index, "badge_mode", event.target.value)
                )}

                <label>Afficher le badge si</label>
                ${this._renderBadgeVisibilitySelect(badgeShowWhen, (event) =>
                  this._setEntityOption(index, "badge_show_when", event.target.value)
                )}

                ${badgeShowWhen === "state"
                  ? html`
                      <label>État attendu</label>
                      <input
                        .value="${badgeState}"
                        placeholder="on, home, heat..."
                        @change="${(event) => this._onEntityInput(index, "badge_state", event)}"
                      />
                    `
                  : ""}

                <label>Texte badge</label>
                <input
                  .value="${badgeText}"
                  placeholder="Vide = automatique"
                  @change="${(event) => this._onEntityInput(index, "badge_text", event)}"
                />

                ${this._renderEntityIconPicker("Icône badge", index, "badge_icon", "mdi:check", badgeIcon)}

                <label>Position badge</label>
                ${this._renderBadgePositionSelect(badgePosition, (event) =>
                  this._setEntityOption(index, "badge_position", event.target.value)
                )}

                <div class="entity-detail-columns">
                  ${this._renderEntityColorField("Couleur badge", index, "badge_color", "#FFFFFF")}
                  ${this._renderEntityColorField("Fond badge", index, "badge_background", "#03A9F4")}
                  ${this._renderEntityColorField("Bordure badge", index, "badge_border_color", "#FFFFFF")}
                </div>
              `
            : ""}
        </div>
      </div>
    `
  }

  /**
   * Rend les sous-onglets liste/details des entites.
   */
  _renderEntitiesPanel() {
    const activeTab = ["list", "entity"].includes(this._activeEntityTab)
      ? this._activeEntityTab
      : "list"
    const tabs = [
      ["list", "Liste"],
      ["entity", "Réglages"],
    ]

    return html`
      <div class="subtabs">
        ${tabs.map(
          ([id, label]) => html`
            <button
              class="${activeTab === id ? "active" : ""}"
              @click="${() => this._setEntityTab(id)}"
              type="button"
            >
              ${label}
            </button>
          `
        )}
      </div>
      ${activeTab === "entity" ? this._renderEntityDetailsTab() : this._renderEntitiesField()}
    `
  }

  /**
   * Rend le formulaire complet de configuration.
   */
  render() {
    if (!this.config) return html``

    const areas = this.hass?.areas ? Object.values(this.hass.areas) : []

    return html`
      <div class="form">
        <details open>
          <summary>General</summary>
          <div class="section-content">
            <label>Titre</label>
            <input
              .value="${this.config.title || ""}"
              @input="${(event) => this._onInput("title", event)}"
            />

            ${this._renderColorField("Couleur du titre", "styles.title_color", "#f8fafc")}

            ${this._renderIconPicker("Icône de la carte", "icon", "mdi:home-map-marker")}

            <label>Zone</label>
            <select
              .value="${this.config.area || ""}"
              @change="${(event) => this._setValue("area", event.target.value)}"
            >
              <option value="">Aucune zone</option>
              ${areas.map(
                (area) => html`
                  <option value="${area.area_id}" ?selected="${this.config.area === area.area_id}">
                    ${area.name}
                  </option>
                `
              )}
            </select>

            <label>
              <input
                type="checkbox"
                .checked="${this.config.auto_area_entities !== false}"
                @change="${(event) => this._onBoolean("auto_area_entities", event)}"
              />
              Auto-remplir les entités depuis la zone si la liste est vide
            </label>

            <label>
              <input
                type="checkbox"
                .checked="${!!this.config.hide_unavailable}"
                @change="${(event) => this._onBoolean("hide_unavailable", event)}"
              />
              Masquer les entités indisponibles
            </label>
          </div>
        </details>

        <details open>
          <summary>Entités</summary>
          <div class="section-content">
            ${this._renderEntitiesPanel()}
          </div>
        </details>

        <details>
          <summary>Apparence</summary>
          <div class="section-content">
            <label>Mode d'affichage</label>
            <select
              .value="${this.config.display_type || "picture"}"
              @change="${(event) => this._setValue("display_type", event.target.value)}"
            >
              <option value="picture">picture</option>
              <option value="camera">camera</option>
              <option value="icon">icon</option>
              <option value="compact">compact</option>
            </select>

            <label>Hauteur fixe de la carte</label>
            <input
              .value="${this.config.height || ""}"
              placeholder="180px, 20vh (= 180px stable), 22rem"
              @change="${(event) => this._onCssSize("height", event)}"
            />

            <label>Arrondi des coins</label>
            <input
              .value="${this.config.styles?.border_radius || ""}"
              placeholder="16px, 1rem, 0"
              @change="${(event) => this._onCssSize("styles.border_radius", event)}"
            />

            <label>Ratio image</label>
            <input
              .value="${this.config.aspect_ratio || ""}"
              placeholder="16:9"
              @change="${(event) => this._onInput("aspect_ratio", event)}"
            />

            ${this.config.display_type === "camera"
              ? html`
                  <label>Caméra</label>
                  <ha-entity-picker
                    .hass="${this.hass}"
                    .value="${this.config.camera_entity || ""}"
                    allow-custom-entity
                    @value-changed="${(event) =>
                      this._setValue("camera_entity", event.detail.value || "")}"
                  ></ha-entity-picker>
                `
              : html`
                  ${this._renderImagePicker("Image de fond", "image", "/local/images/zone.jpg")}
                `}

            ${this._renderColorField("Couleur d'accent HA", "color", "#03A9F4")}

            <label>
              <input
                type="checkbox"
                .checked="${!!this.config.darken_image}"
                @change="${(event) => this._onBoolean("darken_image", event)}"
              />
              Assombrir l'image de fond
            </label>

            <label>Taille du titre</label>
            <input
              .value="${this.config.styles?.title_font_size || ""}"
              placeholder="20px, 1.3rem"
              @change="${(event) => this._onCssSize("styles.title_font_size", event)}"
            />

            <label>Poids du titre (font-weight)</label>
            <input
              .value="${this.config.styles?.title_font_weight || ""}"
              placeholder="300"
              @change="${(event) => this._onInput("styles.title_font_weight", event)}"
            />

            <label>Effet du titre</label>
            <select
              .value="${this.config.styles?.title_effect || "shadow"}"
              @change="${(event) => this._setValue("styles.title_effect", event.target.value)}"
            >
              <option value="none">none</option>
              <option value="shadow">shadow</option>
              <option value="neon">neon</option>
              <option value="outline">outline</option>
            </select>

            <label>Transformation du titre (text-transform)</label>
            <select
              .value="${this.config.styles?.title_text_transform || "none"}"
              @change="${(event) =>
                this._setValue("styles.title_text_transform", event.target.value)}"
            >
              <option value="capitalize">capitalize</option>
              <option value="uppercase">uppercase</option>
              <option value="lowercase">lowercase</option>
              <option value="none">none</option>
            </select>

            <label>Ombre CSS du titre (avance)</label>
            <input
              .value="${this.config.styles?.title_text_shadow || ""}"
              placeholder="0 0 8px #00AEEF"
              @change="${(event) => this._onInput("styles.title_text_shadow", event)}"
            />

            <label>Flou image (blur)</label>
            <input
              .value="${this.config.styles?.image_blur || ""}"
              placeholder="2px"
              @change="${(event) => this._onInput("styles.image_blur", event)}"
            />
          </div>
        </details>
      </div>
    `
  }

  /**
   * Definit le style interne de l editeur.
   */
  static get styles() {
    return css`
      :host {
        display: block;
      }

      .form {
        display: grid;
        gap: 10px;
        padding: 8px 0;
      }

      details {
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.02);
        overflow: hidden;
      }

      details[open] {
        border-color: rgba(56, 189, 248, 0.4);
      }

      summary {
        list-style: none;
        cursor: pointer;
        padding: 10px 12px;
        font-size: 0.86rem;
        font-weight: 700;
        color: var(--primary-text-color, #f9fafb);
        border-bottom: 1px solid rgba(255, 255, 255, 0.08);
      }

      summary::-webkit-details-marker {
        display: none;
      }

      .section-content {
        display: grid;
        gap: 10px;
        padding: 12px;
      }

      .color-field {
        display: grid;
        gap: 6px;
      }

      .picker-field {
        display: grid;
        gap: 6px;
      }

      .native-picker,
      ha-selector,
      ha-picture-upload {
        display: block;
        width: 100%;
        min-width: 0;
      }

      .image-picker {
        --file-upload-image-border-radius: 8px;
      }

      .action-block {
        display: grid;
        gap: 8px;
        padding: 10px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.02);
      }

      .color-row {
        display: grid;
        grid-template-columns: 54px 1fr;
        gap: 8px;
        align-items: center;
      }

      .color-input {
        width: 100%;
        height: 38px;
        border-radius: 8px;
        padding: 0;
        border: 1px solid rgba(255, 255, 255, 0.18);
        background: transparent;
      }

      label {
        font-size: 0.82rem;
        color: var(--secondary-text-color, #9ca3af);
      }

      select,
      input,
      textarea {
        width: 100%;
        box-sizing: border-box;
        border-radius: 8px;
        border: 1px solid rgba(255, 255, 255, 0.18);
        background: rgba(255, 255, 255, 0.04);
        color: var(--primary-text-color, #f9fafb);
        padding: 8px 10px;
      }

      textarea {
        font-family: monospace;
        resize: vertical;
        min-height: 80px;
      }

      .entities-field {
        display: grid;
        gap: 8px;
      }

      .subtabs {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        padding: 4px;
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.04);
      }

      .subtabs button {
        border: 0;
        border-radius: 6px;
        background: transparent;
        color: var(--secondary-text-color, #9ca3af);
        padding: 7px 10px;
        font-size: 0.8rem;
        font-weight: 700;
        cursor: pointer;
      }

      .subtabs button.active {
        background: rgba(56, 189, 248, 0.18);
        color: var(--primary-text-color, #f9fafb);
      }

      .entity-detail {
        display: grid;
        gap: 10px;
      }

      .entity-detail-columns {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      .entity-subsection {
        display: grid;
        gap: 10px;
        margin-top: 4px;
        padding: 10px;
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.025);
      }

      .subsection-title {
        font-size: 0.78rem;
        font-weight: 750;
        color: var(--primary-text-color, #f9fafb);
      }

      .entities-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;
      }

      .entities-header label {
        margin: 0;
      }

      .add-button,
      .remove-button {
        background: rgba(56, 189, 248, 0.15);
        border: 1px solid rgba(56, 189, 248, 0.3);
        border-radius: 6px;
        color: var(--primary-text-color, #f9fafb);
        padding: 6px 12px;
        font-size: 0.8rem;
        cursor: pointer;
        transition: all 0.2s ease;
        font-weight: 600;
      }

      .add-button:hover,
      .remove-button:hover {
        background: rgba(56, 189, 248, 0.25);
        border-color: rgba(56, 189, 248, 0.5);
      }

      .remove-button {
        padding: 6px 8px;
        min-width: 30px;
        flex-shrink: 0;
      }

      .entities-list {
        display: grid;
        gap: 8px;
      }

      .entity-row {
        display: grid;
        grid-template-columns: 1fr auto 40px;
        gap: 8px;
        align-items: center;
        background: rgba(255, 255, 255, 0.02);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 8px;
        padding: 8px;
      }

      .entity-row-main {
        display: grid;
        gap: 2px;
        min-width: 0;
        border: 0;
        background: transparent;
        color: var(--primary-text-color, #f9fafb);
        text-align: left;
        padding: 0;
        cursor: pointer;
      }

      .entity-row-main span {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        font-size: 0.86rem;
        font-weight: 650;
      }

      .entity-row-main small {
        color: var(--secondary-text-color, #9ca3af);
        font-size: 0.72rem;
      }

      .entity-actions {
        display: inline-flex;
        gap: 6px;
      }

      .move-button {
        background: rgba(255, 255, 255, 0.06);
        border: 1px solid rgba(255, 255, 255, 0.14);
        border-radius: 6px;
        color: var(--primary-text-color, #f9fafb);
        padding: 6px 8px;
        cursor: pointer;
        line-height: 1;
      }

      .move-button[disabled] {
        opacity: 0.35;
        cursor: not-allowed;
      }

      .entity-hint {
        grid-column: 1 / -1;
        font-size: 0.75rem;
        color: var(--secondary-text-color, #9ca3af);
      }

      .error-text {
        color: #ef4444;
        font-size: 0.76rem;
      }

      .empty-state {
        text-align: center;
        padding: 16px;
        color: var(--secondary-text-color, #9ca3af);
        font-size: 0.82rem;
        font-style: italic;
        background: rgba(255, 255, 255, 0.02);
        border: 1px dashed rgba(255, 255, 255, 0.12);
        border-radius: 8px;
      }

      ::slotted(ha-entity-picker) {
        width: 100%;
      }

      ha-entity-picker {
        width: 100%;
      }

      @media (max-width: 720px) {
        .form {
          gap: 8px;
        }

        .entity-row {
          grid-template-columns: 1fr auto 32px;
        }

        .entity-detail-columns {
          grid-template-columns: 1fr;
        }

        .remove-button {
          padding: 4px 6px;
          min-width: 28px;
          font-size: 0.75rem;
        }
      }
    `
  }
}

/**
 * Enregistre le custom element principal une seule fois.
 */
if (!customElements.get(CARD_TYPE)) {
  customElements.define(CARD_TYPE, AlphaAreaCard)
}
/**
 * Enregistre l editeur une seule fois.
 */
if (!customElements.get(CARD_EDITOR_TYPE)) {
  customElements.define(CARD_EDITOR_TYPE, AlphaAreaCardEditor)
}

/**
 * Ajoute la carte au catalogue Lovelace.
 */
window.customCards = window.customCards || []
if (!window.customCards.find((card) => card.type === CARD_TYPE)) {
  window.customCards.push({
    type: CARD_TYPE,
    name: "Alpha Area",
    description: "Carte area rapide avec editeur visuel, actions et styles personnalises.",
    preview: true,
  })
}
