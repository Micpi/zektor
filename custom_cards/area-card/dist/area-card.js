const CARD_TYPE = "alpha-area-card";
const CARD_EDITOR_TYPE = "alpha-area-card-editor";
const UNAVAILABLE_STATES = new Set(["unknown", "unavailable"]);
const SENSOR_DOMAINS = new Set(["sensor", "binary_sensor"]);
const TOGGLE_DOMAINS = new Set(["light", "switch", "fan", "input_boolean", "humidifier", "group", "automation"]);

const DEFAULT_CONFIG = {
  title: "Cuisine",
  area: "cuisine",
  hide_unavailable: false,
  tap_action: {
    action: "navigate",
    navigation_path: "/lovelace/cuisine",
  },
  entities: [
    "light.cuisine",
    "media_player.sam_cuisine",
    "sensor.maison_zone_etage_circuit_0_current_temperature",
  ],
  styles: {
    button_icon_color_on: "#c7a975",
    button_icon_color_off: "#f0f0f0",
    badge_text_color: "#0667c1",
    button_light_color_on: "#c7a975",
    badge_background: "#e8f359",
    title_font_weight: "300",
    title_text_transform: "capitalize",
    title_text_shadow: "2px 2px 1px black",
    image_blur: "2px",
  },
  darken_image: true,
  shadow: false,
  force_dialog: false,
  state_color: false,
  card_mod: {
    style: "ha-card { height: 180px !important; display: flex !important; flex-direction: column !important; justify-content: center !important; }",
  },
};

const STYLE_DEFAULTS = {
  button_icon_color_on: "#c7a975",
  button_icon_color_off: "#f0f0f0",
  badge_text_color: "#0667c1",
  button_light_color_on: "#c7a975",
  badge_background: "#e8f359",
  title_font_weight: "300",
  title_text_transform: "capitalize",
  title_text_shadow: "2px 2px 1px black",
  image_blur: "2px",
};

const safeText = (value) => (value === null || value === undefined ? "" : String(value));

const deepClone = (value) => JSON.parse(JSON.stringify(value));

const parseEntityConfig = (rawEntity) => {
  if (typeof rawEntity === "string") {
    return { entity: rawEntity };
  }
  if (!rawEntity || typeof rawEntity !== "object" || !rawEntity.entity) {
    return null;
  }
  return { ...rawEntity };
};

const parseEntitiesText = (text) =>
  safeText(text)
    .split(/\r?\n|,|;/)
    .map((item) => item.trim())
    .filter(Boolean);

