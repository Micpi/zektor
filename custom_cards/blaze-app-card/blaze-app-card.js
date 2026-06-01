class BlazeAppCard extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" })
    this._config = {
      title: "Blaze Control Center",
      entity_prefix: "blaze_powerzone",
      blaze_device_filter: "",
      entry_id: "",
      show_raw_panel: true,
      show_overview: true,
      show_controls: true,
      show_dsp: true,
      show_signal: true,
      show_variables: true,
      show_api: true,
      core_switch_keywords: "power,mute,protection,standby,enable,bridge",
      primary_number_keywords: "volume,gain,level,master,trim",
      signal_sensor_keywords:
        "signal,rssi,snr,quality,level,input,output,clip,temperature,temp,voltage,current,power,latency",
      dsp_keywords:
        "dsp,eq,equalizer,crossover,xo,delay,phase,polarity,filter,limiter,compressor,preset,profile,routing,matrix",
    }
    this._hass = null
    this._activeTab = "overview"
    this._rawCommand = "GET API_VERSION"
    this._statusMessage = ""
  }

  setConfig(config) {
    if (!config || typeof config !== "object") {
      throw new Error("Invalid configuration")
    }

    this._config = {
      ...this._config,
      ...config,
    }

    this._render()
  }

  set hass(hass) {
    this._hass = hass
    this._render()
  }

  getCardSize() {
    return 12
  }

  static getGridOptions() {
    return {
      columns: 12,
      rows: 6,
      min_columns: 8,
      min_rows: 4,
    }
  }

  static getConfigElement() {
    return document.createElement("blaze-app-card-editor")
  }

  static getStubConfig() {
    return {
      type: "custom:blaze-app-card",
      title: "Blaze Control Center",
      entity_prefix: "blaze_powerzone",
      blaze_device_filter: "",
      show_raw_panel: true,
      show_overview: true,
      show_controls: true,
      show_dsp: true,
      show_signal: true,
      show_variables: true,
      show_api: true,
    }
  }

  _parseKeywordsFromConfig(configKey, fallback) {
    const raw = this._config?.[configKey]
    if (typeof raw !== "string" || !raw.trim()) {
      return fallback
    }
    return raw
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean)
  }

  _sectionEnabled(key, fallback = true) {
    const value = this._config?.[key]
    return typeof value === "boolean" ? value : fallback
  }

  _escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;")
  }

  _getName(entityId, stateObj) {
    return stateObj?.attributes?.friendly_name || entityId
  }

  _entityHaystack(entityId, stateObj) {
    const name = this._getName(entityId, stateObj)
    const deviceClass = stateObj?.attributes?.device_class || ""
    const unit = stateObj?.attributes?.unit_of_measurement || ""
    return `${entityId} ${name} ${deviceClass} ${unit}`.toLowerCase()
  }

  _hasAnyKeyword(entityId, stateObj, keywords) {
    if (!keywords?.length) return false
    const haystack = this._entityHaystack(entityId, stateObj)
    return keywords.some((keyword) => haystack.includes(keyword))
  }

  _pickByKeywords(items, keywords) {
    return items.filter(([entityId, stateObj]) => this._hasAnyKeyword(entityId, stateObj, keywords))
  }

  _getConfiguredPrefixes() {
    const raw = this._config.entity_prefix || "blaze_powerzone"
    return String(raw)
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean)
  }

  _entitySlug(entityId) {
    return (
      String(entityId || "")
        .toLowerCase()
        .split(".")[1] || ""
    )
  }

  _deriveDeviceKey(entityId, stateObj) {
    const slug = this._entitySlug(entityId)
    const tokens = slug.split("_").filter(Boolean)
    if (!tokens.length) return ""

    const stopTokens = new Set([
      "system",
      "signal",
      "api",
      "firmware",
      "serial",
      "mac",
      "lan",
      "wifi",
      "device",
      "zone",
      "out",
      "output",
      "in",
      "input",
      "generator",
      "setup",
      "power",
      "gain",
      "mute",
      "duck",
      "compressor",
      "eq",
      "crossover",
      "limiter",
      "state",
      "status",
      "name",
    ])

    const stopIndex = tokens.findIndex((token) => stopTokens.has(token))
    if (stopIndex > 0) {
      return tokens.slice(0, stopIndex).join("_")
    }

    const manufacturer = (stateObj?.attributes?.manufacturer || "").toLowerCase()
    if (manufacturer.includes("blaze") && tokens.length >= 2) {
      return tokens.slice(0, 2).join("_")
    }

    return tokens[0]
  }

  _matchesSelectedDevice(entityId, stateObj) {
    const selected = String(this._config?.blaze_device_filter || "")
      .trim()
      .toLowerCase()
    if (!selected) return true

    const deviceKey = this._deriveDeviceKey(entityId, stateObj)
    if (deviceKey && deviceKey === selected) return true

    const slug = this._entitySlug(entityId)
    return (
      slug.startsWith(`${selected}_`) ||
      slug.includes(`_${selected}_`) ||
      slug.endsWith(`_${selected}`)
    )
  }

  _looksLikeBlazeEntity(entityId, stateObj) {
    const hintKeywords = [
      "blaze",
      "powerzone",
      "api_version",
      "system state",
      "signal in",
      "signal out",
      "zone ",
      "output ",
      "input ",
      "mute",
      "gain",
      "duck",
      "compressor",
      "crossover",
      "limiter",
      "equalizer",
      " eq",
      " hpf",
      " lpf",
      "firmware",
      "serial",
      "lan ip",
      "wifi ip",
    ]

    const haystack = this._entityHaystack(entityId, stateObj)
    const attribution = String(stateObj?.attributes?.attribution || "").toLowerCase()
    return (
      hintKeywords.some((keyword) => haystack.includes(keyword)) || attribution.includes("blaze")
    )
  }

  _matchesBlazeEntity(entityId, stateObj) {
    const prefixes = this._getConfiguredPrefixes()
    const lowerId = entityId.toLowerCase()
    const manufacturer = (stateObj?.attributes?.manufacturer || "").toLowerCase()
    const attribution = (stateObj?.attributes?.attribution || "").toLowerCase()

    if (prefixes.some((prefix) => lowerId.includes(prefix))) {
      return this._matchesSelectedDevice(entityId, stateObj)
    }

    if (manufacturer.includes("blaze") || attribution.includes("blaze")) {
      return this._matchesSelectedDevice(entityId, stateObj)
    }

    return false
  }

  _matchesBlazeEntityFallback(entityId, stateObj) {
    if (!this._looksLikeBlazeEntity(entityId, stateObj)) {
      return false
    }

    return this._matchesSelectedDevice(entityId, stateObj)
  }

  _collectEntities() {
    if (!this._hass) {
      return { sensors: [], numbers: [], selects: [], switches: [], buttons: [] }
    }

    const result = { sensors: [], numbers: [], selects: [], switches: [], buttons: [] }

    const candidates = Object.entries(this._hass.states)

    for (const [entityId, stateObj] of candidates) {
      if (!this._matchesBlazeEntity(entityId, stateObj)) {
        continue
      }

      if (entityId.startsWith("sensor.")) result.sensors.push([entityId, stateObj])
      if (entityId.startsWith("number.")) result.numbers.push([entityId, stateObj])
      if (entityId.startsWith("select.")) result.selects.push([entityId, stateObj])
      if (entityId.startsWith("switch.")) result.switches.push([entityId, stateObj])
      if (entityId.startsWith("button.")) result.buttons.push([entityId, stateObj])
    }

    const strictCount =
      result.sensors.length +
      result.numbers.length +
      result.selects.length +
      result.switches.length +
      result.buttons.length

    if (strictCount === 0) {
      for (const [entityId, stateObj] of candidates) {
        if (!this._matchesBlazeEntityFallback(entityId, stateObj)) {
          continue
        }

        if (entityId.startsWith("sensor.")) result.sensors.push([entityId, stateObj])
        if (entityId.startsWith("number.")) result.numbers.push([entityId, stateObj])
        if (entityId.startsWith("select.")) result.selects.push([entityId, stateObj])
        if (entityId.startsWith("switch.")) result.switches.push([entityId, stateObj])
        if (entityId.startsWith("button.")) result.buttons.push([entityId, stateObj])
      }
    }

    const sortByName = (a, b) => {
      const nameA = this._getName(a[0], a[1])
      const nameB = this._getName(b[0], b[1])
      return nameA.localeCompare(nameB)
    }

    result.sensors.sort(sortByName)
    result.numbers.sort(sortByName)
    result.selects.sort(sortByName)
    result.switches.sort(sortByName)
    result.buttons.sort(sortByName)

    return result
  }

  _parseNumber(value) {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : null
  }

  _formatSensorValue(st) {
    const unit = st?.attributes?.unit_of_measurement || ""
    const raw = st?.state ?? "-"
    const n = this._parseNumber(raw)
    if (n === null) return this._escapeHtml(raw)
    return `${n.toFixed(Math.abs(n) < 10 ? 2 : 1)}${unit ? ` ${unit}` : ""}`
  }

  _signalRangeForSensor(entityId, st) {
    const haystack = this._entityHaystack(entityId, st)
    const unit = (st?.attributes?.unit_of_measurement || "").toLowerCase()

    if (haystack.includes("rssi") || unit === "dbm") {
      return { min: -100, max: -20, danger: -85, warn: -70 }
    }
    if (haystack.includes("snr")) {
      return { min: 0, max: 40, danger: 10, warn: 20 }
    }
    if (haystack.includes("temperature") || haystack.includes("temp") || unit === "°c") {
      return { min: 0, max: 100, danger: 80, warn: 60 }
    }
    if (haystack.includes("voltage") || unit === "v") {
      return { min: 0, max: 60, danger: 15, warn: 24, reverse: true }
    }
    if (haystack.includes("current") || unit === "a") {
      return { min: 0, max: 30, danger: 25, warn: 18 }
    }
    if (haystack.includes("power") || unit === "w") {
      return { min: 0, max: 5000, danger: 4200, warn: 3000 }
    }
    if (haystack.includes("latency") || unit === "ms") {
      return { min: 0, max: 200, danger: 140, warn: 80 }
    }
    if (haystack.includes("signal") || haystack.includes("level") || unit === "db") {
      return { min: -60, max: 12, danger: 6, warn: 0 }
    }

    return { min: 0, max: 100, danger: 85, warn: 65 }
  }

  _renderGauge(entityId, st) {
    const raw = st?.state
    const value = this._parseNumber(raw)
    if (value === null) return ""

    const name = this._escapeHtml(this._getName(entityId, st))
    const range = this._signalRangeForSensor(entityId, st)
    const ratio = Math.max(0, Math.min(1, (value - range.min) / (range.max - range.min || 1)))
    const percent = Math.round(ratio * 100)

    let tone = "good"
    if (range.reverse) {
      if (value <= range.danger) tone = "bad"
      else if (value <= range.warn) tone = "warn"
    } else {
      if (value >= range.danger) tone = "bad"
      else if (value >= range.warn) tone = "warn"
    }

    const sparkline = this._renderSparkline(st)

    return `
      <article class="gauge-card">
        <header>
          <span>${name}</span>
          <strong>${this._formatSensorValue(st)}</strong>
        </header>
        <div class="gauge-track">
          <div class="gauge-fill ${tone}" style="width:${percent}%"></div>
        </div>
        <footer>
          <span>${range.min}</span>
          <span>${range.max}</span>
        </footer>
        ${sparkline}
      </article>
    `
  }

  _extractSamples(st) {
    const candidates = [st?.attributes?.samples, st?.attributes?.history, st?.attributes?.values]
    for (const candidate of candidates) {
      if (!Array.isArray(candidate)) continue
      const numeric = candidate.map((v) => Number(v)).filter((v) => Number.isFinite(v))
      if (numeric.length >= 2) {
        return numeric.slice(-24)
      }
    }
    return []
  }

  _renderSparkline(st) {
    const samples = this._extractSamples(st)
    if (samples.length < 2) return ""

    const width = 120
    const height = 28
    const min = Math.min(...samples)
    const max = Math.max(...samples)
    const span = max - min || 1
    const points = samples
      .map((value, index) => {
        const x = (index / (samples.length - 1)) * width
        const y = height - ((value - min) / span) * height
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(" ")

    return `
      <div class="sparkline-wrap" aria-hidden="true">
        <svg viewBox="0 0 ${width} ${height}" class="sparkline">
          <polyline points="${points}" />
        </svg>
      </div>
    `
  }

  _renderNumberRows(items) {
    return items
      .map(([entityId, st]) => {
        const name = this._escapeHtml(this._getName(entityId, st))
        const min = Number(st.attributes.min ?? 0)
        const max = Number(st.attributes.max ?? 100)
        const step = Number(st.attributes.step ?? 1)
        const value = this._parseNumber(st.state)

        return `
          <div class="row row-number">
            <span>${name}</span>
            <input class="range" type="range" min="${min}" max="${max}" step="${step}" value="${value ?? min}" data-number="${entityId}">
            <span class="value">${this._escapeHtml(st.state)}</span>
          </div>
        `
      })
      .join("")
  }

  _renderSelectRows(items) {
    return items
      .map(([entityId, st]) => {
        const name = this._escapeHtml(this._getName(entityId, st))
        const options = Array.isArray(st.attributes.options) ? st.attributes.options : []
        const current = st.state

        return `
          <label class="row row-select">
            <span>${name}</span>
            <select data-select="${entityId}">
              ${options
                .map(
                  (opt) =>
                    `<option value="${this._escapeHtml(opt)}" ${opt === current ? "selected" : ""}>${this._escapeHtml(opt)}</option>`
                )
                .join("")}
            </select>
          </label>
        `
      })
      .join("")
  }

  _renderTabs() {
    const tabs = []
    if (this._sectionEnabled("show_overview", true)) tabs.push(["overview", "Overview"])
    if (this._sectionEnabled("show_controls", true)) tabs.push(["controls", "Controls"])
    if (this._sectionEnabled("show_dsp", true)) tabs.push(["dsp", "DSP"])
    if (this._sectionEnabled("show_signal", true)) tabs.push(["signal", "Signal"])
    if (this._sectionEnabled("show_variables", true)) tabs.push(["variables", "Variables"])
    if (this._sectionEnabled("show_api", true)) tabs.push(["api", "API"])

    return tabs
      .map(
        ([id, label]) =>
          `<button class="tab ${this._activeTab === id ? "is-active" : ""}" data-tab="${id}">${label}</button>`
      )
      .join("")
  }

  _renderOverview(entities) {
    const primaryKeywords = this._parseKeywordsFromConfig("primary_number_keywords", [
      "volume",
      "gain",
      "level",
      "master",
      "trim",
    ])
    const signalKeywords = this._parseKeywordsFromConfig("signal_sensor_keywords", [
      "signal",
      "rssi",
      "snr",
      "level",
      "temperature",
      "temp",
      "latency",
      "voltage",
    ])

    const systemSensors = this._pickByKeywords(entities.sensors, [
      "system",
      "api_version",
      "firmware",
      "uptime",
      "status",
    ]).slice(0, 8)

    const quickSignal = this._pickByKeywords(entities.sensors, signalKeywords).slice(0, 6)

    const primaryNumbers = this._pickByKeywords(entities.numbers, primaryKeywords).slice(0, 6)

    return `
      <section class="panel-grid">
        <article class="panel">
          <h3>Etat Systeme</h3>
          <div class="kv-list">
            ${
              systemSensors
                .map(
                  ([entityId, st]) =>
                    `<div class="kv"><span>${this._escapeHtml(this._getName(entityId, st))}</span><strong>${this._escapeHtml(st.state)}</strong></div>`
                )
                .join("") || '<p class="hint">Aucun capteur systeme detecte.</p>'
            }
          </div>
        </article>

        <article class="panel">
          <h3>Actions Rapides</h3>
          <div class="actions">
            ${
              entities.buttons
                .slice(0, 10)
                .map(
                  ([entityId, st]) =>
                    `<button class="action" data-press="${entityId}">${this._escapeHtml(this._getName(entityId, st))}</button>`
                )
                .join("") || '<p class="hint">Aucun bouton expose par l integration.</p>'
            }
          </div>
        </article>

        <article class="panel">
          <h3>Niveaux Principaux</h3>
          <div class="rows">
            ${this._renderNumberRows(primaryNumbers) || '<p class="hint">Aucun slider principal detecte.</p>'}
          </div>
        </article>

        <article class="panel panel-full">
          <h3>Signal Monitoring</h3>
          <div class="gauge-grid">
            ${quickSignal.map(([entityId, st]) => this._renderGauge(entityId, st)).join("") || '<p class="hint">Aucune jauge de signal disponible.</p>'}
          </div>
        </article>

        <article class="panel panel-full">
          <h3>Resume Entites</h3>
          <div class="chips">
            <span class="chip">Sensors: ${entities.sensors.length}</span>
            <span class="chip">Numbers: ${entities.numbers.length}</span>
            <span class="chip">Selects: ${entities.selects.length}</span>
            <span class="chip">Switches: ${entities.switches.length}</span>
            <span class="chip">Buttons: ${entities.buttons.length}</span>
          </div>
        </article>
      </section>
    `
  }

  _renderControls(entities) {
    const coreSwitchKeywords = this._parseKeywordsFromConfig("core_switch_keywords", [
      "power",
      "mute",
      "protection",
      "standby",
      "enable",
      "bridge",
    ])
    const primaryKeywords = this._parseKeywordsFromConfig("primary_number_keywords", [
      "volume",
      "gain",
      "level",
      "trim",
      "master",
      "input",
      "output",
    ])

    const coreSwitches = this._pickByKeywords(entities.switches, coreSwitchKeywords)
    const additionalSwitches = entities.switches.filter(
      ([entityId]) => !coreSwitches.some(([id]) => id === entityId)
    )

    const levelNumbers = this._pickByKeywords(entities.numbers, primaryKeywords)
    const additionalNumbers = entities.numbers.filter(
      ([entityId]) => !levelNumbers.some(([id]) => id === entityId)
    )

    return `
      <section class="stack">
        <article class="panel">
          <h3>Power / Routing Buttons</h3>
          <div class="switch-pills">
            ${
              coreSwitches
                .map(([entityId, st]) => {
                  const isOn = st.state === "on"
                  return `<button class="pill ${isOn ? "is-on" : ""}" data-toggle-btn="${entityId}">${this._escapeHtml(this._getName(entityId, st))}: ${isOn ? "ON" : "OFF"}</button>`
                })
                .join("") || '<p class="hint">Aucun switch principal detecte.</p>'
            }
          </div>
        </article>

        <article class="panel">
          <h3>Sliders</h3>
          <div class="rows">${this._renderNumberRows(levelNumbers)}</div>
        </article>

        <article class="panel">
          <h3>Switches Avances</h3>
          <div class="rows">
            ${
              additionalSwitches
                .map(([entityId, st]) => {
                  const isOn = st.state === "on"
                  return `
                  <label class="row">
                    <span>${this._escapeHtml(this._getName(entityId, st))}</span>
                    <input type="checkbox" data-toggle="${entityId}" ${isOn ? "checked" : ""}>
                  </label>
                `
                })
                .join("") || '<p class="hint">Aucun switch avance detecte.</p>'
            }
          </div>
        </article>

        <article class="panel">
          <h3>Autres Sliders</h3>
          <div class="rows">${this._renderNumberRows(additionalNumbers) || '<p class="hint">Aucun autre slider disponible.</p>'}</div>
        </article>

        <article class="panel">
          <h3>Selects</h3>
          <div class="rows">${this._renderSelectRows(entities.selects) || '<p class="hint">Aucun select expose.</p>'}</div>
        </article>
      </section>
    `
  }

  _renderDsp(entities) {
    const dspKeywords = this._parseKeywordsFromConfig("dsp_keywords", [
      "dsp",
      "eq",
      "equalizer",
      "crossover",
      "xo",
      "delay",
      "phase",
      "polarity",
      "filter",
      "limiter",
      "compressor",
      "preset",
      "profile",
      "routing",
      "matrix",
    ])

    const dspNumbers = this._pickByKeywords(entities.numbers, dspKeywords)
    const dspSelects = this._pickByKeywords(entities.selects, dspKeywords)
    const dspSwitches = this._pickByKeywords(entities.switches, dspKeywords)
    const dspButtons = this._pickByKeywords(entities.buttons, dspKeywords)

    return `
      <section class="stack">
        <article class="panel">
          <h3>DSP Presets / Actions</h3>
          <div class="actions">
            ${
              dspButtons
                .map(
                  ([entityId, st]) =>
                    `<button class="action" data-press="${entityId}">${this._escapeHtml(this._getName(entityId, st))}</button>`
                )
                .join("") || '<p class="hint">Aucun bouton DSP detecte.</p>'
            }
          </div>
        </article>

        <article class="panel">
          <h3>DSP Sliders</h3>
          <div class="rows">${this._renderNumberRows(dspNumbers) || '<p class="hint">Aucun parametre DSP numerique detecte.</p>'}</div>
        </article>

        <article class="panel">
          <h3>DSP Selects</h3>
          <div class="rows">${this._renderSelectRows(dspSelects) || '<p class="hint">Aucun select DSP detecte.</p>'}</div>
        </article>

        <article class="panel">
          <h3>DSP Switches</h3>
          <div class="rows">
            ${
              dspSwitches
                .map(([entityId, st]) => {
                  const isOn = st.state === "on"
                  return `
                  <label class="row">
                    <span>${this._escapeHtml(this._getName(entityId, st))}</span>
                    <input type="checkbox" data-toggle="${entityId}" ${isOn ? "checked" : ""}>
                  </label>
                `
                })
                .join("") || '<p class="hint">Aucun switch DSP detecte.</p>'
            }
          </div>
        </article>
      </section>
    `
  }

  _renderSignal(entities) {
    const signalKeywords = this._parseKeywordsFromConfig("signal_sensor_keywords", [
      "signal",
      "rssi",
      "snr",
      "quality",
      "level",
      "input",
      "output",
      "clip",
      "temperature",
      "temp",
      "voltage",
      "current",
      "power",
      "latency",
    ])
    const signalSensors = this._pickByKeywords(entities.sensors, signalKeywords)

    const gaugeCards = signalSensors
      .map(([entityId, st]) => this._renderGauge(entityId, st))
      .filter(Boolean)
      .join("")

    return `
      <section class="stack">
        <article class="panel">
          <h3>Signal Gauges</h3>
          <div class="gauge-grid">
            ${gaugeCards || '<p class="hint">Aucun capteur numerique de signal detecte.</p>'}
          </div>
        </article>

        <article class="panel">
          <h3>Etat Detaille</h3>
          <div class="table">
            <div class="thead"><span>Capteur</span><span>Valeur</span></div>
            ${
              signalSensors
                .map(
                  ([entityId, st]) =>
                    `<div class="tr"><span>${this._escapeHtml(this._getName(entityId, st))}</span><strong>${this._formatSensorValue(st)}</strong></div>`
                )
                .join("") || '<div class="tr"><span>-</span><strong>-</strong></div>'
            }
          </div>
        </article>
      </section>
    `
  }

  _renderVariables(entities) {
    return `
      <section class="panel">
        <h3>Variables Blaze (lecture)</h3>
        <div class="table">
          <div class="thead"><span>Entity</span><span>Value</span></div>
          ${entities.sensors
            .map(
              ([entityId, st]) =>
                `<div class="tr"><span>${this._escapeHtml(entityId)}</span><strong>${this._escapeHtml(st.state)}</strong></div>`
            )
            .join("")}
        </div>
      </section>
    `
  }

  _renderApiPanel() {
    if (!this._config.show_raw_panel || !this._sectionEnabled("show_api", true)) {
      return '<section class="panel"><h3>API</h3><p>Panel API desactive dans la configuration.</p></section>'
    }

    return `
      <section class="panel">
        <h3>Commandes API Brutes</h3>
        <p class="hint">Fonctions supportees: GET, SET, INC, SUBSCRIBE, UNSUBSCRIBE, POWER_ON, POWER_OFF.</p>
        <div class="api-row">
          <input class="raw-input" data-raw-input value="${this._escapeHtml(this._rawCommand)}">
          <button class="action" data-send-raw>Envoyer</button>
        </div>
      </section>
    `
  }

  async _callService(domain, service, data) {
    try {
      await this._hass.callService(domain, service, data || {})
      this._statusMessage = "Action envoyee avec succes"
    } catch (err) {
      this._statusMessage = `Erreur: ${err?.message || err}`
    }
    this._render()
  }

  _render() {
    if (!this._hass) {
      return
    }

    const entities = this._collectEntities()

    const tabs = this._renderTabs()
    const visibleTabIds = Array.from(tabs.matchAll(/data-tab="([a-z]+)"/g)).map((m) => m[1])
    if (!visibleTabIds.includes(this._activeTab)) {
      this._activeTab = visibleTabIds[0] || "overview"
    }

    let content = ""
    if (this._activeTab === "overview") content = this._renderOverview(entities)
    if (this._activeTab === "controls") content = this._renderControls(entities)
    if (this._activeTab === "dsp") content = this._renderDsp(entities)
    if (this._activeTab === "signal") content = this._renderSignal(entities)
    if (this._activeTab === "variables") content = this._renderVariables(entities)
    if (this._activeTab === "api") content = this._renderApiPanel()

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card {
          --blaze-blue: #00AEEF;
          --blaze-accent: #38BDF8;
          --blaze-bg: #0F172A;
          --blaze-surface: #1E293B;
          --good: #22c55e;
          --warn: #f59e0b;
          --bad: #ef4444;
          color: #E2E8F0;
          background:
            radial-gradient(circle at 8% 8%, rgba(56,189,248,0.2), transparent 34%),
            radial-gradient(circle at 92% 86%, rgba(2,132,199,0.16), transparent 34%),
            linear-gradient(145deg, #0F172A 0%, #1E293B 100%);
          border: 1px solid rgba(56, 189, 248, 0.26);
          overflow: hidden;
        }
        .wrap { padding: 14px; display: grid; gap: 12px; }
        .title { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .title h2 { margin: 0; font: 700 1.1rem "Segoe UI", sans-serif; letter-spacing: 0.02em; }
        .status {
          color: #7DD3FC;
          font-size: 0.85rem;
          background: rgba(14, 165, 233, 0.16);
          border: 1px solid rgba(14, 165, 233, 0.32);
          border-radius: 999px;
          padding: 3px 10px;
          white-space: nowrap;
        }
        .tabs { display: flex; flex-wrap: wrap; gap: 8px; }
        .tab {
          border: 1px solid rgba(125,211,252,0.3);
          background: rgba(15, 23, 42, 0.55);
          color: #BAE6FD;
          padding: 6px 10px;
          border-radius: 999px;
          cursor: pointer;
        }
        .tab.is-active { background: rgba(56, 189, 248, 0.22); color: #fff; border-color: rgba(56,189,248,0.6); }
        .panel-grid { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); }
        .panel-full { grid-column: 1 / -1; }
        .stack { display: grid; gap: 10px; }
        .panel {
          background: rgba(15, 23, 42, 0.6);
          border: 1px solid rgba(148, 163, 184, 0.22);
          border-radius: 12px;
          padding: 12px;
        }
        .panel h3 { margin: 0 0 10px 0; font-size: 0.95rem; color: #E0F2FE; }
        .kv-list, .rows, .table { display: grid; gap: 8px; }
        .kv, .row, .tr, .thead { display: grid; gap: 10px; align-items: center; grid-template-columns: 1fr auto; }
        .row-number { grid-template-columns: 1fr minmax(140px, 300px) auto; }
        .row-select { grid-template-columns: 1fr minmax(140px, 280px); }
        .value { color: #7DD3FC; font-variant-numeric: tabular-nums; }
        .chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .chip { background: rgba(56,189,248,0.18); border: 1px solid rgba(56,189,248,0.35); border-radius: 999px; padding: 4px 9px; font-size: 0.8rem; }
        .actions { display: flex; flex-wrap: wrap; gap: 8px; }
        .action {
          background: linear-gradient(140deg, #0284C7, #0EA5E9);
          color: white;
          border: 0;
          border-radius: 9px;
          padding: 8px 12px;
          cursor: pointer;
        }
        .switch-pills { display: flex; flex-wrap: wrap; gap: 8px; }
        .pill {
          border: 1px solid rgba(148, 163, 184, 0.4);
          color: #E2E8F0;
          background: rgba(15, 23, 42, 0.7);
          border-radius: 999px;
          padding: 7px 11px;
          cursor: pointer;
        }
        .pill.is-on {
          border-color: rgba(34,197,94,0.6);
          background: rgba(34,197,94,0.2);
          color: #dcfce7;
        }
        .gauge-grid {
          display: grid;
          gap: 10px;
          grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
        }
        .gauge-card {
          border: 1px solid rgba(148,163,184,0.22);
          border-radius: 10px;
          padding: 10px;
          background: rgba(2, 6, 23, 0.45);
          display: grid;
          gap: 7px;
        }
        .gauge-card header,
        .gauge-card footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 10px;
        }
        .gauge-card header strong { color: #bae6fd; font-variant-numeric: tabular-nums; }
        .gauge-card footer { color: #94a3b8; font-size: 0.8rem; }
        .sparkline-wrap {
          border-top: 1px solid rgba(148,163,184,0.2);
          padding-top: 6px;
        }
        .sparkline {
          display: block;
          width: 100%;
          height: 28px;
        }
        .sparkline polyline {
          fill: none;
          stroke: #38bdf8;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
          filter: drop-shadow(0 0 4px rgba(56,189,248,0.35));
        }
        .gauge-track {
          width: 100%;
          height: 10px;
          border-radius: 999px;
          background: rgba(148,163,184,0.22);
          overflow: hidden;
        }
        .gauge-fill { height: 100%; border-radius: 999px; transition: width 260ms ease; }
        .gauge-fill.good { background: linear-gradient(90deg, #0ea5e9, var(--good)); }
        .gauge-fill.warn { background: linear-gradient(90deg, #38bdf8, var(--warn)); }
        .gauge-fill.bad { background: linear-gradient(90deg, #f59e0b, var(--bad)); }
        .table { max-height: 420px; overflow: auto; }
        .thead { color: #93C5FD; font-weight: 600; position: sticky; top: 0; background: rgba(15,23,42,0.95); padding-bottom: 4px; }
        .tr { font-size: 0.9rem; border-bottom: 1px solid rgba(148,163,184,0.16); padding-bottom: 6px; }
        .hint { color: #BAE6FD; margin: 0; font-size: 0.86rem; }
        .api-row { display: grid; gap: 8px; grid-template-columns: 1fr auto; }
        .raw-input, select, .range {
          width: 100%;
          background: rgba(15,23,42,0.9);
          color: #E2E8F0;
          border: 1px solid rgba(148,163,184,0.4);
          border-radius: 8px;
          padding: 7px;
          box-sizing: border-box;
        }
        @media (max-width: 920px) {
          .row-number, .row-select { grid-template-columns: 1fr; }
          .api-row { grid-template-columns: 1fr; }
          .status { width: 100%; text-align: center; }
          .title { flex-direction: column; align-items: flex-start; }
        }
      </style>
      <ha-card>
        <div class="wrap">
          <div class="title">
            <h2>${this._escapeHtml(this._config.title)}</h2>
            <span class="status">${this._escapeHtml(this._statusMessage || "Pret")}</span>
          </div>
          <div class="tabs">${tabs}</div>
          ${content}
        </div>
      </ha-card>
    `

    this.shadowRoot.querySelectorAll(".tab").forEach((el) => {
      el.addEventListener("click", () => {
        this._activeTab = el.dataset.tab
        this._render()
      })
    })

    this.shadowRoot.querySelectorAll("[data-press]").forEach((el) => {
      el.addEventListener("click", async () => {
        await this._callService("button", "press", { entity_id: el.dataset.press })
      })
    })

    this.shadowRoot.querySelectorAll("[data-toggle]").forEach((el) => {
      el.addEventListener("change", async () => {
        await this._callService("homeassistant", "toggle", { entity_id: el.dataset.toggle })
      })
    })

    this.shadowRoot.querySelectorAll("[data-toggle-btn]").forEach((el) => {
      el.addEventListener("click", async () => {
        await this._callService("homeassistant", "toggle", { entity_id: el.dataset.toggleBtn })
      })
    })

    this.shadowRoot.querySelectorAll("[data-number]").forEach((el) => {
      el.addEventListener("change", async () => {
        await this._callService("number", "set_value", {
          entity_id: el.dataset.number,
          value: Number(el.value),
        })
      })
    })

    this.shadowRoot.querySelectorAll("[data-select]").forEach((el) => {
      el.addEventListener("change", async () => {
        await this._callService("select", "select_option", {
          entity_id: el.dataset.select,
          option: el.value,
        })
      })
    })

    const rawInput = this.shadowRoot.querySelector("[data-raw-input]")
    if (rawInput) {
      rawInput.addEventListener("input", () => {
        this._rawCommand = rawInput.value
      })
    }

    const rawButton = this.shadowRoot.querySelector("[data-send-raw]")
    if (rawButton) {
      rawButton.addEventListener("click", async () => {
        const payload = { command: this._rawCommand }
        if (this._config.entry_id) {
          payload.entry_id = this._config.entry_id
        }
        await this._callService("blaze_powerzone", "send_raw_command", payload)
      })
    }
  }
}

class BlazeAppCardEditor extends HTMLElement {
  constructor() {
    super()
    this.attachShadow({ mode: "open" })
    this._config = {}
    this._hass = null
  }

  setConfig(config) {
    this._config = {
      title: "Blaze Control Center",
      entity_prefix: "blaze_powerzone",
      blaze_device_filter: "",
      entry_id: "",
      show_raw_panel: true,
      show_overview: true,
      show_controls: true,
      show_dsp: true,
      show_signal: true,
      show_variables: true,
      show_api: true,
      core_switch_keywords: "power,mute,protection,standby,enable,bridge",
      primary_number_keywords: "volume,gain,level,master,trim",
      signal_sensor_keywords:
        "signal,rssi,snr,quality,level,input,output,clip,temperature,temp,voltage,current,power,latency",
      dsp_keywords:
        "dsp,eq,equalizer,crossover,xo,delay,phase,polarity,filter,limiter,compressor,preset,profile,routing,matrix",
      ...config,
    }
    this._render()
  }

  set hass(hass) {
    this._hass = hass
    this._render()
  }

  _editorEntityHaystack(entityId, stateObj) {
    const name = stateObj?.attributes?.friendly_name || ""
    const manufacturer = stateObj?.attributes?.manufacturer || ""
    const attribution = stateObj?.attributes?.attribution || ""
    return `${entityId} ${name} ${manufacturer} ${attribution}`.toLowerCase()
  }

  _looksLikeBlazeInEditor(entityId, stateObj) {
    const haystack = this._editorEntityHaystack(entityId, stateObj)
    const hints = [
      "blaze",
      "powerzone",
      "zone",
      "output",
      "input",
      "signal",
      "firmware",
      "api_version",
      "duck",
      "compressor",
    ]
    return hints.some((hint) => haystack.includes(hint))
  }

  _deriveDeviceKeyFromId(entityId) {
    const slug =
      String(entityId || "")
        .toLowerCase()
        .split(".")[1] || ""
    const tokens = slug.split("_").filter(Boolean)
    if (!tokens.length) return ""

    const stopTokens = new Set([
      "system",
      "signal",
      "api",
      "firmware",
      "serial",
      "lan",
      "wifi",
      "zone",
      "out",
      "output",
      "in",
      "input",
      "power",
      "gain",
      "mute",
      "name",
      "status",
    ])
    const idx = tokens.findIndex((token) => stopTokens.has(token))
    if (idx > 0) return tokens.slice(0, idx).join("_")
    return tokens[0]
  }

  _buildDeviceOptions() {
    if (!this._hass) return []

    const buckets = new Map()
    for (const [entityId, stateObj] of Object.entries(this._hass.states)) {
      if (!this._looksLikeBlazeInEditor(entityId, stateObj)) continue
      const key = this._deriveDeviceKeyFromId(entityId)
      if (!key) continue
      const current = buckets.get(key) || { count: 0 }
      current.count += 1
      buckets.set(key, current)
    }

    return Array.from(buckets.entries())
      .sort((a, b) => b[1].count - a[1].count)
      .map(([key, data]) => ({ value: key, label: `${key} (${data.count} entites)` }))
  }

  _emitConfig() {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    )
  }

  _setValue(key, value) {
    const next = { ...this._config, [key]: value }
    this._config = next
    this._emitConfig()
  }

  _render() {
    const deviceOptions = this._buildDeviceOptions()
    const selectedDevice = this._config.blaze_device_filter || ""

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; font-family: "Segoe UI", sans-serif; }
        .root { display: grid; gap: 10px; }
        details {
          border: 1px solid rgba(148,163,184,0.4);
          border-radius: 10px;
          background: rgba(15,23,42,0.04);
          padding: 8px;
        }
        summary {
          cursor: pointer;
          font-weight: 600;
          color: var(--primary-text-color);
        }
        .group { margin-top: 10px; display: grid; gap: 8px; }
        label { font-size: 0.85rem; color: var(--secondary-text-color); }
        input[type="text"], select {
          width: 100%;
          box-sizing: border-box;
          border: 1px solid rgba(148,163,184,0.5);
          border-radius: 8px;
          padding: 8px;
          background: var(--card-background-color);
          color: var(--primary-text-color);
        }
      </style>
      <div class="root">
        <details open>
          <summary>General</summary>
          <div class="group">
            <label>Titre</label>
            <input type="text" data-key="title" value="${this._config.title || ""}">

            <label>Ampli Blaze cible</label>
            <select data-key="blaze_device_filter" data-kind="string">
              <option value="" ${!selectedDevice ? "selected" : ""}>Auto (tous les amplis detectes)</option>
              ${deviceOptions
                .map(
                  (opt) =>
                    `<option value="${opt.value}" ${selectedDevice === opt.value ? "selected" : ""}>${opt.label}</option>`
                )
                .join("")}
            </select>

            <label>Prefix entites (avance)</label>
            <input type="text" data-key="entity_prefix" value="${this._config.entity_prefix || "blaze_powerzone"}">
          </div>
        </details>

        <details>
          <summary>Actions</summary>
          <div class="group">
            <label>Entry ID (optionnel)</label>
            <input type="text" data-key="entry_id" value="${this._config.entry_id || ""}">

            <label>Panel API brute</label>
            <select data-key="show_raw_panel">
              <option value="true" ${this._config.show_raw_panel ? "selected" : ""}>Active</option>
              <option value="false" ${!this._config.show_raw_panel ? "selected" : ""}>Desactive</option>
            </select>
          </div>
        </details>

        <details>
          <summary>Sections</summary>
          <div class="group">
            <label>Overview</label>
            <select data-key="show_overview">
              <option value="true" ${this._config.show_overview ? "selected" : ""}>Visible</option>
              <option value="false" ${!this._config.show_overview ? "selected" : ""}>Masquee</option>
            </select>

            <label>Controls</label>
            <select data-key="show_controls">
              <option value="true" ${this._config.show_controls ? "selected" : ""}>Visible</option>
              <option value="false" ${!this._config.show_controls ? "selected" : ""}>Masquee</option>
            </select>

            <label>DSP</label>
            <select data-key="show_dsp">
              <option value="true" ${this._config.show_dsp ? "selected" : ""}>Visible</option>
              <option value="false" ${!this._config.show_dsp ? "selected" : ""}>Masquee</option>
            </select>

            <label>Signal</label>
            <select data-key="show_signal">
              <option value="true" ${this._config.show_signal ? "selected" : ""}>Visible</option>
              <option value="false" ${!this._config.show_signal ? "selected" : ""}>Masquee</option>
            </select>

            <label>Variables</label>
            <select data-key="show_variables">
              <option value="true" ${this._config.show_variables ? "selected" : ""}>Visible</option>
              <option value="false" ${!this._config.show_variables ? "selected" : ""}>Masquee</option>
            </select>

            <label>API Tab</label>
            <select data-key="show_api">
              <option value="true" ${this._config.show_api ? "selected" : ""}>Visible</option>
              <option value="false" ${!this._config.show_api ? "selected" : ""}>Masquee</option>
            </select>
          </div>
        </details>

        <details>
          <summary>Mapping</summary>
          <div class="group">
            <label>Keywords Switches principaux (CSV)</label>
            <input type="text" data-key="core_switch_keywords" value="${this._config.core_switch_keywords || ""}">

            <label>Keywords Sliders principaux (CSV)</label>
            <input type="text" data-key="primary_number_keywords" value="${this._config.primary_number_keywords || ""}">

            <label>Keywords Signal / Gauges (CSV)</label>
            <input type="text" data-key="signal_sensor_keywords" value="${this._config.signal_sensor_keywords || ""}">

            <label>Keywords DSP (CSV)</label>
            <input type="text" data-key="dsp_keywords" value="${this._config.dsp_keywords || ""}">
          </div>
        </details>
      </div>
    `

    this.shadowRoot.querySelectorAll("input[data-key]").forEach((input) => {
      input.addEventListener("input", () => {
        this._setValue(input.dataset.key, input.value)
      })
    })

    this.shadowRoot.querySelectorAll("select[data-key]").forEach((select) => {
      select.addEventListener("change", () => {
        if (select.dataset.kind === "string") {
          this._setValue(select.dataset.key, select.value)
          return
        }
        this._setValue(select.dataset.key, select.value === "true")
      })
    })
  }
}

customElements.define("blaze-app-card", BlazeAppCard)
customElements.define("blaze-app-card-editor", BlazeAppCardEditor)

window.customCards = window.customCards || []
window.customCards.push({
  type: "blaze-app-card",
  name: "Blaze App Card",
  description: "Structured control center for Blaze PowerZone integration",
})
