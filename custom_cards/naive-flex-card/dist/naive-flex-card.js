import { LitElement, html, css } from "https://unpkg.com/lit-element@2.4.0/lit-element.js?module"

const DEFAULT_CONFIG = {
  control_type: "auto",
  show_name: true,
  show_state: true,
  style: {
    preset: "modern",
    shape: "rounded",
    appearance: "solid",
    size: "comfortable",
    elevation: "soft",
    auto_text_contrast: false,
    active_color: "var(--primary-color, #00AEEF)",
    inactive_color: "var(--secondary-text-color, #9CA3AF)",
    background_color: "var(--card-background-color, #1F2937)",
    text_color: "var(--primary-text-color, #F9FAFB)",
  },
  button_row: {
    enabled: false,
    scroll: true,
    gap: 8,
    min_button_width: 72,
    max_button_width: 140,
    button_width: "",
    align: "start",
    buttons: [],
    groups: [],
  },
  light_controls: {
    show_brightness: true,
    brightness_step: 15,
    show_color_temp: false,
    color_temp_step: 20,
  },
  volume_controls: {
    show_slider: true,
    step: 0.05,
  },
  cover_controls: {
    show_stop: true,
    step: 10,
  },
}

const PRESET_STYLES = {
  modern: {
    border: "1px solid rgba(255, 255, 255, 0.06)",
    overlay: "linear-gradient(155deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02))",
  },
  minimal: {
    border: "1px solid rgba(255, 255, 255, 0.04)",
    overlay: "none",
  },
  outline: {
    border: "1px solid var(--primary-color, #00AEEF)",
    overlay: "transparent",
  },
  soft: {
    border: "1px solid rgba(56, 189, 248, 0.28)",
    overlay: "linear-gradient(165deg, rgba(56, 189, 248, 0.16), rgba(255, 255, 255, 0.01))",
  },
  navbar_popup: {
    border: "1px solid rgba(255, 255, 255, 0.14)",
    overlay: "linear-gradient(145deg, rgba(17, 24, 39, 0.65), rgba(31, 41, 55, 0.22))",
  },
}

const DOMAIN_TO_CONTROL = {
  light: "light",
  switch: "button",
  input_boolean: "button",
  button: "button",
  script: "button",
  scene: "button",
  media_player: "volume",
  cover: "cover",
}

