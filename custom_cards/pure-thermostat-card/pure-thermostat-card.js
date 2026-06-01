const CARD_TYPE = "pure-thermostat-card"
const CARD_EDITOR_TYPE = "pure-thermostat-card-editor"

const DEFAULT_CONFIG = {
  entity: "",
  name: "",
  icon: "mdi:thermostat",
  temperature_step: 0.5,
  precision: 1,
  selector_size: 12,
  show_title: true,
  show_background: true,
  show_current_temp: true,
  show_plus_minus: true,
  show_mode_buttons: true,
  mode_whitelist: [],
  tap_action: {
    action: "more-info",
  },
  style: {
    preset: "navbar_popup",
    shape: "rounded",
    appearance: "glass",
    size: "comfortable",
    elevation: "soft",
    auto_text_contrast: true,
    active_color: "#ff7a1a",
    inactive_color: "rgba(255,255,255,0.45)",
    background_color: "rgba(17,24,39,0.78)",
    text_color: "#f9fafb",
  },
}

const PRESET_STYLES = {
  modern: {
    border: "1px solid rgba(255, 255, 255, 0.12)",
    overlay: "linear-gradient(160deg, rgba(255,255,255,0.10), rgba(255,255,255,0.02))",
  },
  minimal: {
    border: "1px solid rgba(255, 255, 255, 0.08)",
    overlay: "none",
  },
  soft: {
    border: "1px solid rgba(56, 189, 248, 0.30)",
    overlay: "linear-gradient(150deg, rgba(56,189,248,0.18), rgba(17,24,39,0.02))",
  },
  navbar_popup: {
    border: "1px solid rgba(255, 255, 255, 0.14)",
    overlay: "linear-gradient(145deg, rgba(17,24,39,0.55), rgba(31,41,55,0.26))",
  },
}

const MODE_LABELS = {
  off: "Off",
  heat: "Heating",
  cool: "Cooling",
  auto: "Auto",
  dry: "Dry",
  fan_only: "Fan",
  heat_cool: "Heat/Cool",
}

const MODE_ICONS = {
  off: "mdi:power",
  heat: "mdi:fire",
  cool: "mdi:snowflake",
  auto: "mdi:autorenew",
  dry: "mdi:water-percent",
  fan_only: "mdi:fan",
  heat_cool: "mdi:thermostat-auto",
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min
  return Math.min(max, Math.max(min, value))
}

function deepMerge(base, patch) {
  const output = structuredClone(base)
  const stack = [[output, patch]]

  while (stack.length) {
    const [target, source] = stack.pop()
    if (!source || typeof source !== "object") continue

    Object.keys(source).forEach((key) => {
      const sourceValue = source[key]
      if (
        sourceValue &&
        typeof sourceValue === "object" &&
        !Array.isArray(sourceValue) &&
        target[key] &&
        typeof target[key] === "object" &&
        !Array.isArray(target[key])
      ) {
        stack.push([target[key], sourceValue])
        return
      }
      target[key] = sourceValue
    })
  }

  return output
}

class PureThermostatCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" })
    this._config = structuredClone(DEFAULT_CONFIG)
    this._hass = null
    this._boundClick = this._handleClick.bind(this)
  }

  connectedCallback() {
    this.addEventListener("click", this._boundClick)
  }

  disconnectedCallback() {
    this.removeEventListener("click", this._boundClick)
  }

  setConfig(config) {
    if (!config || !config.entity) {
      throw new Error("Property 'entity' (climate.*) is required")
    }

    if (!String(config.entity).startsWith("climate.")) {
      throw new Error("Property 'entity' must target a climate entity")
    }

    const merged = deepMerge(DEFAULT_CONFIG, config)
    merged.temperature_step = Number(merged.temperature_step) || 0.5
    merged.precision = Number.isFinite(Number(merged.precision)) ? Number(merged.precision) : 1
    merged.selector_size = clamp(Number(merged.selector_size) || 12, 8, 22)
    merged.mode_whitelist = Array.isArray(merged.mode_whitelist) ? merged.mode_whitelist : []

    this._config = merged
    this._render()
  }

  set hass(hass) {
    this._hass = hass
    this._render()
  }

  getCardSize() {
    return 4
  }

  static getConfigElement() {
    return document.createElement(CARD_EDITOR_TYPE)
  }

  static getStubConfig() {
    return {
      type: `custom:${CARD_TYPE}`,
      entity: "climate.living_room",
      name: "Salon",
      temperature_step: 0.5,
      style: {
        preset: "navbar_popup",
        appearance: "glass",
        active_color: "#ff7a1a",
      },
    }
  }

  static getGridOptions() {
    return {
      columns: 6,
      min_columns: 4,
      rows: 4,
      min_rows: 4,
    }
  }

  _getClimateEntity() {
    return this._hass?.states?.[this._config.entity]
  }

  _getMinTemp(climate) {
    const cfgMin = Number(this._config.min_temp)
    if (Number.isFinite(cfgMin)) return cfgMin
    const attrMin = Number(climate?.attributes?.min_temp)
    if (Number.isFinite(attrMin)) return attrMin
    return 7
  }

  _getMaxTemp(climate) {
    const cfgMax = Number(this._config.max_temp)
    if (Number.isFinite(cfgMax)) return cfgMax
    const attrMax = Number(climate?.attributes?.max_temp)
    if (Number.isFinite(attrMax)) return attrMax
    return 35
  }

  _getTargetTemp(climate) {
    const value = Number(climate?.attributes?.temperature)
    return Number.isFinite(value) ? value : null
  }

  _getCurrentTemp(climate) {
    const value = Number(climate?.attributes?.current_temperature)
    return Number.isFinite(value) ? value : null
  }

  _getActionLabel(climate) {
    const action = String(climate?.attributes?.hvac_action || "").toLowerCase()
    const mode = String(climate?.state || "").toLowerCase()
    if (action === "heating") return "Heating"
    if (action === "cooling") return "Cooling"
    if (action === "drying") return "Drying"
    if (action === "fan") return "Fan"
    return MODE_LABELS[mode] || "Idle"
  }

  _getAvailableModes(climate) {
    const fromEntity = Array.isArray(climate?.attributes?.hvac_modes)
      ? climate.attributes.hvac_modes
      : []

    const whitelist = Array.isArray(this._config.mode_whitelist) ? this._config.mode_whitelist : []

    if (!whitelist.length) return fromEntity

    const allow = new Set(whitelist.map((value) => String(value).trim()).filter(Boolean))
    return fromEntity.filter((mode) => allow.has(mode))
  }

  _modeFallback(modes, currentMode) {
    if (currentMode !== "off") return currentMode
    const firstOn = modes.find((mode) => mode !== "off")
    return firstOn || "heat"
  }

  _toPolar(cx, cy, radius, angleDeg) {
    const rad = ((angleDeg - 90) * Math.PI) / 180
    return {
      x: cx + radius * Math.cos(rad),
      y: cy + radius * Math.sin(rad),
    }
  }

  _arcPath(cx, cy, radius, startAngle, endAngle) {
    const start = this._toPolar(cx, cy, radius, endAngle)
    const end = this._toPolar(cx, cy, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
    return `M ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`
  }

  _escape(text) {
    return String(text ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
  }

  _formatTemp(value) {
    const precision = Math.max(0, Math.min(3, Number(this._config.precision) || 0))
    if (!Number.isFinite(value)) return "--"
    return Number(value).toFixed(precision)
  }

  _isHexColor(color) {
    return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(String(color || "").trim())
  }

  _contrastTextForHex(hexColor) {
    const normalized = String(hexColor || "").trim()
    if (!this._isHexColor(normalized)) return null

    const full =
      normalized.length === 4
        ? `#${normalized[1]}${normalized[1]}${normalized[2]}${normalized[2]}${normalized[3]}${normalized[3]}`
        : normalized

    const r = parseInt(full.slice(1, 3), 16)
    const g = parseInt(full.slice(3, 5), 16)
    const b = parseInt(full.slice(5, 7), 16)
    const luma = (0.299 * r + 0.587 * g + 0.114 * b) / 255
    return luma > 0.64 ? "#111827" : "#f9fafb"
  }

  _dispatchMoreInfo(entityId) {
    this.dispatchEvent(
      new CustomEvent("hass-more-info", {
        detail: { entityId },
        bubbles: true,
        composed: true,
      })
    )
  }

  async _changeTemperature(delta) {
    const climate = this._getClimateEntity()
    if (!climate || !this._hass?.callService) return

    const attrs = climate.attributes || {}
    const minTemp = this._getMinTemp(climate)
    const maxTemp = this._getMaxTemp(climate)

    if (Number.isFinite(attrs.target_temp_low) && Number.isFinite(attrs.target_temp_high)) {
      const low = clamp(Number(attrs.target_temp_low) + delta, minTemp, maxTemp)
      const high = clamp(Number(attrs.target_temp_high) + delta, minTemp, maxTemp)
      await this._hass.callService("climate", "set_temperature", {
        entity_id: this._config.entity,
        target_temp_low: low,
        target_temp_high: high,
      })
      return
    }

    const currentTarget = this._getTargetTemp(climate)
    const safeTarget = Number.isFinite(currentTarget) ? currentTarget : minTemp
    const nextTarget = clamp(safeTarget + delta, minTemp, maxTemp)

    await this._hass.callService("climate", "set_temperature", {
      entity_id: this._config.entity,
      temperature: nextTarget,
    })
  }

  async _setMode(mode) {
    if (!mode || !this._hass?.callService) return
    await this._hass.callService("climate", "set_hvac_mode", {
      entity_id: this._config.entity,
      hvac_mode: mode,
    })
  }

  async _togglePower() {
    const climate = this._getClimateEntity()
    if (!climate) return
    const currentMode = String(climate.state || "").toLowerCase()
    const modes = this._getAvailableModes(climate)

    if (currentMode === "off") {
      const nextMode = this._modeFallback(modes, currentMode)
      await this._setMode(nextMode)
      return
    }

    if (modes.includes("off")) {
      await this._setMode("off")
    }
  }

  _handleClick(event) {
    const actionEl = event.target?.closest?.("[data-action]")
    if (!actionEl) return

    event.preventDefault()
    event.stopPropagation()

    const action = actionEl.dataset.action
    const step = Number(this._config.temperature_step) || 0.5

    if (action === "temp-down") {
      this._changeTemperature(-step)
      return
    }

    if (action === "temp-up") {
      this._changeTemperature(step)
      return
    }

    if (action === "mode") {
      this._setMode(actionEl.dataset.mode)
      return
    }

    if (action === "power") {
      this._togglePower()
      return
    }

    if (action === "more-info") {
      const targetEntity = this._config?.tap_action?.entity || this._config.entity
      this._dispatchMoreInfo(targetEntity)
    }
  }

  _renderModes(modes, currentMode) {
    if (!this._config.show_mode_buttons || !modes.length) return ""

    return `
      <div class="modes" role="group" aria-label="HVAC modes">
        ${modes
          .map((mode) => {
            const selected = mode === currentMode
            const icon = MODE_ICONS[mode] || "mdi:help-circle"
            const label = MODE_LABELS[mode] || mode
            return `
              <button
                class="mode-btn ${selected ? "active" : ""}"
                data-action="mode"
                data-mode="${this._escape(mode)}"
                title="${this._escape(label)}"
                type="button"
              >
                <ha-icon icon="${this._escape(icon)}"></ha-icon>
              </button>
            `
          })
          .join("")}
      </div>
    `
  }

  _render() {
    if (!this.shadowRoot) return

    const climate = this._getClimateEntity()
    const style = this._config.style || {}
    const preset = PRESET_STYLES[style.preset] || PRESET_STYLES.navbar_popup
    const minTemp = this._getMinTemp(climate)
    const maxTemp = this._getMaxTemp(climate)
    const targetTemp = this._getTargetTemp(climate)
    const currentTemp = this._getCurrentTemp(climate)
    const currentMode = String(climate?.state || "off").toLowerCase()
    const actionLabel = this._getActionLabel(climate)
    const availableModes = this._getAvailableModes(climate)
    const showBackground = this._config.show_background !== false
    const showTitle = this._config.show_title !== false
    const selectorSize = clamp(Number(this._config.selector_size) || 12, 8, 22)

    const clampedTarget = Number.isFinite(targetTemp)
      ? clamp(targetTemp, minTemp, maxTemp)
      : minTemp
    const progress = (clampedTarget - minTemp) / Math.max(1, maxTemp - minTemp)
    const percent = clamp(progress, 0, 1)

    const arcStart = 135
    const arcEnd = 405
    const activeEnd = arcStart + 270 * percent

    const trackPath = this._arcPath(100, 100, 76, arcStart, arcEnd)
    const activePath = this._arcPath(100, 100, 76, arcStart, activeEnd)
    const knob = this._toPolar(100, 100, 76, activeEnd)

    const autoText = style.auto_text_contrast
      ? this._contrastTextForHex(style.background_color)
      : null

    const textColor = autoText || style.text_color || DEFAULT_CONFIG.style.text_color

    const showUnavailable = !climate || ["unknown", "unavailable"].includes(climate.state)
    const title =
      this._config.name || climate?.attributes?.friendly_name || this._config.entity || "Thermostat"

    const icon = this._config.icon || "mdi:thermostat"
    const sizeClass = style.size || "comfortable"
    const shapeClass = style.shape || "rounded"
    const appearanceClass = style.appearance || "glass"
    const elevationClass = style.elevation || "soft"

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        ha-card {
          position: relative;
          overflow: hidden;
          border-radius: 18px;
          border: ${showBackground ? preset.border : "none"};
          background: ${
            showBackground
              ? style.background_color || DEFAULT_CONFIG.style.background_color
              : "transparent"
          };
          color: ${textColor};
          padding: ${showBackground ? "14px 14px 10px" : "0"};
          isolation: isolate;
        }

        ha-card.no-background {
          box-shadow: none;
          backdrop-filter: none;
        }

        .overlay {
          position: absolute;
          inset: 0;
          background: ${preset.overlay};
          pointer-events: none;
          z-index: 0;
          display: ${showBackground ? "block" : "none"};
        }

        .content {
          position: relative;
          z-index: 1;
          display: grid;
          gap: 10px;
        }

        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }

        .title-wrap {
          min-width: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .title {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          font-size: 0.95rem;
          letter-spacing: 0.01em;
        }

        .status {
          font-size: 0.78rem;
          color: ${style.active_color || DEFAULT_CONFIG.style.active_color};
          font-weight: 700;
          text-transform: capitalize;
        }

        .dial-wrap {
          display: grid;
          place-items: center;
          position: relative;
          min-height: 340px;
          margin-top: 0;
        }

        .glow {
          position: absolute;
          width: 260px;
          height: 260px;
          border-radius: 50%;
          background: radial-gradient(circle, color-mix(in srgb, ${style.active_color || DEFAULT_CONFIG.style.active_color} 34%, transparent) 0%, transparent 72%);
          filter: blur(8px);
          opacity: ${currentMode === "off" ? "0.22" : "0.56"};
          pointer-events: none;
        }

        svg {
          width: 260px;
          height: 260px;
        }

        .track {
          fill: none;
          stroke: color-mix(in srgb, ${style.inactive_color || DEFAULT_CONFIG.style.inactive_color} 50%, transparent);
          stroke-width: 14;
          stroke-linecap: round;
        }

        .active {
          fill: none;
          stroke: ${style.active_color || DEFAULT_CONFIG.style.active_color};
          stroke-width: 14;
          stroke-linecap: round;
          transition: d 180ms ease;
        }

        .knob {
          fill: ${style.active_color || DEFAULT_CONFIG.style.active_color};
          stroke: rgba(255, 255, 255, 0.9);
          stroke-width: 3;
        }

        .center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          display: grid;
          justify-items: center;
          gap: 4px;
          text-align: center;
        }

        .target {
          font-size: 3rem;
          line-height: 0.9;
          font-weight: 300;
          letter-spacing: -0.02em;
        }

        .target small {
          font-size: 1.6rem;
          opacity: 0.92;
          margin-left: 2px;
        }

        .current {
          font-size: 1.3rem;
          color: ${style.active_color || DEFAULT_CONFIG.style.active_color};
          font-weight: 700;
        }

        .buttons {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 12px;
        }

        .ctl-btn {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          border: 2px solid color-mix(in srgb, ${style.inactive_color || DEFAULT_CONFIG.style.inactive_color} 50%, transparent);
          background: transparent;
          color: ${textColor};
          font-size: 2.2rem;
          line-height: 1;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .ctl-btn:hover {
          border-color: ${style.active_color || DEFAULT_CONFIG.style.active_color};
          color: ${style.active_color || DEFAULT_CONFIG.style.active_color};
        }

        .modes {
          display: flex;
          justify-content: flex-start;
          gap: 12px;
          flex: 1;
        }

        .modes-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 12px;
          margin-top: 16px;
        }

        .mode-btn {
          flex: 1;
          border: none;
          min-height: 48px;
          border-radius: 12px;
          background: transparent;
          color: ${style.inactive_color || DEFAULT_CONFIG.style.inactive_color};
          cursor: pointer;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          font-size: 0.75rem;
          transition: all 0.2s ease;
        }

        .mode-btn.active {
          color: #fff;
          background: ${style.active_color || DEFAULT_CONFIG.style.active_color};
          font-weight: 600;
        }

        .mode-btn ha-icon {
          --mdc-icon-size: 24px;
        }

        .power-btn {
          width: 48px;
          height: 48px;
          border-radius: 12px;
          border: none;
          background: color-mix(in srgb, ${style.inactive_color || DEFAULT_CONFIG.style.inactive_color} 30%, transparent);
          color: ${textColor};
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .power-btn:hover {
          background: color-mix(in srgb, ${style.inactive_color || DEFAULT_CONFIG.style.inactive_color} 50%, transparent);
        }

        .power-btn ha-icon {
          --mdc-icon-size: 24px;
        }

        .icon-btn {
          border: none;
          background: transparent;
          color: ${textColor};
          cursor: pointer;
          padding: 0;
        }

        .icon-btn ha-icon {
          --mdc-icon-size: 20px;
          opacity: 0.9;
        }

        .unavailable {
          padding: 20px 10px;
          text-align: center;
          color: var(--error-color, #ef4444);
        }

        .compact ha-card {
          padding: 10px;
        }

        .compact .dial-wrap {
          min-height: 248px;
        }

        .large .dial-wrap {
          min-height: 320px;
        }

        .rounded ha-card {
          border-radius: 18px;
        }

        .square ha-card {
          border-radius: 6px;
        }

        .pill ha-card {
          border-radius: 26px;
        }

        .solid ha-card {
          backdrop-filter: none;
        }

        .glass ha-card {
          backdrop-filter: blur(14px) saturate(120%);
        }

        .outline ha-card {
          border-color: color-mix(in srgb, ${style.active_color || DEFAULT_CONFIG.style.active_color} 55%, transparent);
        }

        .flat ha-card {
          box-shadow: none;
        }

        .soft ha-card {
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.28);
        }

        .lifted ha-card {
          box-shadow: 0 18px 38px rgba(0, 0, 0, 0.34);
        }

        @media (max-width: 640px) {
          .target {
            font-size: 2.6rem;
          }

          .modes {
            grid-template-columns: repeat(2, minmax(0, 1fr));
          }
        }
      </style>

      <div class="${this._escape(sizeClass)} ${this._escape(shapeClass)} ${this._escape(appearanceClass)} ${this._escape(elevationClass)}">
        <ha-card class="${showBackground ? "" : "no-background"}">
          <div class="overlay"></div>
          <div class="content">
            ${
              showTitle
                ? `<div class="header">
              <div class="title-wrap">
                <ha-icon icon="${this._escape(icon)}"></ha-icon>
                <div class="title">${this._escape(title)}</div>
              </div>
              <button type="button" class="icon-btn" data-action="more-info" title="More info">
                <ha-icon icon="mdi:dots-vertical"></ha-icon>
              </button>
            </div>`
                : ""
            }

            ${
              showUnavailable
                ? `<div class="unavailable">Entity unavailable: ${this._escape(this._config.entity)}</div>`
                : `
                <div class="dial-wrap">
                  <div class="glow"></div>
                  <svg viewBox="0 0 200 200" aria-hidden="true">
                    <path class="track" d="${trackPath}"></path>
                    <path class="active" d="${activePath}"></path>
                    <circle class="knob" cx="${knob.x}" cy="${knob.y}" r="${selectorSize}"></circle>
                  </svg>
                  <div class="center">
                    <div class="status">${this._escape(actionLabel)}</div>
                    <div class="target">${this._formatTemp(targetTemp)}<small>°C</small></div>
                    ${this._config.show_current_temp ? `<div class="current">${this._formatTemp(currentTemp)} °C</div>` : ""}
                  </div>
                </div>

                ${
                  this._config.show_plus_minus
                    ? `
                    <div class="buttons">
                      <button type="button" class="ctl-btn" data-action="temp-down" aria-label="Decrease temperature">−</button>
                      <button type="button" class="ctl-btn" data-action="temp-up" aria-label="Increase temperature">+</button>
                    </div>
                  `
                    : ""
                }

                ${
                  this._config.show_mode_buttons
                    ? `
                    <div class="modes-bottom">
                      <div class="modes" role="group" aria-label="HVAC modes">
                        ${
                          availableModes.length
                            ? availableModes
                                .slice(0, 1)
                                .map((mode) => {
                                  const selected = mode === currentMode
                                  const icon = MODE_ICONS[mode] || "mdi:help-circle"
                                  const label = MODE_LABELS[mode] || mode
                                  return `
                            <button
                              class="mode-btn ${selected ? "active" : ""}"
                              data-action="mode"
                              data-mode="${this._escape(mode)}"
                              title="${this._escape(label)}"
                              type="button"
                            >
                              <ha-icon icon="${this._escape(icon)}"></ha-icon>
                              <span>${this._escape(label)}</span>
                            </button>
                          `
                                })
                                .join("")
                            : ""
                        }
                      </div>
                      <button type="button" class="power-btn" data-action="power" title="Toggle power">
                        <ha-icon icon="${currentMode === "off" ? "mdi:power-off" : "mdi:power"}"></ha-icon>
                      </button>
                    </div>
                  `
                    : ""
                }
              `
            }
          </div>
        </ha-card>
      </div>
    `
  }
}

class PureThermostatCardEditor extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" })
    this._hass = null
    this._config = structuredClone(DEFAULT_CONFIG)
    this._rendered = false
  }

  set hass(hass) {
    this._hass = hass
    if (!this._rendered) {
      this._render()
      return
    }
    this._applyHassToPickers()
  }

  setConfig(config) {
    this._config = deepMerge(DEFAULT_CONFIG, config || {})
    if (!this._rendered) {
      this._render()
    }
  }

  _emit() {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    )
  }

  _escape(text) {
    return String(text ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
  }

  _get(path, fallback = "") {
    const parts = path.split(".")
    let node = this._config
    for (let index = 0; index < parts.length; index += 1) {
      node = node?.[parts[index]]
      if (node === undefined || node === null) {
        return fallback
      }
    }
    return node
  }

  _set(path, value) {
    const updated = structuredClone(this._config)
    const parts = path.split(".")
    let node = updated

    for (let index = 0; index < parts.length - 1; index += 1) {
      const key = parts[index]
      if (!node[key] || typeof node[key] !== "object") node[key] = {}
      node = node[key]
    }

    node[parts[parts.length - 1]] = value
    this._config = updated
    this._emit()
  }

  _remove(path) {
    const updated = structuredClone(this._config)
    const parts = path.split(".")
    let node = updated

    for (let index = 0; index < parts.length - 1; index += 1) {
      node = node?.[parts[index]]
      if (!node) return
    }

    delete node[parts[parts.length - 1]]
    this._config = updated
    this._emit()
  }

  _toHexColor(value, fallback = "#00aeef") {
    const normalized = String(value || "").trim()
    if (/^#([0-9a-fA-F]{6})$/.test(normalized)) return normalized
    if (/^#([0-9a-fA-F]{3})$/.test(normalized)) {
      const [r, g, b] = normalized.slice(1).split("")
      return `#${r}${r}${g}${g}${b}${b}`
    }
    return fallback
  }

  _renderColorField(label, path, fallback) {
    const value = this._get(path, "")
    const hex = this._toHexColor(value, fallback)

    return `
      <div class="color-field">
        <label>${this._escape(label)}</label>
        <div class="color-row">
          <input type="color" class="js-color" data-path="${this._escape(path)}" value="${this._escape(hex)}" />
          <input type="text" class="js-input" data-path="${this._escape(path)}" data-kind="text" value="${this._escape(value)}" placeholder="var(--primary-color, #00AEEF)" />
        </div>
      </div>
    `
  }

  _render() {
    if (!this.shadowRoot) return

    // Prevent destroying DOM when already rendered (keeps accordions open)
    if (this.shadowRoot.innerHTML.trim() !== "") {
      return
    }

    const modeWhitelist = Array.isArray(this._config.mode_whitelist)
      ? this._config.mode_whitelist.join(", ")
      : ""

    this.shadowRoot.innerHTML = `
      <style>
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

        .grid-2 {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 8px;
        }

        .color-field {
          display: grid;
          gap: 6px;
        }

        .color-row {
          display: grid;
          grid-template-columns: 54px 1fr;
          gap: 8px;
          align-items: center;
        }

        .hint {
          font-size: 0.78rem;
          color: var(--secondary-text-color, #9ca3af);
        }

        .line-checkbox {
          display: flex;
          gap: 8px;
          align-items: center;
        }

        .line-checkbox input {
          width: auto;
          margin: 0;
        }

        ha-icon-picker,
        ha-entity-picker {
          width: 100%;
        }

        @media (max-width: 720px) {
          .grid-2 {
            grid-template-columns: 1fr;
          }
        }
      </style>

      <div class="form">
        <details open>
          <summary>General</summary>
          <div class="section-content">
            <label>Climate Entity</label>
            <ha-entity-picker
              class="js-entity"
              data-path="entity"
              value="${this._escape(this._get("entity", ""))}"
              allow-custom-entity
            ></ha-entity-picker>

            <label>Name (optional)</label>
            <input class="js-input" data-path="name" data-kind="text" value="${this._escape(this._get("name", ""))}" />

            <label>Icon</label>
            <ha-icon-picker
              class="js-icon"
              data-path="icon"
              value="${this._escape(this._get("icon", "mdi:thermostat"))}"
            ></ha-icon-picker>

            <div class="grid-2">
              <div>
                <label>Temperature Step (degC)</label>
                <input class="js-input" data-path="temperature_step" data-kind="number" type="number" min="0.1" step="0.1" value="${this._escape(this._get("temperature_step", 0.5))}" />
              </div>
              <div>
                <label>Precision</label>
                <input class="js-input" data-path="precision" data-kind="number" type="number" min="0" max="3" step="1" value="${this._escape(this._get("precision", 1))}" />
              </div>
            </div>

            <label>Selector dot size</label>
            <div style="display: flex; gap: 10px; align-items: center;">
              <input class="js-input" data-path="selector_size" data-kind="number" type="range" min="8" max="22" step="1" value="${this._escape(this._get("selector_size", 12))}" style="flex: 1;" />
              <span style="min-width: 30px; text-align: center; font-weight: 600; color: #38bdf8;">${this._escape(this._get("selector_size", 12))}</span>
            </div>

            <label class="line-checkbox">
              <input class="js-input" data-path="show_title" data-kind="boolean" type="checkbox" ${this._get("show_title", true) ? "checked" : ""} />
              Show title/header
            </label>

            <label class="line-checkbox">
              <input class="js-input" data-path="show_background" data-kind="boolean" type="checkbox" ${this._get("show_background", true) ? "checked" : ""} />
              Show background/card frame
            </label>

            <label class="line-checkbox">
              <input class="js-input" data-path="show_current_temp" data-kind="boolean" type="checkbox" ${this._get("show_current_temp", true) ? "checked" : ""} />
              Show current temperature
            </label>

            <label class="line-checkbox">
              <input class="js-input" data-path="show_plus_minus" data-kind="boolean" type="checkbox" ${this._get("show_plus_minus", true) ? "checked" : ""} />
              Show plus/minus buttons
            </label>

            <label class="line-checkbox">
              <input class="js-input" data-path="show_mode_buttons" data-kind="boolean" type="checkbox" ${this._get("show_mode_buttons", true) ? "checked" : ""} />
              Show mode buttons
            </label>
          </div>
        </details>

        <details>
          <summary>Actions</summary>
          <div class="section-content">
            <label>Tap Action</label>
            <select class="js-input" data-path="tap_action.action" data-kind="text">
              <option value="more-info" ${this._get("tap_action.action", "more-info") === "more-info" ? "selected" : ""}>more-info</option>
              <option value="none" ${this._get("tap_action.action", "more-info") === "none" ? "selected" : ""}>none</option>
            </select>

            <label>Tap Entity (optional)</label>
            <ha-entity-picker
              class="js-entity"
              data-path="tap_action.entity"
              value="${this._escape(this._get("tap_action.entity", ""))}"
              allow-custom-entity
            ></ha-entity-picker>
          </div>
        </details>

        <details>
          <summary>Styles</summary>
          <div class="section-content">
            <div class="grid-2">
              <div>
                <label>Preset</label>
                <select class="js-input" data-path="style.preset" data-kind="text">
                  <option value="modern" ${this._get("style.preset") === "modern" ? "selected" : ""}>modern</option>
                  <option value="minimal" ${this._get("style.preset") === "minimal" ? "selected" : ""}>minimal</option>
                  <option value="soft" ${this._get("style.preset") === "soft" ? "selected" : ""}>soft</option>
                  <option value="navbar_popup" ${this._get("style.preset") === "navbar_popup" ? "selected" : ""}>navbar_popup</option>
                </select>
              </div>
              <div>
                <label>Shape</label>
                <select class="js-input" data-path="style.shape" data-kind="text">
                  <option value="rounded" ${this._get("style.shape") === "rounded" ? "selected" : ""}>rounded</option>
                  <option value="square" ${this._get("style.shape") === "square" ? "selected" : ""}>square</option>
                  <option value="pill" ${this._get("style.shape") === "pill" ? "selected" : ""}>pill</option>
                </select>
              </div>
            </div>

            <div class="grid-2">
              <div>
                <label>Appearance</label>
                <select class="js-input" data-path="style.appearance" data-kind="text">
                  <option value="solid" ${this._get("style.appearance") === "solid" ? "selected" : ""}>solid</option>
                  <option value="glass" ${this._get("style.appearance") === "glass" ? "selected" : ""}>glass</option>
                  <option value="outline" ${this._get("style.appearance") === "outline" ? "selected" : ""}>outline</option>
                </select>
              </div>
              <div>
                <label>Size</label>
                <select class="js-input" data-path="style.size" data-kind="text">
                  <option value="compact" ${this._get("style.size") === "compact" ? "selected" : ""}>compact</option>
                  <option value="comfortable" ${this._get("style.size") === "comfortable" ? "selected" : ""}>comfortable</option>
                  <option value="large" ${this._get("style.size") === "large" ? "selected" : ""}>large</option>
                </select>
              </div>
            </div>

            <label>Elevation</label>
            <select class="js-input" data-path="style.elevation" data-kind="text">
              <option value="flat" ${this._get("style.elevation") === "flat" ? "selected" : ""}>flat</option>
              <option value="soft" ${this._get("style.elevation") === "soft" ? "selected" : ""}>soft</option>
              <option value="lifted" ${this._get("style.elevation") === "lifted" ? "selected" : ""}>lifted</option>
            </select>

            ${this._renderColorField("Active Color", "style.active_color", "#ff7a1a")}
            ${this._renderColorField("Inactive Color", "style.inactive_color", "#9ca3af")}
            ${this._renderColorField("Background Color", "style.background_color", "#1f2937")}
            ${this._renderColorField("Text Color", "style.text_color", "#f9fafb")}

            <label class="line-checkbox">
              <input class="js-input" data-path="style.auto_text_contrast" data-kind="boolean" type="checkbox" ${this._get("style.auto_text_contrast", true) ? "checked" : ""} />
              Auto text contrast
            </label>
          </div>
        </details>

        <details>
          <summary>Defaults</summary>
          <div class="section-content">
            <div class="grid-2">
              <div>
                <label>Min Temperature Override</label>
                <input class="js-input" data-path="min_temp" data-kind="number-or-empty" type="number" step="0.1" value="${this._escape(this._get("min_temp", ""))}" />
              </div>
              <div>
                <label>Max Temperature Override</label>
                <input class="js-input" data-path="max_temp" data-kind="number-or-empty" type="number" step="0.1" value="${this._escape(this._get("max_temp", ""))}" />
              </div>
            </div>

            <label>Mode whitelist (comma separated)</label>
            <input class="js-input" data-path="mode_whitelist" data-kind="csv" value="${this._escape(modeWhitelist)}" placeholder="heat, off, cool" />
            <div class="hint">Leave empty to use all hvac_modes from the climate entity.</div>
          </div>
        </details>
      </div>
    `

    this._bindEditorEvents()
    this._rendered = true
  }

  _applyHassToPickers() {
    const entityPickers = this.shadowRoot.querySelectorAll(".js-entity")
    entityPickers.forEach((el) => {
      el.hass = this._hass
    })

    const iconPickers = this.shadowRoot.querySelectorAll(".js-icon")
    iconPickers.forEach((el) => {
      el.hass = this._hass
    })
  }

  _bindEditorEvents() {
    this._applyHassToPickers()

    const entityPickers = this.shadowRoot.querySelectorAll(".js-entity")
    const iconPickers = this.shadowRoot.querySelectorAll(".js-icon")

    const inputs = this.shadowRoot.querySelectorAll(".js-input")
    inputs.forEach((el) => {
      const handler = () => {
        const path = el.dataset.path
        const kind = el.dataset.kind || "text"

        if (!path) return

        if (kind === "boolean") {
          this._set(path, Boolean(el.checked))
          return
        }

        if (kind === "number") {
          const value = Number(el.value)
          this._set(path, Number.isFinite(value) ? value : 0)
          return
        }

        if (kind === "number-or-empty") {
          if (el.value === "") {
            this._remove(path)
            return
          }
          const value = Number(el.value)
          this._set(path, Number.isFinite(value) ? value : 0)
          return
        }

        if (kind === "csv") {
          const list = String(el.value || "")
            .split(",")
            .map((item) => item.trim())
            .filter(Boolean)
          this._set(path, list)
          return
        }

        const value = String(el.value || "")
        if (!value) {
          this._remove(path)
          return
        }
        this._set(path, value)
      }

      const eventType = el.type === "checkbox" || el.tagName === "SELECT" ? "change" : "input"
      el.addEventListener(eventType, handler)
    })

    entityPickers.forEach((el) => {
      el.addEventListener("value-changed", (event) => {
        const path = el.dataset.path
        if (!path) return
        const value = event.detail?.value || ""
        if (!value) {
          this._remove(path)
          return
        }
        this._set(path, value)
      })
    })

    iconPickers.forEach((el) => {
      el.addEventListener("value-changed", (event) => {
        const path = el.dataset.path
        if (!path) return
        const value = event.detail?.value || ""
        if (!value) {
          this._remove(path)
          return
        }
        this._set(path, value)
      })
    })

    const colorPickers = this.shadowRoot.querySelectorAll(".js-color")
    colorPickers.forEach((el) => {
      el.addEventListener("input", () => {
        const path = el.dataset.path
        if (!path) return
        this._set(path, el.value)
      })
    })
  }
}

if (!customElements.get(CARD_TYPE)) {
  customElements.define(CARD_TYPE, PureThermostatCard)
}

if (!customElements.get(CARD_EDITOR_TYPE)) {
  customElements.define(CARD_EDITOR_TYPE, PureThermostatCardEditor)
}

window.customCards = window.customCards || []
if (!window.customCards.some((entry) => entry?.type === CARD_TYPE)) {
  window.customCards.push({
    type: CARD_TYPE,
    name: "Pure Thermostat Card",
    description: "Minimal circular thermostat card with visual config editor and HVAC controls.",
    preview: true,
  })
}