const formatNumber = (hass, value, precision) => {
  const numeric = Number(value);
  if (Number.isNaN(numeric)) {
    return safeText(value);
  }

  const locale = hass?.locale?.language || undefined;
  const digits = Number.isFinite(precision) ? precision : 2;
  return new Intl.NumberFormat(locale, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(numeric);
};

const getEntityName = (entityState, fallbackEntityId) =>
  entityState?.attributes?.friendly_name || fallbackEntityId;

const getEntityIcon = (entityState, explicitIcon) =>
  explicitIcon || entityState?.attributes?.icon || "mdi:help-circle";

const applyNavigation = (path, replace = false) => {
  if (!path) {
    return;
  }
  if (replace) {
    history.replaceState(null, "", path);
  } else {
    history.pushState(null, "", path);
  }
  window.dispatchEvent(new Event("location-changed"));
};

const fireCustomEvent = (node, type, detail = {}) => {
  node.dispatchEvent(
    new CustomEvent(type, {
      detail,
      bubbles: true,
      composed: true,
    }),
  );
};

const performAction = (node, hass, entityConfig, actionConfig) => {
  const action = actionConfig?.action || "more-info";

  if (action === "none") {
    return;
  }

  if (action === "more-info") {
    if (!entityConfig?.entity) {
      return;
    }
    fireCustomEvent(node, "hass-more-info", { entityId: entityConfig.entity });
    return;
  }

  if (action === "navigate") {
    applyNavigation(actionConfig.navigation_path, Boolean(actionConfig.navigation_replace));
    return;
  }

  if (action === "url") {
    if (actionConfig.url_path) {
      window.open(actionConfig.url_path, "_blank", "noopener,noreferrer");
    }
    return;
  }

  if (action === "toggle") {
    if (!entityConfig?.entity) {
      return;
    }
    const [domain] = entityConfig.entity.split(".");
    if (domain) {
      hass.callService(domain === "group" ? "homeassistant" : domain, domain === "lock" ? "toggle" : "toggle", {
        entity_id: entityConfig.entity,
      });
    }
    return;
  }

  if (action === "call-service") {
    const service = safeText(actionConfig.service);
    if (!service.includes(".")) {
      return;
    }
    const [domain, serviceName] = service.split(".");
    hass.callService(domain, serviceName, actionConfig.service_data || {}, actionConfig.target);
    return;
  }

  if (action === "fire-dom-event") {
    fireCustomEvent(node, "ll-custom", actionConfig);
  }
};

const resolveAreaEntities = (hass, areaId) => {
  if (!hass?.areas || !hass?.entities) {
    return [];
  }

  const area = hass.areas[areaId];
  if (!area) {
    return [];
  }

  const result = [];
  for (const [entityId, metadata] of Object.entries(hass.entities)) {
    if (metadata.hidden || metadata.disabled_by) {
      continue;
    }

    if (metadata.entity_category === "diagnostic" || metadata.entity_category === "config") {
      continue;
    }

    const deviceArea = metadata.device_id ? hass.devices?.[metadata.device_id]?.area_id : null;
    if (metadata.area_id === area.area_id || deviceArea === area.area_id) {
      result.push(entityId);
    }
  }

  return result;
};

const shouldUseStateColor = (entityConfig, cardConfig) => {
  if (typeof entityConfig.state_color === "boolean") {
    return entityConfig.state_color;
  }
  return Boolean(cardConfig.state_color);
};

const getDisplayState = (hass, entityState, entityRegistryItem, entityConfig) => {
  if (!entityState) {
    return "";
  }

  if (entityConfig.attribute) {
    const raw = entityState.attributes?.[entityConfig.attribute];
    return `${safeText(entityConfig.prefix)}${safeText(raw)}${safeText(entityConfig.suffix)}`.trim();
  }

  if (UNAVAILABLE_STATES.has(entityState.state)) {
    return entityState.state;
  }

  const unit = safeText(entityState.attributes?.unit_of_measurement);
  const domain = entityState.entity_id.split(".")[0];

  if (SENSOR_DOMAINS.has(domain) || unit) {
    const precision = Number.isFinite(entityRegistryItem?.display_precision)
      ? entityRegistryItem.display_precision
      : undefined;
    const formatted = formatNumber(hass, entityState.state, precision);
    return `${formatted}${unit ? ` ${unit}` : ""}`.trim();
  }

  return safeText(entityState.state);
};

class MinimalisticAreaCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement(CARD_EDITOR_TYPE);
  }

  static getStubConfig() {
    return deepClone(DEFAULT_CONFIG);
  }

  static get observedAttributes() {
    return [];
  }

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this.config = deepClone(DEFAULT_CONFIG);
    this._renderModel = {
      area: null,
      entitiesDialog: [],
      entitiesToggle: [],
      entitiesSensors: [],
    };
    this._lastStateSnapshot = "";
    this._boundOnCardClick = this._onCardClick.bind(this);
    this._boundOnEntityClick = this._onEntityClick.bind(this);
  }

  setConfig(config) {
    const merged = {
      ...deepClone(DEFAULT_CONFIG),
      ...(config || {}),
      styles: {
        ...deepClone(DEFAULT_CONFIG.styles),
        ...(config?.styles || {}),
      },
      tap_action: {
        ...deepClone(DEFAULT_CONFIG.tap_action),
        ...(config?.tap_action || {}),
      },
    };

    if (merged.entities && !Array.isArray(merged.entities)) {
      throw new Error("Le parametre entities doit etre un tableau.");
    }

    this.config = merged;
    this._computeRenderModel();
    this._render();
  }

  set hass(hass) {
    const previous = this._hass;
    this._hass = hass;

    if (!hass) {
      return;
    }

    if (!previous) {
      this._computeRenderModel();
      this._render();
      return;
    }

    if (this._shouldRefresh(previous, hass)) {
      this._computeRenderModel();
      this._render();
    }
  }

  get hass() {
    return this._hass;
  }

  getCardSize() {
    return 3;
  }

  _shouldRefresh(previousHass, nextHass) {
    if (!nextHass || !previousHass) {
      return true;
    }

    if (previousHass.locale !== nextHass.locale || previousHass.themes !== nextHass.themes) {
      return true;
    }

    const tracked = [
      ...this._renderModel.entitiesDialog,
      ...this._renderModel.entitiesToggle,
      ...this._renderModel.entitiesSensors,
    ];

    for (const entityConfig of tracked) {
      const entityId = entityConfig.entity;
      if (previousHass.states[entityId] !== nextHass.states[entityId]) {
        return true;
      }
    }

    const areaId = this.config.area;
    if (areaId && previousHass.areas?.[areaId] !== nextHass.areas?.[areaId]) {
      return true;
    }

    return false;
  }

  _computeRenderModel() {
    const hass = this._hass;
    if (!hass) {
      return;
    }

    const areaId = this.config.area;
    const area = areaId ? hass.areas?.[areaId] || null : null;

    const configured = Array.isArray(this.config.entities) && this.config.entities.length
      ? this.config.entities
      : resolveAreaEntities(hass, areaId);

    const parsedEntities = configured
      .map(parseEntityConfig)
      .filter(Boolean)
      .filter((item) => item.entity);

    const entitiesDialog = [];
    const entitiesToggle = [];
    const entitiesSensors = [];

    for (const entityConfig of parsedEntities) {
      const domain = entityConfig.entity.split(".")[0];
      if (SENSOR_DOMAINS.has(domain) || entityConfig.attribute) {
        entitiesSensors.push(entityConfig);
        continue;
      }

      if (!this.config.force_dialog && TOGGLE_DOMAINS.has(domain)) {
        entitiesToggle.push(entityConfig);
        continue;
      }

      entitiesDialog.push(entityConfig);
    }

    this._renderModel = {
      area,
      entitiesDialog,
      entitiesToggle,
      entitiesSensors,
    };
  }

  _getBackgroundImage() {
    const hass = this._hass;
    if (!hass) {
      return "";
    }

    const explicitImage = this.config.image;
    const areaPicture = this._renderModel.area?.picture;
    const selected = explicitImage || areaPicture;

    if (!selected) {
      return "";
    }

    try {
      return new URL(selected, hass.auth?.data?.hassUrl || window.location.origin).toString();
    } catch (_error) {
      return selected;
    }
  }

  _onCardClick() {
    if (!this._hass || !this.config) {
      return;
    }
    performAction(this, this._hass, this.config, this.config.tap_action || { action: "more-info" });
  }

  _onEntityClick(event) {
    event.stopPropagation();

    if (!this._hass) {
      return;
    }

    const entityId = event.currentTarget?.dataset?.entityId;
    if (!entityId) {
      return;
    }

    const list = [
      ...this._renderModel.entitiesDialog,
      ...this._renderModel.entitiesToggle,
      ...this._renderModel.entitiesSensors,
    ];
    const config = list.find((item) => item.entity === entityId);
    if (!config) {
      return;
    }

    const domain = entityId.split(".")[0];
    const defaultAction = this._renderModel.entitiesToggle.includes(config) && TOGGLE_DOMAINS.has(domain)
      ? { action: "toggle" }
      : { action: "more-info" };

    performAction(this, this._hass, config, config.tap_action || defaultAction);
  }

  _renderEntityButton(entityConfig, asSensorLine = false) {
    const hass = this._hass;
    const entityState = hass?.states?.[entityConfig.entity];

    if (!entityState && this.config.hide_unavailable) {
      return "";
    }

    if (entityState && UNAVAILABLE_STATES.has(entityState.state) && this.config.hide_unavailable) {
      return "";
    }

    const icon = getEntityIcon(entityState, entityConfig.icon);
    const name = getEntityName(entityState, entityConfig.entity);
    const isOn = entityState?.state === "on";
    const displayState = getDisplayState(hass, entityState, hass?.entities?.[entityConfig.entity], entityConfig);
    const title = `${name}: ${displayState}`;

    const stateColorAttr = shouldUseStateColor(entityConfig, this.config) ? " data-state-color=\"1\"" : "";
    const sensorHtml = asSensorLine
      ? `<span class=\"sensor-value\">${safeText(displayState)}</span>`
      : "";

    const badgeHtml = entityConfig.entity.startsWith("light.") ? this._renderLightBadge(entityConfig.entity) : "";

    return `
      <button class=\"entity ${asSensorLine ? "sensor" : "action"} ${isOn ? "is-on" : ""}\" data-entity-id=\"${entityConfig.entity}\" title=\"${title}\"${stateColorAttr}>
        <ha-state-icon icon=\"${icon}\" class=\"entity-icon\"></ha-state-icon>
        ${asSensorLine ? `<span class=\"entity-label\">${name}</span>` : ""}
        ${sensorHtml}
        ${badgeHtml}
      </button>
    `;
  }

  _renderLightBadge(entityId) {
    const state = this._hass?.states?.[entityId];
    const members = state?.attributes?.entity_id;
    if (!Array.isArray(members) || members.length === 0) {
      return "";
    }

    const activeCount = members.reduce((count, memberId) => {
      return this._hass?.states?.[memberId]?.state === "on" ? count + 1 : count;
    }, 0);

    if (!activeCount) {
      return "";
    }

    return `<span class=\"entity-badge\">${activeCount}</span>`;
  }

  _computeCardCssVariables() {
    const styles = this.config.styles || {};
    const vars = {
      "--mac-button-icon-color-on": styles.button_icon_color_on,
      "--mac-button-icon-color-off": styles.button_icon_color_off,
      "--mac-badge-text-color": styles.badge_text_color,
      "--mac-button-light-color-on": styles.button_light_color_on,
      "--mac-badge-background": styles.badge_background,
      "--mac-title-font-weight": styles.title_font_weight,
      "--mac-title-text-transform": styles.title_text_transform,
      "--mac-title-text-shadow": styles.title_text_shadow,
      "--mac-image-blur": styles.image_blur,
    };

    return Object.entries(vars)
      .filter(([, value]) => value !== undefined && value !== null && value !== "")
      .map(([name, value]) => `${name}: ${value};`)
      .join(" ");
  }

  _render() {
    if (!this.shadowRoot || !this._hass || !this.config) {
      return;
    }

    const areaName = this._renderModel.area?.name || this.config.area || "Area";
    const title = this.config.title || areaName;
    const backgroundImage = this._getBackgroundImage();
    const styles = this.config.styles || {};

    const sensorButtons = this._renderModel.entitiesSensors
      .map((entity) => this._renderEntityButton(entity, true))
      .filter(Boolean)
      .join("");

    const mediaButtons = this._renderModel.entitiesDialog
      .filter((entity) => entity.entity.startsWith("media_player."))
      .map((entity) => this._renderEntityButton(entity, false))
      .filter(Boolean)
      .join("");

    const dialogButtons = this._renderModel.entitiesDialog
      .filter((entity) => !entity.entity.startsWith("media_player."))
      .map((entity) => this._renderEntityButton(entity, false))
      .filter(Boolean)
      .join("");

    const toggleButtons = this._renderModel.entitiesToggle
      .map((entity) => this._renderEntityButton(entity, false))
      .filter(Boolean)
      .join("");

    const hasMedia = Boolean(mediaButtons);

    const stateSnapshot = JSON.stringify({
      title,
      backgroundImage,
      darkenImage: Boolean(this.config.darken_image),
      sensorButtons,
      mediaButtons,
      dialogButtons,
      toggleButtons,
      vars: this._computeCardCssVariables(),
      stateColor: Boolean(this.config.state_color),
      shadow: Boolean(this.config.shadow),
      hasMedia,
      styles,
    });

    if (stateSnapshot === this._lastStateSnapshot) {
      return;
    }
    this._lastStateSnapshot = stateSnapshot;

    const cardStyle = this._computeCardCssVariables();
    const titleStyle = `
      ${styles.title_font_weight ? `font-weight:${styles.title_font_weight};` : ""}
      ${styles.title_text_transform ? `text-transform:${styles.title_text_transform};` : ""}
      ${styles.title_text_shadow ? `text-shadow:${styles.title_text_shadow};` : ""}
    `;

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          --mac-button-icon-color-on: ${STYLE_DEFAULTS.button_icon_color_on};
          --mac-button-icon-color-off: ${STYLE_DEFAULTS.button_icon_color_off};
          --mac-badge-text-color: ${STYLE_DEFAULTS.badge_text_color};
          --mac-button-light-color-on: ${STYLE_DEFAULTS.button_light_color_on};
          --mac-badge-background: ${STYLE_DEFAULTS.badge_background};
          --mac-title-font-weight: ${STYLE_DEFAULTS.title_font_weight};
          --mac-title-text-transform: ${STYLE_DEFAULTS.title_text_transform};
          --mac-title-text-shadow: ${STYLE_DEFAULTS.title_text_shadow};
          --mac-image-blur: ${STYLE_DEFAULTS.image_blur};
          --mac-card-height: 180px;
        }

        ha-card {
          position: relative;
          overflow: hidden;
          border-radius: var(--ha-card-border-radius, 16px);
          background: var(--card-background-color, #1f2937);
          color: var(--primary-text-color, #f8fafc);
          min-height: var(--mac-card-height);
          height: var(--mac-card-height);
          display: flex;
          flex-direction: column;
          justify-content: center;
          cursor: pointer;
          transition: transform 160ms ease, box-shadow 160ms ease;
          ${cardStyle}
        }

        ha-card:active {
          transform: scale(0.996);
        }

        .bg {
          position: absolute;
          inset: 0;
          z-index: 0;
          pointer-events: none;
        }

        .bg img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          filter: blur(var(--mac-image-blur)) ${this.config.darken_image ? "brightness(0.58)" : "brightness(0.92)"};
          transform: scale(1.04);
        }

        .overlay {
          position: absolute;
          inset: 0;
          background: linear-gradient(180deg, rgba(15, 23, 42, 0.15) 0%, rgba(15, 23, 42, 0.55) 80%);
        }

        .content {
          position: relative;
          z-index: 1;
          display: grid;
          gap: 6px;
          padding: 12px 14px;
          height: 100%;
        }

        .title {
          font-size: 1.3rem;
          letter-spacing: 0.02em;
          font-weight: var(--mac-title-font-weight);
          text-transform: var(--mac-title-text-transform);
          text-shadow: var(--mac-title-text-shadow);
          margin: 0;
          ${titleStyle}
        }

        .sensors {
          display: flex;
          flex-wrap: wrap;
          align-items: center;
          gap: 6px;
          min-height: 32px;
        }

        .actions {
          margin-top: auto;
          display: flex;
          align-items: center;
          justify-content: ${hasMedia ? "space-between" : "flex-end"};
          gap: 10px;
        }

        .actions-left,
        .actions-right {
          display: flex;
          align-items: center;
          gap: 6px;
          flex-wrap: wrap;
        }

        .entity {
          position: relative;
          border: 0;
          border-radius: 999px;
          background: rgba(17, 24, 39, 0.32);
          color: var(--mac-button-icon-color-off);
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          padding: 6px 8px;
          transition: background 150ms ease, transform 150ms ease, color 150ms ease;
        }

        .entity:hover {
          background: rgba(17, 24, 39, 0.48);
        }

        .entity:active {
          transform: scale(0.97);
        }

        .entity.is-on {
          color: var(--mac-button-icon-color-on);
        }

        .entity.is-on[data-state-color="1"] {
          color: var(--state-light-color, var(--mac-button-icon-color-on));
        }

        .entity.sensor {
          border-radius: 12px;
          background: rgba(2, 6, 23, 0.2);
          padding: 3px 8px;
        }

        .entity-label {
          font-size: 0.74rem;
          opacity: 0.86;
        }

        .sensor-value {
          font-size: 0.8rem;
          font-weight: 600;
        }

        .entity-icon {
          width: 22px;
          height: 22px;
          --mdc-icon-size: 22px;
          ${this.config.shadow ? "filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.4));" : ""}
        }

        .entity-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          min-width: 16px;
          height: 16px;
          border-radius: 8px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: 700;
          padding: 0 4px;
          background: var(--mac-badge-background);
          color: var(--mac-badge-text-color);
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.36);
        }

        @media (max-width: 600px) {
          .title {
            font-size: 1.08rem;
          }

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

      <ha-card>
        ${backgroundImage ? `<div class=\"bg\"><img src=\"${backgroundImage}\" alt=\"${title}\"></div><div class=\"overlay\"></div>` : ""}
        <div class=\"content\">
          <h3 class=\"title\">${title}</h3>
          <div class=\"sensors\">${sensorButtons}</div>
          <div class=\"actions\">
            <div class=\"actions-left\">${mediaButtons}</div>
            <div class=\"actions-right\">${dialogButtons}${toggleButtons}</div>
          </div>
        </div>
      </ha-card>
    `;

    const cardNode = this.shadowRoot.querySelector("ha-card");
    if (cardNode) {
      cardNode.removeEventListener("click", this._boundOnCardClick);
      cardNode.addEventListener("click", this._boundOnCardClick);
    }

    this.shadowRoot.querySelectorAll("button.entity").forEach((button) => {
      button.removeEventListener("click", this._boundOnEntityClick);
      button.addEventListener("click", this._boundOnEntityClick);
    });
  }
}

class MinimalisticAreaCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._hass = null;
    this._config = deepClone(DEFAULT_CONFIG);
    this._activeTab = "general";
  }

  setConfig(config) {
    this._config = {
      ...deepClone(DEFAULT_CONFIG),
      ...(config || {}),
      styles: {
        ...deepClone(DEFAULT_CONFIG.styles),
        ...(config?.styles || {}),
      },
      tap_action: {
        ...deepClone(DEFAULT_CONFIG.tap_action),
        ...(config?.tap_action || {}),
      },
    };
    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  get hass() {
    return this._hass;
  }

  _emitConfig() {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      }),
    );
  }

  _update(path, value) {
    const next = deepClone(this._config);

    if (path.startsWith("styles.")) {
      const key = path.replace("styles.", "");
      next.styles = next.styles || {};
      if (value === "" || value === null || value === undefined) {
        delete next.styles[key];
      } else {
        next.styles[key] = value;
      }
    } else if (path.startsWith("tap_action.")) {
      const key = path.replace("tap_action.", "");
      next.tap_action = next.tap_action || {};
      if (value === "" || value === null || value === undefined) {
        delete next.tap_action[key];
      } else {
        next.tap_action[key] = value;
      }
    } else {
      if (value === "" || value === null || value === undefined) {
        delete next[path];
      } else {
        next[path] = value;
      }
    }

    this._config = next;
    this._emitConfig();
    this._render();
  }

  _renderTabButton(id, label) {
    return `<button class=\"tab ${this._activeTab === id ? "active" : ""}\" data-tab=\"${id}\">${label}</button>`;
  }

  _renderGeneralTab() {
    const areas = this._hass?.areas ? Object.values(this._hass.areas) : [];
    const options = areas
      .map((area) => `<option value=\"${area.area_id}\" ${this._config.area === area.area_id ? "selected" : ""}>${area.name}</option>`)
      .join("");

    return `
      <section class=\"panel\">
        <label>Titre</label>
        <input type=\"text\" data-path=\"title\" value=\"${safeText(this._config.title)}\" />

        <label>Area</label>
        <select data-path=\"area\">${options}</select>

        <label>Entites (une par ligne)</label>
        <textarea data-path=\"entities_text\" rows=\"5\">${safeText((this._config.entities || []).join("\n"))}</textarea>

        <div class=\"switches\">
          <label><input type=\"checkbox\" data-path=\"hide_unavailable\" ${this._config.hide_unavailable ? "checked" : ""} /> Masquer indisponibles</label>
          <label><input type=\"checkbox\" data-path=\"darken_image\" ${this._config.darken_image ? "checked" : ""} /> Assombrir image</label>
          <label><input type=\"checkbox\" data-path=\"shadow\" ${this._config.shadow ? "checked" : ""} /> Ombre icones</label>
          <label><input type=\"checkbox\" data-path=\"force_dialog\" ${this._config.force_dialog ? "checked" : ""} /> Forcer more-info</label>
          <label><input type=\"checkbox\" data-path=\"state_color\" ${this._config.state_color ? "checked" : ""} /> Couleur d'etat HA</label>
        </div>
      </section>
    `;
  }

  _renderActionsTab() {
    return `
      <section class=\"panel\">
        <label>Action au clic</label>
        <select data-path=\"tap_action.action\">
          <option value=\"more-info\" ${this._config.tap_action?.action === "more-info" ? "selected" : ""}>more-info</option>
          <option value=\"navigate\" ${this._config.tap_action?.action === "navigate" ? "selected" : ""}>navigate</option>
          <option value=\"toggle\" ${this._config.tap_action?.action === "toggle" ? "selected" : ""}>toggle</option>
          <option value=\"url\" ${this._config.tap_action?.action === "url" ? "selected" : ""}>url</option>
          <option value=\"call-service\" ${this._config.tap_action?.action === "call-service" ? "selected" : ""}>call-service</option>
          <option value=\"none\" ${this._config.tap_action?.action === "none" ? "selected" : ""}>none</option>
        </select>

        <label>Chemin navigation</label>
        <input type=\"text\" data-path=\"tap_action.navigation_path\" value=\"${safeText(this._config.tap_action?.navigation_path)}\" />

        <label>Image (URL ou /local/...)</label>
        <input type=\"text\" data-path=\"image\" value=\"${safeText(this._config.image)}\" />
      </section>
    `;
  }

  _renderStyleInput(label, path) {
    const key = path.replace("styles.", "");
    const value = this._config.styles?.[key] ?? "";
    return `
      <label>${label}</label>
      <input type=\"text\" data-path=\"${path}\" value=\"${safeText(value)}\" />
    `;
  }

  _renderStylesTab() {
    return `
      <section class=\"panel\">
        ${this._renderStyleInput("Couleur icone ON", "styles.button_icon_color_on")}
        ${this._renderStyleInput("Couleur icone OFF", "styles.button_icon_color_off")}
        ${this._renderStyleInput("Couleur texte badge", "styles.badge_text_color")}
        ${this._renderStyleInput("Couleur lumiere ON", "styles.button_light_color_on")}
        ${this._renderStyleInput("Fond badge", "styles.badge_background")}
        ${this._renderStyleInput("Poids titre", "styles.title_font_weight")}
        ${this._renderStyleInput("Transformation titre", "styles.title_text_transform")}
        ${this._renderStyleInput("Ombre titre", "styles.title_text_shadow")}
        ${this._renderStyleInput("Flou image", "styles.image_blur")}
      </section>
    `;
  }

  _renderDefaultsTab() {
    return `
      <section class=\"panel\">
        <pre>${safeText(JSON.stringify(DEFAULT_CONFIG, null, 2))}</pre>
      </section>
    `;
  }

  _renderActivePanel() {
    if (this._activeTab === "general") {
      return this._renderGeneralTab();
    }
    if (this._activeTab === "actions") {
      return this._renderActionsTab();
    }
    if (this._activeTab === "styles") {
      return this._renderStylesTab();
    }
    return this._renderDefaultsTab();
  }

  _wireEvents() {
    this.shadowRoot.querySelectorAll(".tab").forEach((button) => {
      button.addEventListener("click", () => {
        this._activeTab = button.dataset.tab;
        this._render();
      });
    });

    this.shadowRoot.querySelectorAll("input[data-path], select[data-path], textarea[data-path]").forEach((element) => {
      const path = element.dataset.path;
      const eventName = element.tagName === "SELECT" || element.type === "checkbox" ? "change" : "input";
      element.addEventListener(eventName, (event) => {
        if (path === "entities_text") {
          this._update("entities", parseEntitiesText(event.target.value));
          return;
        }

        if (element.type === "checkbox") {
          this._update(path, Boolean(event.target.checked));
          return;
        }

        this._update(path, event.target.value);
      });
    });
  }

  _render() {
    if (!this.shadowRoot) {
      return;
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          font-family: "Segoe UI", "Noto Sans", sans-serif;
          color: var(--primary-text-color, #e5e7eb);
        }

        .editor {
          border-radius: 14px;
          background:
            radial-gradient(circle at top right, rgba(56, 189, 248, 0.22), transparent 42%),
            linear-gradient(135deg, rgba(17, 24, 39, 0.95), rgba(31, 41, 55, 0.95));
          border: 1px solid rgba(56, 189, 248, 0.35);
          padding: 12px;
        }

        .tabs {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 6px;
          margin-bottom: 10px;
        }

        .tab {
          border: 1px solid rgba(56, 189, 248, 0.25);
          background: rgba(15, 23, 42, 0.55);
          color: var(--primary-text-color, #f9fafb);
          border-radius: 10px;
          padding: 8px 10px;
          cursor: pointer;
          font-size: 0.78rem;
          transition: transform 120ms ease, background 120ms ease;
        }

        .tab.active {
          background: rgba(0, 174, 239, 0.3);
          border-color: rgba(0, 174, 239, 0.6);
          transform: translateY(-1px);
        }

        .panel {
          display: grid;
          gap: 8px;
        }

        label {
          font-size: 0.76rem;
          letter-spacing: 0.02em;
          opacity: 0.9;
        }

        input,
        select,
        textarea {
          width: 100%;
          border-radius: 10px;
          border: 1px solid rgba(148, 163, 184, 0.35);
          background: rgba(2, 6, 23, 0.38);
          color: var(--primary-text-color, #f8fafc);
          padding: 8px 10px;
          outline: none;
          font-size: 0.84rem;
        }

        textarea {
          resize: vertical;
          min-height: 80px;
        }

        input:focus,
        select:focus,
        textarea:focus {
          border-color: rgba(0, 174, 239, 0.75);
          box-shadow: 0 0 0 2px rgba(0, 174, 239, 0.2);
        }

        .switches {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 6px;
          margin-top: 4px;
        }

        .switches label {
          display: flex;
          align-items: center;
          gap: 8px;
          border: 1px solid rgba(148, 163, 184, 0.24);
          border-radius: 10px;
          padding: 8px;
          background: rgba(2, 6, 23, 0.28);
        }

        .switches input {
          width: auto;
          margin: 0;
        }

        pre {
          margin: 0;
          white-space: pre-wrap;
          font-size: 0.73rem;
          line-height: 1.35;
          background: rgba(2, 6, 23, 0.4);
          border: 1px solid rgba(148, 163, 184, 0.25);
          padding: 10px;
          border-radius: 10px;
          max-height: 260px;
          overflow: auto;
        }

        @media (max-width: 720px) {
          .tabs {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }

          .switches {
            grid-template-columns: 1fr;
          }
        }
      </style>

      <div class=\"editor\">
        <div class=\"tabs\">
          ${this._renderTabButton("general", "General")}
          ${this._renderTabButton("actions", "Actions")}
          ${this._renderTabButton("styles", "Styles")}
          ${this._renderTabButton("defaults", "Defaults")}
        </div>
        ${this._renderActivePanel()}
      </div>
    `;

    this._wireEvents();
  }
}

if (!customElements.get(CARD_TYPE)) {
  customElements.define(CARD_TYPE, MinimalisticAreaCard);
}
if (!customElements.get(CARD_EDITOR_TYPE)) {
  customElements.define(CARD_EDITOR_TYPE, MinimalisticAreaCardEditor);
}

window.customCards = window.customCards || [];
if (!window.customCards.find((card) => card.type === CARD_TYPE)) {
  window.customCards.push({
    type: CARD_TYPE,
    name: "Alpha Area Card",
    description: "Carte area rapide avec editeur visuel, actions et styles personnalises.",
    preview: true,
  });
}