class NaiveFlexCard extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
    }
  }

  setConfig(config) {
    if (!config || !config.entity) {
      throw new Error("Property 'entity' is required.")
    }

    const merged = this._mergeDeep({}, DEFAULT_CONFIG, config, {
      button_row: {
        ...DEFAULT_CONFIG.button_row,
        ...(config.button_row || {}),
        buttons: this._parseButtons(config.button_row?.buttons),
        groups: this._parseButtonGroups(config.button_row?.groups),
      },
    })

    this.config = merged
  }

  set hass(hass) {
    this._hass = hass
    this.requestUpdate()
  }

  get hass() {
    return this._hass
  }

  shouldUpdate(changedProps) {
    if (!changedProps.has("hass")) return true
    const oldHass = changedProps.get("hass")
    if (!oldHass || !this.config?.entity) return true

    const prev = oldHass.states[this.config.entity]
    const next = this._hass?.states[this.config.entity]
    return prev !== next
  }

  get _entity() {
    return this._hass?.states?.[this.config?.entity]
  }

  get _domain() {
    return (this.config?.entity || "").split(".")[0]
  }

  get _controlType() {
    if (this.config?.control_type && this.config.control_type !== "auto") {
      return this.config.control_type
    }
    return DOMAIN_TO_CONTROL[this._domain] || "button"
  }

  get _name() {
    return this.config?.name || this._entity?.attributes?.friendly_name || this.config?.entity
  }

  get _icon() {
    if (this.config?.icon) return this.config.icon

    const typeIcon = {
      light: "mdi:lightbulb",
      button: "mdi:gesture-tap-button",
      volume: "mdi:volume-high",
      cover: "mdi:window-shutter",
    }
    return this._entity?.attributes?.icon || typeIcon[this._controlType] || "mdi:help-circle"
  }

  get _isActive() {
    const state = this._entity?.state
    if (!state) return false
    return ["on", "open", "opening", "playing"].includes(state)
  }

  get _shapeClass() {
    const shape = this.config.style.shape
    if (["rounded", "square", "pill"].includes(shape)) return shape
    return "rounded"
  }

  get _sizeClass() {
    const size = this.config.style.size
    if (["compact", "comfortable", "large"].includes(size)) return size
    return "comfortable"
  }

  get _appearanceClass() {
    const appearance = this.config.style.appearance
    if (["solid", "glass", "outline"].includes(appearance)) return appearance
    return "solid"
  }

  get _stateDisplay() {
    if (!this._entity) return "Unavailable"

    if (this._controlType === "volume") {
      const vol = this._entity.attributes?.volume_level
      if (typeof vol === "number") return `${Math.round(vol * 100)}%`
    }

    if (this._controlType === "cover") {
      const pos = this._entity.attributes?.current_position
      if (typeof pos === "number") return `${pos}%`
    }

    const unit = this._entity.attributes?.unit_of_measurement || ""
    return `${this._entity.state}${unit ? ` ${unit}` : ""}`
  }

  get _presetStyle() {
    return PRESET_STYLES[this.config?.style?.preset] || PRESET_STYLES.modern
  }

  _resolveCssVariableValue(variableName) {
    if (!variableName || typeof variableName !== "string") return ""
    if (!this.isConnected || typeof window === "undefined") return ""

    const hostValue = window.getComputedStyle(this).getPropertyValue(variableName).trim()
    if (hostValue) return hostValue

    if (typeof document === "undefined") return ""
    return window.getComputedStyle(document.documentElement).getPropertyValue(variableName).trim()
  }

  _resolveCssColorExpression(expression) {
    if (!expression || typeof expression !== "string") return ""
    if (!this.isConnected || typeof window === "undefined") return ""

    const originalColor = this.style.color
    this.style.color = expression
    const resolved = window.getComputedStyle(this).color.trim()
    this.style.color = originalColor
    return resolved
  }

  _collectCssColorCandidates(value) {
    if (!value || typeof value !== "string") return []
    const normalized = value.trim()
    const candidates = normalized.match(/var\([^\)]+\)|rgba?\([^\)]+\)|#[0-9a-fA-F]{3,8}/g)
    return candidates || []
  }

  _parseColorValue(value, fallback = { r: 17, g: 24, b: 39, a: 1 }) {
    if (!value || typeof value !== "string") return fallback
    const normalized = value.trim()

    if (normalized === "none" || normalized === "transparent") {
      return fallback
    }

    const candidates = this._collectCssColorCandidates(normalized)
    if (candidates.length > 1) {
      const colors = candidates
        .map((candidate) => this._parseColorValue(candidate, fallback))
        .filter(Boolean)
      if (colors.length > 1) {
        const base = colors.reduce(
          (acc, color, index) => {
            const weight = 1 / colors.length
            return {
              r: acc.r + color.r * weight,
              g: acc.g + color.g * weight,
              b: acc.b + color.b * weight,
              a: acc.a + color.a * weight,
            }
          },
          { r: 0, g: 0, b: 0, a: 0 }
        )
        return {
          r: Math.round(base.r),
          g: Math.round(base.g),
          b: Math.round(base.b),
          a: Math.max(0, Math.min(1, base.a)),
        }
      }
    }

    const resolvedExpression = this._resolveCssColorExpression(normalized)
    if (resolvedExpression && resolvedExpression !== normalized) {
      return this._parseColorValue(resolvedExpression, fallback)
    }

    const varMatch = normalized.match(/^var\(\s*(--[a-zA-Z0-9-_]+)\s*(?:,\s*(.+))?\)$/)
    if (varMatch) {
      const variableName = varMatch[1]
      const fallbackValue = (varMatch[2] || "").trim()
      const resolvedValue = this._resolveCssVariableValue(variableName)

      if (resolvedValue) return this._parseColorValue(resolvedValue, fallback)
      if (fallbackValue) return this._parseColorValue(fallbackValue, fallback)
      return fallback
    }

    const hexMatch = normalized.match(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/)
    if (hexMatch) {
      let hex = hexMatch[1]
      if (hex.length === 3) {
        hex = hex
          .split("")
          .map((char) => `${char}${char}`)
          .join("")
      }
      return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16),
        a: 1,
      }
    }

    const rgbMatch = normalized.match(/^rgba?\(([^\)]+)\)$/)
    if (rgbMatch) {
      const parts = rgbMatch[1]
        .split(",")
        .map((part) => part.trim())
        .filter((part) => part !== "")
      if (parts.length >= 3) {
        const r = Math.max(0, Math.min(255, Number(parts[0]) || 0))
        const g = Math.max(0, Math.min(255, Number(parts[1]) || 0))
        const b = Math.max(0, Math.min(255, Number(parts[2]) || 0))
        const a = parts.length >= 4 ? Math.max(0, Math.min(1, Number(parts[3]) || 0)) : 1
        return { r, g, b, a }
      }
    }

    return fallback
  }

  _themeBackgroundColor() {
    const fallback = { r: 17, g: 24, b: 39, a: 1 }
    if (!this.isConnected || typeof window === "undefined") return fallback

    const computed = window.getComputedStyle(this)
    const candidates = [
      computed.getPropertyValue("--ha-card-background"),
      computed.getPropertyValue("--card-background-color"),
      computed.getPropertyValue("--primary-background-color"),
    ]

    const found = candidates
      .map((value) => (value || "").trim())
      .find((value) => value && value !== "transparent")

    if (!found) return fallback
    return this._parseColorValue(found, fallback)
  }

  _blendColors(foreground, background) {
    const alpha = Math.max(0, Math.min(1, Number(foreground.a) || 0))
    const inv = 1 - alpha
    return {
      r: Math.round(foreground.r * alpha + background.r * inv),
      g: Math.round(foreground.g * alpha + background.g * inv),
      b: Math.round(foreground.b * alpha + background.b * inv),
      a: 1,
    }
  }

  _relativeLuminance(color) {
    const transform = (channel) => {
      const c = channel / 255
      return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
    }

    return 0.2126 * transform(color.r) + 0.7152 * transform(color.g) + 0.0722 * transform(color.b)
  }

  _contrastRatio(colorA, colorB) {
    const lumA = this._relativeLuminance(colorA)
    const lumB = this._relativeLuminance(colorB)
    const lighter = Math.max(lumA, lumB)
    const darker = Math.min(lumA, lumB)
    return (lighter + 0.05) / (darker + 0.05)
  }

  _effectiveBackgroundColor() {
    const themeBg = this._themeBackgroundColor()
    const cardBg = this._parseColorValue(this.config?.style?.background_color, themeBg)
    const baseBg = cardBg.a < 1 ? this._blendColors(cardBg, themeBg) : cardBg

    const presetOverlay = this._parseColorValue(this._presetStyle.overlay, {
      r: 0,
      g: 0,
      b: 0,
      a: 0,
    })
    if (presetOverlay.a > 0) {
      return this._blendColors(presetOverlay, baseBg)
    }

    return baseBg
  }

  _resolveTextColor() {
    const configured = this.config?.style?.text_color || "var(--primary-text-color, #F9FAFB)"
    if (!this.config?.style?.auto_text_contrast) return configured

    const effectiveBg = this._effectiveBackgroundColor()
    const presetOverlay = this._parseColorValue(this._presetStyle.overlay, {
      r: 0,
      g: 0,
      b: 0,
      a: 0,
    })
    const overlayIsDark = presetOverlay.a > 0 && this._relativeLuminance(presetOverlay) < 0.25
    if (overlayIsDark) {
      const lightText = { r: 248, g: 250, b: 252, a: 1 }
      return `rgb(${lightText.r}, ${lightText.g}, ${lightText.b})`
    }

    const darkText = { r: 15, g: 23, b: 42, a: 1 }
    const lightText = { r: 248, g: 250, b: 252, a: 1 }
    const darkContrast = this._contrastRatio(effectiveBg, darkText)
    const lightContrast = this._contrastRatio(effectiveBg, lightText)
    const best = darkContrast >= lightContrast ? darkText : lightText

    return `rgb(${best.r}, ${best.g}, ${best.b})`
  }

  _resolveInactiveColor(textColor) {
    if (!this.config?.style?.auto_text_contrast) {
      return this.config?.style?.inactive_color || "var(--secondary-text-color, #9CA3AF)"
    }

    const text = this._parseColorValue(textColor, { r: 248, g: 250, b: 252, a: 1 })
    const effectiveBg = this._effectiveBackgroundColor()
    const bgLum = this._relativeLuminance(effectiveBg)
    const opacity = bgLum > 0.62 ? 0.84 : 0.72
    return `rgba(${text.r}, ${text.g}, ${text.b}, ${opacity})`
  }

  _parseButtons(buttons) {
    if (!buttons) return []
    if (Array.isArray(buttons)) return buttons

    if (typeof buttons === "string") {
      try {
        const parsed = JSON.parse(buttons)
        return Array.isArray(parsed) ? parsed : []
      } catch (error) {
        this._log("error", "Invalid button_row.buttons JSON", error)
        return []
      }
    }

    return []
  }

  _parseButtonGroups(groups) {
    if (!groups) return []
    if (!Array.isArray(groups)) return []

    return groups.map((group, index) => {
      const safeId = group?.id || `group_${index + 1}`
      return {
        id: safeId,
        label: group?.label || `Group ${index + 1}`,
        enabled: group?.enabled !== false,
        scroll: group?.scroll !== false,
        gap: Number(group?.gap ?? 8),
        min_button_width: Number(group?.min_button_width ?? 72),
        max_button_width: Number(group?.max_button_width ?? 140),
        button_width: group?.button_width || "",
        align: group?.align || "start",
      }
    })
  }

  _mergeDeep(target, ...sources) {
    if (!sources.length) return target
    const source = sources.shift()

    if (source && typeof source === "object") {
      Object.keys(source).forEach((key) => {
        const value = source[key]
        if (Array.isArray(value)) {
          target[key] = value.slice()
          return
        }

        if (value && typeof value === "object") {
          if (!target[key] || typeof target[key] !== "object") {
            target[key] = {}
          }
          this._mergeDeep(target[key], value)
          return
        }

        target[key] = value
      })
    }

    return this._mergeDeep(target, ...sources)
  }

  _fireEvent(type, detail = {}) {
    this.dispatchEvent(new CustomEvent(type, { detail, bubbles: true, composed: true }))
  }

  _log(level, message, extra) {
    const prefix = "[naive-flex-card]"
    if (level === "error") {
      // eslint-disable-next-line no-console
      console.error(prefix, message, extra || "")
      return
    }
    if (level === "warn") {
      // eslint-disable-next-line no-console
      console.warn(prefix, message, extra || "")
      return
    }
    // eslint-disable-next-line no-console
    console.info(prefix, message, extra || "")
  }

  async _callService(domain, service, serviceData = {}) {
    try {
      await this._hass.callService(domain, service, serviceData)
      this._log("info", `Service called: ${domain}.${service}`, serviceData)
    } catch (error) {
      this._log("error", `Service call failed: ${domain}.${service}`, error)
    }
  }

  async _runAction(actionConfig, fallbackEntity = this.config.entity) {
    if (!actionConfig || actionConfig.action === "none") return

    const action = actionConfig.action || "more-info"

    if (action === "more-info") {
      this._fireEvent("hass-more-info", { entityId: fallbackEntity })
      return
    }

    if (action === "toggle") {
      const domain = (fallbackEntity || "").split(".")[0]
      if (!domain) return
      await this._callService(domain, "toggle", { entity_id: fallbackEntity })
      return
    }

    if (action === "call-service") {
      const service = actionConfig.service || ""
      if (!service.includes(".")) {
        this._log("warn", "call-service missing valid service domain", service)
        return
      }
      const [domain, serviceName] = service.split(".")
      await this._callService(domain, serviceName, actionConfig.service_data || {})
      return
    }

    if (action === "navigate" && actionConfig.navigation_path) {
      history.pushState(null, "", actionConfig.navigation_path)
      this._fireEvent("location-changed", { replace: false })
      return
    }

    if (action === "url" && actionConfig.url_path) {
      window.open(actionConfig.url_path, "_blank", "noopener")
      return
    }

    this._log("warn", "Unsupported action", action)
  }

  async _onCardTap() {
    const fallback = {
      light: { action: "toggle" },
      button: { action: "toggle" },
      volume: { action: "more-info" },
      cover: { action: "more-info" },
    }
    const action = this.config.tap_action || fallback[this._controlType] || { action: "more-info" }
    await this._runAction(action, this.config.entity)
  }

  _holdDelayMs() {
    return Math.max(100, Number(this.config?.hold_action?.hold_time || 500))
  }

  _clearTapTimer() {
    if (this._tapTimer) {
      clearTimeout(this._tapTimer)
      this._tapTimer = null
    }
  }

  _clearHoldTimer() {
    if (this._holdTimer) {
      clearTimeout(this._holdTimer)
      this._holdTimer = null
    }
  }

  _hasHoldAction() {
    return (
      this.config?.hold_action &&
      this.config.hold_action.action &&
      this.config.hold_action.action !== "none"
    )
  }

  async _onPointerDown() {
    this._clearHoldTimer()
    this._holdTriggered = false

    if (!this._hasHoldAction()) return

    this._holdTimer = setTimeout(async () => {
      this._holdTriggered = true
      this._clearTapTimer()
      await this._runAction(this.config.hold_action, this.config.entity)
    }, this._holdDelayMs())
  }

  _onPointerUp() {
    this._clearHoldTimer()
  }

  _onPointerCancel() {
    this._clearHoldTimer()
  }

  _doubleTapDelayMs() {
    return 220
  }

  async _onCardClick(event) {
    event.preventDefault()
    if (this._holdTriggered) {
      this._holdTriggered = false
      return
    }

    this._clearTapTimer()
    this._tapTimer = setTimeout(async () => {
      await this._onCardTap()
    }, this._doubleTapDelayMs())
  }

  async _onCardDoubleClick(event) {
    event.preventDefault()
    this._clearTapTimer()

    const action = this.config.double_tap_action
    if (action && action.action && action.action !== "none") {
      await this._runAction(action, this.config.entity)
      return
    }

    await this._onCardTap()
  }

  async _toggleMain() {
    await this._runAction({ action: "toggle" }, this.config.entity)
  }

  async _buttonPress() {
    if (this._domain === "button") {
      await this._callService("button", "press", { entity_id: this.config.entity })
      return
    }

    if (this._domain === "script") {
      await this._callService("script", "turn_on", { entity_id: this.config.entity })
      return
    }

    if (this._domain === "scene") {
      await this._callService("scene", "turn_on", { entity_id: this.config.entity })
      return
    }

    await this._toggleMain()
  }

  _clamp(value, min, max) {
    return Math.max(min, Math.min(max, value))
  }

  async _changeBrightness(direction) {
    const step = Number(this.config.light_controls.brightness_step || 15)
    const current = Number(this._entity?.attributes?.brightness ?? 0)
    const next = this._clamp(current + direction * step, 1, 255)
    await this._callService("light", "turn_on", {
      entity_id: this.config.entity,
      brightness: next,
    })
  }

  async _setBrightness(event) {
    const value = Number(event.target.value)
    await this._callService("light", "turn_on", {
      entity_id: this.config.entity,
      brightness: value,
    })
  }

  async _changeColorTemp(direction) {
    const step = Number(this.config.light_controls.color_temp_step || 20)
    const current = Number(this._entity?.attributes?.color_temp ?? 250)
    const next = this._clamp(current + direction * step, 153, 500)
    await this._callService("light", "turn_on", {
      entity_id: this.config.entity,
      color_temp: next,
    })
  }

  async _setVolume(event) {
    const value = Number(event.target.value)
    await this._callService("media_player", "volume_set", {
      entity_id: this.config.entity,
      volume_level: value,
    })
  }

  async _changeVolume(direction) {
    const step = Number(this.config.volume_controls.step || 0.05)
    const current = Number(this._entity?.attributes?.volume_level ?? 0)
    const next = this._clamp(current + direction * step, 0, 1)
    await this._callService("media_player", "volume_set", {
      entity_id: this.config.entity,
      volume_level: Number(next.toFixed(3)),
    })
  }

  async _toggleMute() {
    const isMuted = !!this._entity?.attributes?.is_volume_muted
    await this._callService("media_player", "volume_mute", {
      entity_id: this.config.entity,
      is_volume_muted: !isMuted,
    })
  }

  async _coverAction(service) {
    await this._callService("cover", service, { entity_id: this.config.entity })
  }

  async _setCoverPosition(event) {
    const position = Number(event.target.value)
    await this._callService("cover", "set_cover_position", {
      entity_id: this.config.entity,
      position,
    })
  }

  _extraButtonWidthStyle(row) {
    const min = Number(row.min_button_width || 72)
    const max = Number(row.max_button_width || 140)

    if (row.button_width && row.button_width.trim()) {
      return `width:${row.button_width};min-width:${min}px;max-width:${max}px;`
    }

    return `width:clamp(${min}px, 24vw, ${max}px);min-width:${min}px;max-width:${max}px;`
  }

  _buttonIsEnabled(button) {
    return button?.enabled !== false
  }

  async _onExtraButtonTap(button) {
    const entity = button.entity || this.config.entity

    if (button.action === "toggle") {
      const domain = entity.split(".")[0]
      await this._callService(domain, "toggle", { entity_id: entity })
      return
    }

    if (button.action === "more-info") {
      this._fireEvent("hass-more-info", { entityId: entity })
      return
    }

    if (button.action === "call-service" && button.service) {
      const [domain, service] = button.service.split(".")
      if (!domain || !service) {
        this._log("warn", "Invalid extra button service", button.service)
        return
      }

      await this._callService(domain, service, {
        ...(button.service_data || {}),
        ...(button.entity ? { entity_id: button.entity } : {}),
      })
      return
    }

    if (button.action === "set-value") {
      if (this._controlType === "volume") {
        const next = this._clamp(Number(button.value ?? 0), 0, 1)
        await this._callService("media_player", "volume_set", {
          entity_id: this.config.entity,
          volume_level: next,
        })
        return
      }

      if (this._controlType === "cover") {
        const nextPos = this._clamp(Number(button.position ?? 0), 0, 100)
        await this._callService("cover", "set_cover_position", {
          entity_id: this.config.entity,
          position: nextPos,
        })
        return
      }
    }

    this._log("warn", "Unsupported extra button action", button)
  }

  _renderControlLight() {
    const brightness = Number(this._entity?.attributes?.brightness ?? 0)
    return html`
      <div class="control-grid">
        <button class="chip" @click="${this._toggleMain}">Toggle</button>
        <button class="chip" @click="${() => this._changeBrightness(-1)}">- Bright</button>
        <button class="chip" @click="${() => this._changeBrightness(1)}">+ Bright</button>
      </div>
      ${this.config.light_controls.show_brightness
        ? html`
            <div class="slider-block">
              <label>Brightness</label>
              <input
                type="range"
                min="1"
                max="255"
                .value="${String(brightness)}"
                @change="${this._setBrightness}"
              />
            </div>
          `
        : ""}
      ${this.config.light_controls.show_color_temp
        ? html`
            <div class="control-grid">
              <button class="chip" @click="${() => this._changeColorTemp(-1)}">Cooler</button>
              <button class="chip" @click="${() => this._changeColorTemp(1)}">Warmer</button>
            </div>
          `
        : ""}
    `
  }

  _renderControlButton() {
    return html`
      <div class="control-grid single">
        <button class="chip primary" @click="${this._buttonPress}">Run</button>
      </div>
    `
  }

  _renderControlVolume() {
    const volume = Number(this._entity?.attributes?.volume_level ?? 0)
    return html`
      <div class="control-grid">
        <button class="chip" @click="${this._toggleMute}">Mute</button>
        <button class="chip" @click="${() => this._changeVolume(-1)}">- Vol</button>
        <button class="chip" @click="${() => this._changeVolume(1)}">+ Vol</button>
      </div>
      ${this.config.volume_controls.show_slider
        ? html`
            <div class="slider-block">
              <label>Volume</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                .value="${String(volume)}"
                @change="${this._setVolume}"
              />
            </div>
          `
        : ""}
    `
  }

  _renderControlCover() {
    const position = Number(this._entity?.attributes?.current_position ?? 0)
    return html`
      <div class="control-grid">
        <button class="chip" @click="${() => this._coverAction("open_cover")}">Open</button>
        ${this.config.cover_controls.show_stop
          ? html`<button class="chip" @click="${() => this._coverAction("stop_cover")}">
              Stop
            </button>`
          : ""}
        <button class="chip" @click="${() => this._coverAction("close_cover")}">Close</button>
      </div>
      <div class="slider-block">
        <label>Position</label>
        <input
          type="range"
          min="0"
          max="100"
          step="1"
          .value="${String(position)}"
          @change="${this._setCoverPosition}"
        />
      </div>
    `
  }

  _renderButtonRow(row, buttons, rowTitle = "") {
    if (!buttons.length) return ""
    return html`
      <div class="extra-row-wrap">
        ${rowTitle ? html`<div class="extra-row-title">${rowTitle}</div>` : ""}
        <div
          class="extra-row ${row.scroll ? "scrollable" : "wrapped"} align-${row.align || "start"}"
          style="--row-gap:${Number(row.gap || 8)}px;"
        >
          ${buttons.map(
            (button) => html`
              <button
                class="extra-button"
                style="${this._extraButtonWidthStyle(row)}"
                @click="${() => this._onExtraButtonTap(button)}"
              >
                ${button.icon ? html`<ha-icon icon="${button.icon}"></ha-icon>` : ""}
                <span>${button.label || button.name || "Action"}</span>
              </button>
            `
          )}
        </div>
      </div>
    `
  }

  _renderExtraButtons() {
    const row = this.config.button_row
    if (!row?.enabled) return ""

    const allButtons = (row?.buttons || []).filter((button) => this._buttonIsEnabled(button))
    const groups = row?.groups || []
    const groupIds = new Set(groups.map((group) => group.id))

    const mainButtons = allButtons.filter(
      (button) => !button.group_id || !groupIds.has(button.group_id)
    )
    const groupRows = groups
      .filter((group) => group.enabled !== false)
      .map((group) => {
        const groupButtons = allButtons.filter((button) => button.group_id === group.id)
        return this._renderButtonRow(group, groupButtons, group.label || "")
      })

    return html`${this._renderButtonRow(row, mainButtons)} ${groupRows}`
  }

  _renderControlByType() {
    if (this._controlType === "light") return this._renderControlLight()
    if (this._controlType === "volume") return this._renderControlVolume()
    if (this._controlType === "cover") return this._renderControlCover()
    return this._renderControlButton()
  }

  render() {
    if (!this._entity) {
      return html`<ha-card
        ><div class="unavailable">Entity not found: ${this.config?.entity}</div></ha-card
      >`
    }

    const effectiveTextColor = this._resolveTextColor()
    const effectiveInactiveColor = this._resolveInactiveColor(effectiveTextColor)

    return html`
      <ha-card
        class="${this._shapeClass} ${this._sizeClass} ${this._appearanceClass} preset-${this.config
          .style.preset} ${this._isActive ? "active" : ""}"
        @pointerdown="${this._onPointerDown}"
        @pointerup="${this._onPointerUp}"
        @pointerleave="${this._onPointerCancel}"
        @pointercancel="${this._onPointerCancel}"
        @click="${this._onCardClick}"
        @dblclick="${this._onCardDoubleClick}"
        style="
          --accent-color:${this.config.style.active_color};
          --inactive-color:${effectiveInactiveColor};
          --card-bg:${this.config.style.background_color};
          --text-color:${effectiveTextColor};
          --preset-border:${this._presetStyle.border};
          --preset-overlay:${this._presetStyle.overlay};
        "
      >
        <div class="overlay"></div>
        <div class="content" @click="${(ev) => ev.stopPropagation()}">
          <div class="header">
            <div class="identity">
              <ha-icon class="main-icon" icon="${this._icon}"></ha-icon>
              <div class="meta">
                ${this.config.show_name ? html`<div class="name">${this._name}</div>` : ""}
                ${this.config.show_state
                  ? html`<div class="state">${this._stateDisplay}</div>`
                  : ""}
              </div>
            </div>
            <div class="badge">${this._controlType}</div>
          </div>

          ${this._renderControlByType()} ${this._renderExtraButtons()}
        </div>
      </ha-card>
    `
  }

  getCardSize() {
    const groupCount = (this.config?.button_row?.groups || []).filter(
      (g) => g.enabled !== false
    ).length
    if (!this.config?.button_row?.enabled) return 2
    return Math.min(6, 3 + groupCount)
  }

  static getConfigElement() {
    return document.createElement("naive-flex-card-editor")
  }

  static getStubConfig() {
    return {
      entity: "light.kitchen",
      control_type: "auto",
      button_row: {
        enabled: true,
        scroll: true,
        min_button_width: 72,
        max_button_width: 132,
        buttons: [
          { label: "Off", icon: "mdi:power", action: "call-service", service: "light.turn_off" },
          {
            label: "50%",
            icon: "mdi:brightness-6",
            action: "call-service",
            service: "light.turn_on",
            service_data: { brightness_pct: 50 },
          },
          {
            label: "100%",
            icon: "mdi:brightness-7",
            action: "call-service",
            service: "light.turn_on",
            service_data: { brightness_pct: 100 },
          },
        ],
      },
    }
  }

  static get styles() {
    return css`
      :host {
        display: block;
      }

      ha-card {
        position: relative;
        overflow: hidden;
        background: var(--card-bg);
        color: var(--text-color);
        border: var(--preset-border);
        cursor: pointer;
        transition:
          transform 180ms ease,
          box-shadow 180ms ease,
          border-color 180ms ease;
      }

      ha-card:hover {
        transform: translateY(-1px);
      }

      ha-card.active {
        border-color: var(--accent-color);
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
      }

      .overlay {
        position: absolute;
        inset: 0;
        background: var(--preset-overlay);
        pointer-events: none;
      }

      .preset-navbar_popup {
        border-radius: 18px;
        box-shadow: 0 16px 36px rgba(0, 0, 0, 0.34);
        border-color: rgba(148, 163, 184, 0.35);
      }

      .preset-navbar_popup.glass {
        backdrop-filter: blur(14px) saturate(125%);
        background: linear-gradient(180deg, rgba(31, 41, 55, 0.78), rgba(17, 24, 39, 0.82));
      }

      .preset-navbar_popup .chip,
      .preset-navbar_popup .extra-button {
        border-radius: 999px;
        border-color: rgba(148, 163, 184, 0.32);
        background: linear-gradient(180deg, rgba(30, 41, 59, 0.72), rgba(15, 23, 42, 0.66));
      }

      .preset-navbar_popup .chip.primary {
        background: linear-gradient(180deg, rgba(56, 189, 248, 0.45), rgba(14, 116, 144, 0.48));
        border-color: rgba(56, 189, 248, 0.6);
      }

      .preset-navbar_popup .badge {
        background: rgba(15, 23, 42, 0.5);
        border: 1px solid rgba(148, 163, 184, 0.25);
      }

      .content {
        position: relative;
        display: flex;
        flex-direction: column;
        gap: 12px;
      }

      .compact .content {
        padding: 10px;
      }

      .comfortable .content {
        padding: 14px;
      }

      .large .content {
        padding: 18px;
      }

      .rounded {
        border-radius: 14px;
      }

      .square {
        border-radius: 4px;
      }

      .pill {
        border-radius: 24px;
      }

      .solid {
        backdrop-filter: none;
      }

      .glass {
        backdrop-filter: blur(8px);
        background: color-mix(in srgb, var(--card-bg) 74%, white 6%);
      }

      .outline {
        background: color-mix(in srgb, var(--card-bg) 66%, black 10%);
      }

      .header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 10px;
      }

      .identity {
        display: flex;
        align-items: center;
        gap: 10px;
        min-width: 0;
      }

      .main-icon {
        color: var(--accent-color);
        --mdc-icon-size: 24px;
      }

      .meta {
        min-width: 0;
      }

      .name {
        font-size: 0.92rem;
        font-weight: 600;
        line-height: 1.3;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .state {
        font-size: 0.8rem;
        color: var(--inactive-color);
      }

      .badge {
        flex-shrink: 0;
        font-size: 0.68rem;
        text-transform: uppercase;
        letter-spacing: 0.06em;
        padding: 4px 8px;
        border-radius: 10px;
        color: var(--inactive-color);
        background: rgba(255, 255, 255, 0.05);
      }

      .control-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 8px;
      }

      .control-grid.single {
        grid-template-columns: 1fr;
      }

      .chip {
        min-height: 36px;
        border-radius: 10px;
        border: 1px solid rgba(255, 255, 255, 0.12);
        background: rgba(255, 255, 255, 0.04);
        color: var(--text-color);
        font-size: 0.8rem;
        font-weight: 600;
        cursor: pointer;
        transition:
          background 150ms ease,
          border-color 150ms ease;
      }

      .chip:hover {
        border-color: var(--accent-color);
        background: rgba(56, 189, 248, 0.14);
      }

      .chip.primary {
        background: color-mix(in srgb, var(--accent-color) 32%, transparent);
        border-color: color-mix(in srgb, var(--accent-color) 56%, transparent);
      }

      .slider-block {
        display: grid;
        gap: 4px;
      }

      .slider-block label {
        font-size: 0.75rem;
        color: var(--inactive-color);
      }

      .slider-block input[type="range"] {
        width: 100%;
      }

      .extra-row {
        display: flex;
        gap: var(--row-gap, 8px);
      }

      .extra-row-wrap {
        display: grid;
        gap: 5px;
      }

      .extra-row-title {
        font-size: 0.73rem;
        letter-spacing: 0.04em;
        color: var(--inactive-color);
      }

      .extra-row.scrollable {
        overflow-x: auto;
        overscroll-behavior-x: contain;
        padding-bottom: 4px;
      }

      .extra-row.scrollable::-webkit-scrollbar {
        height: 6px;
      }

      .extra-row.scrollable::-webkit-scrollbar-thumb {
        border-radius: 6px;
        background: rgba(255, 255, 255, 0.18);
      }

      .extra-row.wrapped {
        flex-wrap: wrap;
      }

      .extra-row.align-start {
        justify-content: flex-start;
      }

      .extra-row.align-center {
        justify-content: center;
      }

      .extra-row.align-end {
        justify-content: flex-end;
      }

      .extra-button {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        height: 38px;
        padding: 0 10px;
        border-radius: 12px;
        border: 1px solid rgba(255, 255, 255, 0.16);
        background: linear-gradient(180deg, rgba(255, 255, 255, 0.09), rgba(255, 255, 255, 0.03));
        color: var(--text-color);
        white-space: nowrap;
        cursor: pointer;
      }

      .extra-button ha-icon {
        --mdc-icon-size: 16px;
      }

      .extra-button:hover {
        border-color: var(--accent-color);
        background: rgba(56, 189, 248, 0.14);
      }

      .unavailable {
        padding: 14px;
        color: var(--error-color, #ef4444);
      }

      @media (max-width: 600px) {
        .control-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }

        .badge {
          font-size: 0.62rem;
        }
      }
    `
  }
}

