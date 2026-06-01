class ThermoHaloCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" })
    this._config = {}
    this._hass = null
    this._boundTap = this._handleTap.bind(this)
  }

  connectedCallback() {
    this.addEventListener("click", this._boundTap)
  }

  disconnectedCallback() {
    this.removeEventListener("click", this._boundTap)
  }

  setConfig(config) {
    if (!config) {
      throw new Error("Configuration required")
    }

    this._config = {
      temperature_entity: config.temperature_entity || "sensor.hvac_knx_temperature_piece_a_vivre",
      climate_entity: config.climate_entity || "climate.piece_a_vivre",
      current_label: config.current_label || "Temperature actuelle",
      target_label: config.target_label || "Temperature desiree",
      appearance: config.appearance || "base",
      decimals: Number.isFinite(config.decimals) ? config.decimals : 1,
      heat_color: config.heat_color || "#ff9a3c",
      cool_color: config.cool_color || "#32b8ff",
      idle_halo: config.idle_halo || "transparent",
      tap_action: config.tap_action || { action: "more-info" },
      ...config,
    }

    this._render()
  }

  set hass(hass) {
    this._hass = hass
    this._render()
  }

  getCardSize() {
    return 3
  }

  static getGridOptions() {
    return {
      columns: 4,
      rows: 3,
      min_columns: 3,
      min_rows: 3,
    }
  }

  _getDefaultActionEntity(preferClimate = false) {
    if (preferClimate) {
      return this._config?.climate_entity || this._config?.temperature_entity || ""
    }
    return this._config?.temperature_entity || this._config?.climate_entity || ""
  }

  _handleTap(ev) {
    // Ignore taps on editor/inner controls if any are added later.
    if (ev?.defaultPrevented) {
      return
    }

    const tapAction = this._config?.tap_action || { action: "more-info" }
    const action = (tapAction.action || "more-info").toLowerCase()

    if (action === "none") {
      return
    }

    if (action === "more-info") {
      const entityId = tapAction.entity || this._getDefaultActionEntity(false)
      if (!entityId) {
        return
      }
      this.dispatchEvent(
        new CustomEvent("hass-more-info", {
          detail: { entityId },
          bubbles: true,
          composed: true,
        })
      )
      return
    }

    if (action === "toggle") {
      const entityId = tapAction.entity || this._getDefaultActionEntity(true)
      if (!entityId || !this._hass?.callService) {
        return
      }
      this._hass.callService("homeassistant", "toggle", { entity_id: entityId })
      return
    }

    if (action === "navigate") {
      const path = tapAction.navigation_path || tapAction.path
      if (!path) {
        return
      }
      this.dispatchEvent(
        new CustomEvent("hass-navigate", {
          detail: { navigation_path: path },
          bubbles: true,
          composed: true,
        })
      )
      return
    }

    if (action === "url") {
      const url = tapAction.url_path || tapAction.url
      if (!url) {
        return
      }
      window.open(url, tapAction.new_tab ? "_blank" : "_self")
      return
    }

    if (action === "assist") {
      const pipeline = tapAction.pipeline_id || "last_used"
      this.dispatchEvent(
        new CustomEvent("hass-action", {
          detail: {
            config: {
              tap_action: {
                action: "assist",
                pipeline_id: pipeline,
              },
            },
            action: "tap",
          },
          bubbles: true,
          composed: true,
        })
      )
      return
    }

    if (action === "perform-action") {
      const performAction = tapAction.perform_action
      if (!performAction || !this._hass?.callService) {
        return
      }
      const [domain, service] = String(performAction).split(".")
      if (!domain || !service) {
        return
      }
      const data = tapAction.data && typeof tapAction.data === "object" ? tapAction.data : {}
      const target =
        tapAction.target && typeof tapAction.target === "object" ? tapAction.target : {}
      this._hass.callService(domain, service, data, target)
      return
    }
  }

  static getConfigElement() {
    return document.createElement("thermo-halo-card-editor")
  }

  static getStubConfig() {
    return {
      type: "custom:thermo-halo-card",
      temperature_entity: "sensor.hvac_knx_temperature_piece_a_vivre",
      climate_entity: "climate.piece_a_vivre",
      current_label: "Temperature actuelle",
      target_label: "Temperature desiree",
      appearance: "base",
      decimals: 1,
      heat_color: "#ff9a3c",
      cool_color: "#32b8ff",
      tap_action: {
        action: "more-info",
      },
    }
  }

  _formatNumber(value, decimals = 1) {
    const num = Number.parseFloat(value)
    if (!Number.isFinite(num)) {
      return null
    }
    return num.toFixed(decimals)
  }

  _computeMode(climateStateObj) {
    if (!climateStateObj) {
      return { isOn: false, halo: "off" }
    }

    const state = (climateStateObj.state || "").toLowerCase()
    const action = (climateStateObj.attributes?.hvac_action || "").toLowerCase()

    const isOn = state !== "off" && state !== "unavailable" && state !== "unknown"

    if (action === "heating") {
      return { isOn, halo: "heat" }
    }
    if (action === "cooling") {
      return { isOn, halo: "cool" }
    }

    if (state === "heat") {
      return { isOn, halo: "heat" }
    }
    if (state === "cool") {
      return { isOn, halo: "cool" }
    }

    return { isOn, halo: "off" }
  }

  _render() {
    if (!this._config || !this.shadowRoot) {
      return
    }

    const tempEntity = this._hass?.states?.[this._config.temperature_entity]
    const climateEntity = this._hass?.states?.[this._config.climate_entity]

    const current = this._formatNumber(tempEntity?.state, this._config.decimals)
    const setpoint = this._formatNumber(
      climateEntity?.attributes?.temperature,
      this._config.decimals
    )

    const mode = this._computeMode(climateEntity)

    const showSetpoint = mode.isOn && setpoint !== null
    const haloClass =
      mode.halo === "heat" ? "halo-heat" : mode.halo === "cool" ? "halo-cool" : "halo-off"
    const isTappable = (this._config?.tap_action?.action || "more-info").toLowerCase() !== "none"
    const isBaseAppearance = (this._config?.appearance || "base").toLowerCase() === "base"
    const cardRadius = isBaseAppearance ? "12px" : "24px"
    const cardPadding = isBaseAppearance ? "12px 10px" : "18px 14px 14px"
    const cardMinHeight = isBaseAppearance ? "170px" : "210px"
    const haloSize = isBaseAppearance ? "180px" : "240px"
    const heatHalo = isBaseAppearance
      ? `radial-gradient(circle, color-mix(in srgb, ${this._config.heat_color} 14%, transparent) 0%, transparent 72%)`
      : `radial-gradient(circle, color-mix(in srgb, ${this._config.heat_color} 22%, transparent) 0%, transparent 70%)`
    const coolHalo = isBaseAppearance
      ? `radial-gradient(circle, color-mix(in srgb, ${this._config.cool_color} 14%, transparent) 0%, transparent 72%)`
      : `radial-gradient(circle, color-mix(in srgb, ${this._config.cool_color} 22%, transparent) 0%, transparent 70%)`
    const idleHaloOpacity =
      this._config.idle_halo && this._config.idle_halo !== "transparent" ? 1 : 0
    const valueCurrentFont = isBaseAppearance ? "78px" : "106px"
    const valueTargetFont = isBaseAppearance ? "22px" : "30px"
    const pulseAnim = isBaseAppearance ? "none" : "pulse 420ms ease"
    const floatAnim = isBaseAppearance ? "none" : "floatin 420ms ease"

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }

        ha-card {
          position: relative;
          overflow: visible;
          border-radius: ${cardRadius};
          background: transparent;
          box-shadow: none;
          padding: ${cardPadding};
          text-align: center;
          min-height: ${cardMinHeight};
          cursor: ${isTappable ? "pointer" : "default"};
        }

        .halo {
          position: absolute;
          left: 50%;
          top: 50%;
          width: ${haloSize};
          height: ${haloSize};
          transform: translate(-50%, -50%);
          border-radius: 50%;
          pointer-events: none;
          transition: opacity 280ms ease, background 280ms ease;
          z-index: 0;
        }

        .halo-off {
                    opacity: ${idleHaloOpacity};
          background: ${this._config.idle_halo};
        }

        .halo-heat {
          opacity: 1;
          background: ${heatHalo};
        }

        .halo-cool {
          opacity: 1;
          background: ${coolHalo};
        }

        .content {
          position: relative;
          z-index: 1;
          display: flex;
          height: 100%;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
        }

        .label {
          text-transform: uppercase;
          letter-spacing: 1.1px;
          color: var(--secondary-text-color);
          font-family: "Segoe UI", Roboto, sans-serif;
        }

        .label-current {
          font-size: 12px;
          font-weight: 600;
          margin-bottom: 2px;
        }

        .value-current {
          font-family: "Segoe UI Variable Display", "Segoe UI", Roboto, sans-serif;
          font-size: ${valueCurrentFont};
          line-height: 0.95;
          letter-spacing: -3px;
          font-weight: 300;
          color: var(--primary-text-color);
          margin-bottom: 8px;
          animation: ${pulseAnim};
        }

        .label-target {
          font-size: 11px;
          font-weight: 600;
          margin-bottom: 0;
        }

        .value-target {
          font-family: "Segoe UI Variable Display", "Segoe UI", Roboto, sans-serif;
          font-size: ${valueTargetFont};
          line-height: 1.05;
          font-weight: 550;
          margin-top: 0;
          animation: ${floatAnim};
        }

        @keyframes pulse {
          0% { transform: scale(0.985); opacity: 0.85; }
          100% { transform: scale(1); opacity: 1; }
        }

        @keyframes floatin {
          0% { transform: translateY(4px); opacity: 0.7; }
          100% { transform: translateY(0); opacity: 1; }
        }
      </style>

      <ha-card>
        <div class="halo ${haloClass}"></div>
        <div class="content">
          <div class="label label-current">${this._config.current_label}</div>
          <div class="value-current">${current !== null ? `${current}°` : "--°"}</div>
          ${
            showSetpoint
              ? `
            <div class="label label-target">${this._config.target_label}</div>
            <div class="value-target" style="color: ${mode.halo === "cool" ? this._config.cool_color : this._config.heat_color}">${setpoint}°</div>
          `
              : ""
          }
        </div>
      </ha-card>
    `
  }
}

customElements.define("thermo-halo-card", ThermoHaloCard)

class ThermoHaloCardEditor extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" })
    this._hass = null
    this._config = {
      temperature_entity: "sensor.hvac_knx_temperature_piece_a_vivre",
      climate_entity: "climate.piece_a_vivre",
      current_label: "Temperature actuelle",
      target_label: "Temperature desiree",
      appearance: "base",
      decimals: 1,
      heat_color: "#ff9a3c",
      cool_color: "#32b8ff",
      tap_action: { action: "more-info" },
    }
    this._initialized = false
  }

  setConfig(config) {
    this._config = {
      ...this._config,
      ...config,
    }
    this._initialized = true
    this._render()
  }

  set hass(hass) {
    this._hass = hass
    this._render()
  }

  _getSchema() {
    return [
      { name: "temperature_entity", selector: { entity: { domain: "sensor" } } },
      { name: "climate_entity", selector: { entity: { domain: "climate" } } },
      { name: "current_label", selector: { text: {} } },
      { name: "target_label", selector: { text: {} } },
      {
        name: "appearance",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "base", label: "Base" },
              { value: "fancy", label: "Fancy" },
            ],
          },
        },
      },
      { name: "decimals", selector: { number: { min: 0, max: 3, step: 1, mode: "box" } } },
      { name: "heat_color", selector: { text: {} } },
      { name: "cool_color", selector: { text: {} } },
      {
        name: "tap_action_mode",
        selector: {
          select: {
            mode: "dropdown",
            options: [
              { value: "more-info", label: "More info" },
              { value: "toggle", label: "Toggle" },
              { value: "navigate", label: "Navigate" },
              { value: "url", label: "URL" },
              { value: "perform-action", label: "Perform action" },
              { value: "assist", label: "Assist" },
              { value: "none", label: "None" },
            ],
          },
        },
      },
      { name: "tap_action_entity", selector: { entity: {} } },
      { name: "tap_navigation_path", selector: { text: {} } },
      { name: "tap_url_path", selector: { text: {} } },
      { name: "tap_new_tab", selector: { boolean: {} } },
      { name: "tap_perform_action", selector: { text: {} } },
      { name: "tap_pipeline_id", selector: { text: {} } },
    ]
  }

  _getFormData() {
    return {
      temperature_entity: this._config.temperature_entity,
      climate_entity: this._config.climate_entity,
      current_label: this._config.current_label,
      target_label: this._config.target_label,
      appearance: this._config.appearance || "base",
      decimals: Number.isFinite(this._config.decimals) ? this._config.decimals : 1,
      heat_color: this._config.heat_color,
      cool_color: this._config.cool_color,
      tap_action_mode: this._config?.tap_action?.action || "more-info",
      tap_action_entity: this._config?.tap_action?.entity || this._config.temperature_entity,
      tap_navigation_path: this._config?.tap_action?.navigation_path || "",
      tap_url_path: this._config?.tap_action?.url_path || "",
      tap_new_tab: !!this._config?.tap_action?.new_tab,
      tap_perform_action: this._config?.tap_action?.perform_action || "",
      tap_pipeline_id: this._config?.tap_action?.pipeline_id || "last_used",
    }
  }

  _onFormChanged(ev) {
    const formData = ev.detail?.value || {}
    const parsedDecimals = Number.parseInt(formData.decimals, 10)
    this._config = {
      ...this._config,
      temperature_entity: formData.temperature_entity,
      climate_entity: formData.climate_entity,
      current_label: formData.current_label,
      target_label: formData.target_label,
      appearance: formData.appearance || "base",
      decimals: Number.isFinite(parsedDecimals) ? parsedDecimals : 1,
      heat_color: formData.heat_color,
      cool_color: formData.cool_color,
      tap_action: {
        action: formData.tap_action_mode || "more-info",
        entity: formData.tap_action_entity || this._config.temperature_entity,
        navigation_path: formData.tap_navigation_path || undefined,
        url_path: formData.tap_url_path || undefined,
        new_tab: !!formData.tap_new_tab,
        perform_action: formData.tap_perform_action || undefined,
        pipeline_id: formData.tap_pipeline_id || "last_used",
      },
    }

    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: { type: "custom:thermo-halo-card", ...this._config } },
        bubbles: true,
        composed: true,
      })
    )

    this._updatePreview()
  }

  _updatePreview() {
    if (!this.shadowRoot) {
      return
    }

    const host = this.shadowRoot.getElementById("preview-host")
    if (!host) {
      return
    }

    let previewCard = this.shadowRoot.getElementById("preview-card")
    if (!previewCard) {
      previewCard = document.createElement("thermo-halo-card")
      previewCard.id = "preview-card"
      host.innerHTML = ""
      host.appendChild(previewCard)
    }

    previewCard.setConfig({
      type: "custom:thermo-halo-card",
      ...this._config,
    })

    if (this._hass) {
      previewCard.hass = this._hass
    }
  }

  _render() {
    if (!this.shadowRoot) {
      return
    }

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          padding: 12px;
          box-sizing: border-box;
        }

        .hint {
          font-size: 12px;
          color: var(--secondary-text-color);
          opacity: 0.9;
          margin-top: 8px;
        }

        .preview {
          margin-top: 10px;
          border: 1px solid var(--divider-color);
          border-radius: 12px;
          padding: 10px;
        }

        .preview-title {
          font-size: 12px;
          color: var(--secondary-text-color);
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: 8px;
        }
      </style>

      <ha-form id="config-form"></ha-form>
      <div class="hint">Le halo est automatique: orange en chauffe, bleu en clim, aucun halo quand le climate est off.</div>
      <div class="preview">
        <div class="preview-title">Previsualisation</div>
        <div id="preview-host"></div>
      </div>
    `

    const form = this.shadowRoot.getElementById("config-form")
    if (form) {
      form.hass = this._hass
      form.schema = this._getSchema()
      form.data = this._getFormData()
      form.computeLabel = (s) => {
        const labels = {
          temperature_entity: "Entite temperature",
          climate_entity: "Entite climate",
          current_label: "Label temperature",
          target_label: "Label consigne",
          appearance: "Apparence",
          decimals: "Decimales",
          heat_color: "Couleur chauffe",
          cool_color: "Couleur clim",
          tap_action_mode: "Tap action",
          tap_action_entity: "Entite action",
          tap_navigation_path: "Chemin navigation",
          tap_url_path: "URL",
          tap_new_tab: "Ouvrir dans nouvel onglet",
          tap_perform_action: "Action service (domain.service)",
          tap_pipeline_id: "Pipeline Assist",
        }
        return labels[s.name] || s.name
      }
      form.addEventListener("value-changed", (ev) => this._onFormChanged(ev))
    }

    this._updatePreview()
  }
}

customElements.define("thermo-halo-card-editor", ThermoHaloCardEditor)

window.customCards = window.customCards || []
window.customCards.push({
  type: "thermo-halo-card",
  name: "Thermo Halo Card",
  description: "Temperature current + target with dynamic heating/cooling halo",
})