class NaiveFlexCardEditor extends LitElement {
  static get properties() {
    return {
      hass: { type: Object },
      config: { type: Object },
    }
  }

  setConfig(config) {
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
      style: {
        ...DEFAULT_CONFIG.style,
        ...(config.style || {}),
      },
      button_row: {
        ...DEFAULT_CONFIG.button_row,
        ...(config.button_row || {}),
      },
    }

    if (!Array.isArray(this.config.button_row.buttons)) {
      this.config.button_row.buttons = []
    }
    if (!Array.isArray(this.config.button_row.groups)) {
      this.config.button_row.groups = []
    }
  }

  _emit(config) {
    this.dispatchEvent(new CustomEvent("config-changed", { detail: { config } }))
  }

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

  _onInput(path, event) {
    const value = event.target.value
    if (value === "") {
      this._removeValue(path)
      return
    }
    this._setValue(path, value)
  }

  _onNumber(path, event) {
    const value = Number(event.target.value)
    this._setValue(path, Number.isNaN(value) ? 0 : value)
  }

  _onBoolean(path, event) {
    this._setValue(path, event.target.checked)
  }

  _toHexColor(value, fallback = "#00aeef") {
    if (!value || typeof value !== "string") return fallback
    const normalized = value.trim()
    const fullHex = /^#([0-9a-fA-F]{6})$/
    const shortHex = /^#([0-9a-fA-F]{3})$/

    if (fullHex.test(normalized)) return normalized
    if (shortHex.test(normalized)) {
      const [r, g, b] = normalized.slice(1).split("")
      return `#${r}${r}${g}${g}${b}${b}`
    }

    return fallback
  }

  _setColor(path, value) {
    this._setValue(path, value)
  }

  _renderColorField(label, path, fallback) {
    const value = this.config?.style?.[path.split(".").pop()] || ""
    const hexValue = this._toHexColor(value, fallback)

    return html`
      <div class="color-field">
        <label>${label}</label>
        <div class="color-row">
          <input
            class="color-input"
            type="color"
            .value="${hexValue}"
            @input="${(event) => this._setColor(path, event.target.value)}"
          />
          <input
            .value="${value}"
            @input="${(event) => this._onInput(path, event)}"
            placeholder="var(--primary-color, #00AEEF)"
          />
        </div>
      </div>
    `
  }

  _renderIconField(label, value, onValue) {
    return html`
      <div class="icon-field">
        <label>${label}</label>
        <ha-icon-picker
          .hass="${this.hass}"
          .value="${value || ""}"
          @value-changed="${(event) => onValue(event.detail.value || "")}"
        ></ha-icon-picker>
        <input
          .value="${value || ""}"
          placeholder="mdi:lightbulb"
          @input="${(event) => onValue(event.target.value)}"
        />
      </div>
    `
  }

  _actionLabel(actionKey) {
    if (actionKey === "tap_action") return "Tap"
    if (actionKey === "hold_action") return "Hold"
    return "Double Tap"
  }

  _actionConfig(actionKey) {
    return this.config?.[actionKey] || {}
  }

  _effectiveActionType(actionKey) {
    const action = this._actionConfig(actionKey).action
    if (actionKey === "tap_action" && !action) return "default"
    return action || "none"
  }

  _setActionType(actionKey, actionType) {
    if (actionKey === "tap_action" && actionType === "default") {
      this._removeValue(actionKey)
      return
    }

    if (actionType === "none") {
      this._setValue(actionKey, { action: "none" })
      return
    }

    const current = this._actionConfig(actionKey)
    this._setValue(actionKey, {
      ...current,
      action: actionType,
    })
  }

  _setActionField(actionKey, field, value) {
    const current = this._actionConfig(actionKey)
    const next = { ...current }

    if (value === "") {
      delete next[field]
    } else {
      next[field] = value
    }

    if (!next.action) next.action = "none"
    this._setValue(actionKey, next)
  }

  _cardActionDataEntries(actionKey) {
    return Object.entries(this._actionConfig(actionKey).service_data || {})
  }

  _addCardActionData(actionKey) {
    const action = this._actionConfig(actionKey)
    const serviceData = { ...(action.service_data || {}) }
    let keyIndex = 1
    let newKey = `key_${keyIndex}`
    while (Object.prototype.hasOwnProperty.call(serviceData, newKey)) {
      keyIndex += 1
      newKey = `key_${keyIndex}`
    }
    serviceData[newKey] = ""
    this._setActionField(actionKey, "service_data", serviceData)
  }

  _removeCardActionData(actionKey, key) {
    const action = this._actionConfig(actionKey)
    const serviceData = { ...(action.service_data || {}) }
    delete serviceData[key]
    this._setActionField(actionKey, "service_data", serviceData)
  }

  _renameCardActionDataKey(actionKey, oldKey, newKey) {
    const cleanNewKey = (newKey || "").trim()
    if (!cleanNewKey || cleanNewKey === oldKey) return

    const action = this._actionConfig(actionKey)
    const serviceData = { ...(action.service_data || {}) }
    const value = serviceData[oldKey]
    delete serviceData[oldKey]
    serviceData[cleanNewKey] = value
    this._setActionField(actionKey, "service_data", serviceData)
  }

  _setCardActionDataValue(actionKey, key, rawValue) {
    const action = this._actionConfig(actionKey)
    const serviceData = { ...(action.service_data || {}) }
    serviceData[key] = this._toServiceDataValue(rawValue)
    this._setActionField(actionKey, "service_data", serviceData)
  }

  _renderCardActionDataEditor(actionKey) {
    const entries = this._cardActionDataEntries(actionKey)
    return html`
      <div class="subsection">
        <div class="subsection-header">
          <span>Service Data</span>
          <button class="small-btn" @click="${() => this._addCardActionData(actionKey)}">
            + Param
          </button>
        </div>
        ${entries.length
          ? entries.map(
              ([key, value]) => html`
                <div class="grid-3">
                  <input
                    .value="${key}"
                    placeholder="key"
                    @change="${(event) =>
                      this._renameCardActionDataKey(actionKey, key, event.target.value)}"
                  />
                  <input
                    .value="${value == null ? "" : String(value)}"
                    placeholder="value"
                    @input="${(event) =>
                      this._setCardActionDataValue(actionKey, key, event.target.value)}"
                  />
                  <button
                    class="small-btn danger"
                    @click="${() => this._removeCardActionData(actionKey, key)}"
                  >
                    Remove
                  </button>
                </div>
              `
            )
          : html`<div class="hint">No service data defined.</div>`}
      </div>
    `
  }

  _renderActionEditor(actionKey) {
    const actionType = this._effectiveActionType(actionKey)
    const action = this._actionConfig(actionKey)

    return html`
      <div class="action-editor">
        <label>${this._actionLabel(actionKey)} Action</label>
        <select
          .value="${actionType}"
          @change="${(event) => this._setActionType(actionKey, event.target.value)}"
        >
          ${actionKey === "tap_action" ? html`<option value="default">default</option>` : ""}
          <option value="none">none</option>
          <option value="more-info">more-info</option>
          <option value="toggle">toggle</option>
          <option value="call-service">call-service</option>
          <option value="navigate">navigate</option>
          <option value="url">url</option>
        </select>

        ${actionType === "call-service"
          ? html`
              <label>Service</label>
              <input
                .value="${action.service || ""}"
                placeholder="light.turn_on"
                @input="${(event) =>
                  this._setActionField(actionKey, "service", event.target.value)}"
              />
              ${this._renderCardActionDataEditor(actionKey)}
            `
          : ""}
        ${actionType === "navigate"
          ? html`
              <label>Navigation Path</label>
              <input
                .value="${action.navigation_path || ""}"
                placeholder="/lovelace/salon"
                @input="${(event) =>
                  this._setActionField(actionKey, "navigation_path", event.target.value)}"
              />
            `
          : ""}
        ${actionType === "url"
          ? html`
              <label>URL</label>
              <input
                .value="${action.url_path || ""}"
                placeholder="https://example.com"
                @input="${(event) =>
                  this._setActionField(actionKey, "url_path", event.target.value)}"
              />
            `
          : ""}
        ${actionKey === "hold_action" && actionType !== "none"
          ? html`
              <label>Hold Delay (ms)</label>
              <input
                type="number"
                min="100"
                max="3000"
                .value="${String(action.hold_time || 500)}"
                @input="${(event) =>
                  this._setActionField(actionKey, "hold_time", Number(event.target.value) || 500)}"
              />
            `
          : ""}
      </div>
    `
  }

  _toServiceDataValue(value) {
    if (value === "true") return true
    if (value === "false") return false
    if (value !== "" && !Number.isNaN(Number(value))) return Number(value)
    return value
  }

  _buttons() {
    return this.config?.button_row?.buttons || []
  }

  _groups() {
    return this.config?.button_row?.groups || []
  }

  _setButtons(buttons) {
    this._setValue("button_row.buttons", buttons)
  }

  _setGroups(groups) {
    this._setValue("button_row.groups", groups)
  }

  _addButton() {
    const buttons = [...this._buttons()]
    buttons.push({
      label: `Action ${buttons.length + 1}`,
      icon: "mdi:flash",
      action: "toggle",
      enabled: true,
    })
    this._setButtons(buttons)
  }

  _addGroup() {
    const groups = [...this._groups()]
    const id = `group_${groups.length + 1}`
    groups.push({
      id,
      label: `Group ${groups.length + 1}`,
      enabled: true,
      scroll: true,
      gap: 8,
      min_button_width: 72,
      max_button_width: 132,
      button_width: "",
      align: "start",
    })
    this._setGroups(groups)
  }

  _removeButton(index) {
    const buttons = this._buttons().filter((_btn, i) => i !== index)
    this._setButtons(buttons)
  }

  _moveButton(index, direction) {
    const buttons = [...this._buttons()]
    const target = index + direction
    if (target < 0 || target >= buttons.length) return
    const temp = buttons[target]
    buttons[target] = buttons[index]
    buttons[index] = temp
    this._setButtons(buttons)
  }

  _removeGroup(index) {
    const groups = this._groups().filter((_g, i) => i !== index)
    const removed = this._groups()[index]
    this._setGroups(groups)

    if (!removed?.id) return
    const buttons = this._buttons().map((button) => {
      if (button.group_id !== removed.id) return button
      const copy = { ...button }
      delete copy.group_id
      return copy
    })
    this._setButtons(buttons)
  }

  _moveGroup(index, direction) {
    const groups = [...this._groups()]
    const target = index + direction
    if (target < 0 || target >= groups.length) return
    const temp = groups[target]
    groups[target] = groups[index]
    groups[index] = temp
    this._setGroups(groups)
  }

  _setGroupField(index, field, value) {
    const groups = [...this._groups()]
    const updated = { ...(groups[index] || {}) }
    if (value === "") {
      delete updated[field]
    } else {
      updated[field] = value
    }
    groups[index] = updated
    this._setGroups(groups)
  }

  _updateButton(index, patch) {
    const buttons = [...this._buttons()]
    buttons[index] = {
      ...(buttons[index] || {}),
      ...patch,
    }
    this._setButtons(buttons)
  }

  _setButtonField(index, field, value) {
    const buttons = [...this._buttons()]
    const updated = {
      ...(buttons[index] || {}),
    }

    if (value === "") {
      delete updated[field]
    } else {
      updated[field] = value
    }

    buttons[index] = updated
    this._setButtons(buttons)
  }

  _serviceDataEntries(button) {
    return Object.entries(button?.service_data || {})
  }

  _addServiceDataEntry(index) {
    const button = this._buttons()[index] || {}
    const serviceData = { ...(button.service_data || {}) }
    let keyIndex = 1
    let newKey = `key_${keyIndex}`
    while (Object.prototype.hasOwnProperty.call(serviceData, newKey)) {
      keyIndex += 1
      newKey = `key_${keyIndex}`
    }
    serviceData[newKey] = ""
    this._updateButton(index, { service_data: serviceData })
  }

  _removeServiceDataEntry(index, key) {
    const button = this._buttons()[index] || {}
    const serviceData = { ...(button.service_data || {}) }
    delete serviceData[key]
    this._updateButton(index, { service_data: serviceData })
  }

  _renameServiceDataKey(index, oldKey, newKey) {
    const cleanNewKey = (newKey || "").trim()
    if (!cleanNewKey || cleanNewKey === oldKey) return

    const button = this._buttons()[index] || {}
    const serviceData = { ...(button.service_data || {}) }
    const value = serviceData[oldKey]
    delete serviceData[oldKey]
    serviceData[cleanNewKey] = value
    this._updateButton(index, { service_data: serviceData })
  }

  _setServiceDataValue(index, key, rawValue) {
    const button = this._buttons()[index] || {}
    const serviceData = { ...(button.service_data || {}) }
    serviceData[key] = this._toServiceDataValue(rawValue)
    this._updateButton(index, { service_data: serviceData })
  }

  _renderServiceDataEditor(button, index) {
    const entries = this._serviceDataEntries(button)
    return html`
      <div class="subsection">
        <div class="subsection-header">
          <span>Service Data</span>
          <button class="small-btn" @click="${() => this._addServiceDataEntry(index)}">
            + Param
          </button>
        </div>
        ${entries.length
          ? entries.map(
              ([key, value]) => html`
                <div class="grid-3">
                  <input
                    .value="${key}"
                    placeholder="key"
                    @change="${(event) =>
                      this._renameServiceDataKey(index, key, event.target.value)}"
                  />
                  <input
                    .value="${value == null ? "" : String(value)}"
                    placeholder="value"
                    @input="${(event) => this._setServiceDataValue(index, key, event.target.value)}"
                  />
                  <button
                    class="small-btn danger"
                    @click="${() => this._removeServiceDataEntry(index, key)}"
                  >
                    Remove
                  </button>
                </div>
              `
            )
          : html`<div class="hint">No service data defined.</div>`}
      </div>
    `
  }

  _renderButtonEditor(button, index, total) {
    const action = button.action || "toggle"

    return html`
      <div class="button-editor">
        <div class="button-editor-header">
          <strong>Button ${index + 1}</strong>
          <div class="button-editor-actions">
            <button
              class="small-btn"
              ?disabled="${index === 0}"
              @click="${() => this._moveButton(index, -1)}"
            >
              Up
            </button>
            <button
              class="small-btn"
              ?disabled="${index === total - 1}"
              @click="${() => this._moveButton(index, 1)}"
            >
              Down
            </button>
            <button class="small-btn danger" @click="${() => this._removeButton(index)}">
              Delete
            </button>
          </div>
        </div>

        <div class="grid-2">
          <div>
            <label>Label</label>
            <input
              .value="${button.label || ""}"
              @input="${(event) => this._setButtonField(index, "label", event.target.value)}"
            />
          </div>
          <div>
            ${this._renderIconField("Icon", button.icon || "", (value) =>
              this._setButtonField(index, "icon", value)
            )}
          </div>
        </div>

        <label>
          <input
            type="checkbox"
            .checked="${button.enabled !== false}"
            @change="${(event) => this._setButtonField(index, "enabled", event.target.checked)}"
          />
          Enable This Button
        </label>

        <label>Group</label>
        <select
          .value="${button.group_id || ""}"
          @change="${(event) => this._setButtonField(index, "group_id", event.target.value)}"
        >
          <option value="">Main Row</option>
          ${this._groups().map(
            (group) => html`<option value="${group.id}">${group.label || group.id}</option>`
          )}
        </select>

        <div class="grid-2">
          <div>
            <label>Action</label>
            <select
              .value="${action}"
              @change="${(event) => this._setButtonField(index, "action", event.target.value)}"
            >
              <option value="toggle">toggle</option>
              <option value="more-info">more-info</option>
              <option value="call-service">call-service</option>
              <option value="set-value">set-value</option>
            </select>
          </div>
          <div>
            <label>Entity (optional)</label>
            <ha-entity-picker
              .hass="${this.hass}"
              .value="${button.entity || ""}"
              allow-custom-entity
              @value-changed="${(event) =>
                this._setButtonField(index, "entity", event.detail.value || "")}"
            ></ha-entity-picker>
          </div>
        </div>

        ${action === "call-service"
          ? html`
              <div>
                <label>Service</label>
                <input
                  .value="${button.service || ""}"
                  placeholder="light.turn_on"
                  @input="${(event) => this._setButtonField(index, "service", event.target.value)}"
                />
              </div>
              ${this._renderServiceDataEditor(button, index)}
            `
          : ""}
        ${action === "set-value"
          ? html`
              <div class="grid-2">
                <div>
                  <label>Volume Value (0..1)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="1"
                    .value="${button.value == null ? "" : String(button.value)}"
                    @input="${(event) =>
                      this._setButtonField(
                        index,
                        "value",
                        event.target.value === "" ? "" : Number(event.target.value)
                      )}"
                  />
                </div>
                <div>
                  <label>Cover Position (0..100)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    .value="${button.position == null ? "" : String(button.position)}"
                    @input="${(event) =>
                      this._setButtonField(
                        index,
                        "position",
                        event.target.value === "" ? "" : Number(event.target.value)
                      )}"
                  />
                </div>
              </div>
            `
          : ""}
      </div>
    `
  }

  _renderGroupEditor(group, index, total) {
    return html`
      <div class="button-editor">
        <div class="button-editor-header">
          <strong>Group ${index + 1}</strong>
          <div class="button-editor-actions">
            <button
              class="small-btn"
              ?disabled="${index === 0}"
              @click="${() => this._moveGroup(index, -1)}"
            >
              Up
            </button>
            <button
              class="small-btn"
              ?disabled="${index === total - 1}"
              @click="${() => this._moveGroup(index, 1)}"
            >
              Down
            </button>
            <button class="small-btn danger" @click="${() => this._removeGroup(index)}">
              Delete
            </button>
          </div>
        </div>

        <div class="grid-2">
          <div>
            <label>Group ID</label>
            <input
              .value="${group.id || ""}"
              @input="${(event) => this._setGroupField(index, "id", event.target.value)}"
            />
          </div>
          <div>
            <label>Label</label>
            <input
              .value="${group.label || ""}"
              @input="${(event) => this._setGroupField(index, "label", event.target.value)}"
            />
          </div>
        </div>

        <label>
          <input
            type="checkbox"
            .checked="${group.enabled !== false}"
            @change="${(event) => this._setGroupField(index, "enabled", event.target.checked)}"
          />
          Enable This Group
        </label>

        <label>
          <input
            type="checkbox"
            .checked="${group.scroll !== false}"
            @change="${(event) => this._setGroupField(index, "scroll", event.target.checked)}"
          />
          Horizontal Scroll
        </label>

        <div class="grid-2">
          <div>
            <label>Gap (px)</label>
            <input
              type="number"
              .value="${String(group.gap ?? 8)}"
              @input="${(event) =>
                this._setGroupField(index, "gap", Number(event.target.value) || 0)}"
            />
          </div>
          <div>
            <label>Align</label>
            <select
              .value="${group.align || "start"}"
              @change="${(event) => this._setGroupField(index, "align", event.target.value)}"
            >
              <option value="start">start</option>
              <option value="center">center</option>
              <option value="end">end</option>
            </select>
          </div>
        </div>

        <div class="grid-2">
          <div>
            <label>Min Button Width</label>
            <input
              type="number"
              .value="${String(group.min_button_width ?? 72)}"
              @input="${(event) =>
                this._setGroupField(index, "min_button_width", Number(event.target.value) || 0)}"
            />
          </div>
          <div>
            <label>Max Button Width</label>
            <input
              type="number"
              .value="${String(group.max_button_width ?? 132)}"
              @input="${(event) =>
                this._setGroupField(index, "max_button_width", Number(event.target.value) || 0)}"
            />
          </div>
        </div>

        <label>Custom Button Width</label>
        <input
          .value="${group.button_width || ""}"
          @input="${(event) => this._setGroupField(index, "button_width", event.target.value)}"
        />
      </div>
    `
  }

  render() {
    if (!this.config) return html``
    const buttons = this._buttons()
    const groups = this._groups()

    return html`
      <div class="form">
        <details open>
          <summary>General</summary>
          <div class="section-content">
            <ha-entity-picker
              .hass="${this.hass}"
              .value="${this.config.entity || ""}"
              label="Entity"
              allow-custom-entity
              @value-changed="${(event) => this._setValue("entity", event.detail.value)}"
            ></ha-entity-picker>

            <label>Control Type</label>
            <select
              .value="${this.config.control_type || "auto"}"
              @change="${(event) => this._setValue("control_type", event.target.value)}"
            >
              <option value="auto">auto</option>
              <option value="light">light</option>
              <option value="button">button</option>
              <option value="volume">volume</option>
              <option value="cover">cover</option>
            </select>

            <label>Name</label>
            <input
              .value="${this.config.name || ""}"
              @input="${(event) => this._onInput("name", event)}"
            />

            ${this._renderIconField("Icon", this.config.icon || "", (value) => {
              if (value === "") {
                this._removeValue("icon")
                return
              }
              this._setValue("icon", value)
            })}

            <label>
              <input
                type="checkbox"
                .checked="${this.config.show_name !== false}"
                @change="${(event) => this._onBoolean("show_name", event)}"
              />
              Show Name
            </label>

            <label>
              <input
                type="checkbox"
                .checked="${this.config.show_state !== false}"
                @change="${(event) => this._onBoolean("show_state", event)}"
              />
              Show State
            </label>
          </div>
        </details>

        <details>
          <summary>Actions</summary>
          <div class="section-content">
            ${this._renderActionEditor("tap_action")} ${this._renderActionEditor("hold_action")}
            ${this._renderActionEditor("double_tap_action")}
          </div>
        </details>

        <details>
          <summary>Style</summary>
          <div class="section-content">
            <label>Preset Style</label>
            <select
              .value="${this.config.style.preset}"
              @change="${(event) => this._setValue("style.preset", event.target.value)}"
            >
              <option value="modern">modern</option>
              <option value="minimal">minimal</option>
              <option value="outline">outline</option>
              <option value="soft">soft</option>
              <option value="navbar_popup">navbar_popup</option>
            </select>

            <label>Shape</label>
            <select
              .value="${this.config.style.shape}"
              @change="${(event) => this._setValue("style.shape", event.target.value)}"
            >
              <option value="rounded">rounded</option>
              <option value="square">square</option>
              <option value="pill">pill</option>
            </select>

            <label>Appearance</label>
            <select
              .value="${this.config.style.appearance}"
              @change="${(event) => this._setValue("style.appearance", event.target.value)}"
            >
              <option value="solid">solid</option>
              <option value="glass">glass</option>
              <option value="outline">outline</option>
            </select>

            ${this._renderColorField("Active Color", "style.active_color", "#00aeef")}
            ${this._renderColorField("Background Color", "style.background_color", "#1f2937")}
            ${this._renderColorField("Text Color", "style.text_color", "#f9fafb")}

            <label>
              <input
                type="checkbox"
                .checked="${!!this.config.style.auto_text_contrast}"
                @change="${(event) => this._onBoolean("style.auto_text_contrast", event)}"
              />
              Auto Text Contrast (adapte le texte selon le fond)
            </label>
          </div>
        </details>

        <details>
          <summary>Type Options</summary>
          <div class="section-content">
            <label>
              <input
                type="checkbox"
                .checked="${!!this.config.light_controls.show_brightness}"
                @change="${(event) => this._onBoolean("light_controls.show_brightness", event)}"
              />
              Light: Show Brightness Slider
            </label>

            <label>Light Brightness Step</label>
            <input
              type="number"
              min="1"
              max="255"
              .value="${String(this.config.light_controls.brightness_step || 15)}"
              @input="${(event) => this._onNumber("light_controls.brightness_step", event)}"
            />

            <label>
              <input
                type="checkbox"
                .checked="${!!this.config.light_controls.show_color_temp}"
                @change="${(event) => this._onBoolean("light_controls.show_color_temp", event)}"
              />
              Light: Show Color Temperature Controls
            </label>

            <label>Light Color Temperature Step</label>
            <input
              type="number"
              min="1"
              max="200"
              .value="${String(this.config.light_controls.color_temp_step || 20)}"
              @input="${(event) => this._onNumber("light_controls.color_temp_step", event)}"
            />

            <label>
              <input
                type="checkbox"
                .checked="${!!this.config.volume_controls.show_slider}"
                @change="${(event) => this._onBoolean("volume_controls.show_slider", event)}"
              />
              Volume: Show Slider
            </label>

            <label>Volume Step (0..1)</label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              max="1"
              .value="${String(this.config.volume_controls.step || 0.05)}"
              @input="${(event) => this._onNumber("volume_controls.step", event)}"
            />

            <label>
              <input
                type="checkbox"
                .checked="${!!this.config.cover_controls.show_stop}"
                @change="${(event) => this._onBoolean("cover_controls.show_stop", event)}"
              />
              Cover: Show Stop Button
            </label>
          </div>
        </details>

        <details>
          <summary>Horizontal Buttons Row</summary>
          <div class="section-content">
            <label>
              <input
                type="checkbox"
                .checked="${!!this.config.button_row.enabled}"
                @change="${(event) => this._onBoolean("button_row.enabled", event)}"
              />
              Enable Horizontal Buttons Row
            </label>

            <label>
              <input
                type="checkbox"
                .checked="${!!this.config.button_row.scroll}"
                @change="${(event) => this._onBoolean("button_row.scroll", event)}"
              />
              Enable Horizontal Scroll
            </label>

            <label>Row Gap (px)</label>
            <input
              type="number"
              .value="${String(this.config.button_row.gap || 8)}"
              @input="${(event) => this._onNumber("button_row.gap", event)}"
            />

            <label>Min Button Width (px)</label>
            <input
              type="number"
              .value="${String(this.config.button_row.min_button_width || 72)}"
              @input="${(event) => this._onNumber("button_row.min_button_width", event)}"
            />

            <label>Max Button Width (px)</label>
            <input
              type="number"
              .value="${String(this.config.button_row.max_button_width || 140)}"
              @input="${(event) => this._onNumber("button_row.max_button_width", event)}"
            />

            <label>Custom Button Width (optional, e.g. 110px / 30%)</label>
            <input
              .value="${this.config.button_row.button_width || ""}"
              @input="${(event) => this._onInput("button_row.button_width", event)}"
            />

            <label>Row Align</label>
            <select
              .value="${this.config.button_row.align || "start"}"
              @change="${(event) => this._setValue("button_row.align", event.target.value)}"
            >
              <option value="start">start</option>
              <option value="center">center</option>
              <option value="end">end</option>
            </select>

            <div class="button-list-header">
              <h3>Groups</h3>
              <button class="small-btn" @click="${this._addGroup}">+ Add Group</button>
            </div>
            ${groups.length
              ? groups.map((group, index) => this._renderGroupEditor(group, index, groups.length))
              : html`<div class="hint">No group configured. Buttons stay in main row.</div>`}

            <div class="button-list-header">
              <h3>Buttons</h3>
              <button class="small-btn" @click="${this._addButton}">+ Add Button</button>
            </div>
            ${buttons.length
              ? buttons.map((button, index) =>
                  this._renderButtonEditor(button, index, buttons.length)
                )
              : html`<div class="hint">No buttons configured yet.</div>`}
          </div>
        </details>
      </div>
    `
  }

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

      .icon-field,
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

      .color-input {
        width: 100%;
        height: 38px;
        border-radius: 8px;
        padding: 0;
        border: 1px solid rgba(255, 255, 255, 0.18);
        background: transparent;
      }

      ha-icon-picker {
        width: 100%;
      }

      .action-editor {
        display: grid;
        gap: 8px;
        border: 1px dashed rgba(255, 255, 255, 0.16);
        border-radius: 10px;
        padding: 10px;
      }

      h3 {
        margin: 10px 0 2px;
        font-size: 0.88rem;
        color: var(--primary-text-color, #f9fafb);
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
      }

      .grid-2,
      .grid-3 {
        display: grid;
        gap: 8px;
      }

      .grid-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .grid-3 {
        grid-template-columns: 1fr 1fr auto;
      }

      .button-list-header,
      .button-editor-header,
      .subsection-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
      }

      .button-editor-actions {
        display: flex;
        gap: 6px;
      }

      .button-editor {
        border: 1px solid rgba(255, 255, 255, 0.12);
        border-radius: 10px;
        padding: 10px;
        display: grid;
        gap: 8px;
        background: rgba(255, 255, 255, 0.02);
      }

      .subsection {
        display: grid;
        gap: 8px;
        border-top: 1px dashed rgba(255, 255, 255, 0.14);
        padding-top: 8px;
      }

      .small-btn {
        border: 1px solid rgba(255, 255, 255, 0.18);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.06);
        color: var(--primary-text-color, #f9fafb);
        padding: 6px 10px;
        cursor: pointer;
        font-size: 0.74rem;
      }

      .small-btn.danger {
        border-color: rgba(239, 68, 68, 0.8);
        color: #fecaca;
      }

      .small-btn:disabled {
        opacity: 0.45;
        cursor: not-allowed;
      }

      .hint {
        font-size: 0.78rem;
        color: var(--secondary-text-color, #9ca3af);
      }

      .error {
        color: var(--error-color, #ef4444);
        font-size: 0.76rem;
      }

      @media (max-width: 720px) {
        .grid-2,
        .grid-3 {
          grid-template-columns: 1fr;
        }
      }
    `
  }
}

customElements.define("naive-flex-card", NaiveFlexCard)
customElements.define("naive-flex-card-editor", NaiveFlexCardEditor)

window.customCards = window.customCards || []
window.customCards.push({
  type: "naive-flex-card",
  name: "Naive Flex Card",
  description:
    "Universal configurable card for light/button/volume/cover with style presets and horizontal scroll button row.",
  preview: true,
})
