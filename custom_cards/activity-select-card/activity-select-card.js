/**
 * Activity Select Card – Home Assistant Custom Card
 *
 * Boutons ronds configurables (titre, icône/image, taille) sur une ligne scrollable.
 * Entièrement configurable via l'éditeur graphique natif de Lovelace.
 */

const CARD_VERSION = "1.2.0"

/* ------------------------------------------------------------------ */
/*  Helper : détecter si une valeur est une URL d'image                */
/* ------------------------------------------------------------------ */
function _isImageUrl(str) {
  if (!str) return false
  const s = str.trim()
  if (/^(https?:\/\/|\/local\/|\/api\/|\/media\/)/.test(s)) return true
  if (/\.(png|jpe?g|gif|svg|webp|bmp|ico)(\?.*)?$/i.test(s)) return true
  return false
}

/* ------------------------------------------------------------------ */
/*  Éditeur graphique natif (GUI)                                     */
/* ------------------------------------------------------------------ */
class ActivitySelectCardEditor extends HTMLElement {
  constructor() {
    super()
    this._config = {}
    this._hass = null
  }

  set hass(hass) {
    this._hass = hass
  }

  setConfig(config) {
    this._config = JSON.parse(JSON.stringify(config))
    this._render()
  }

  get _activities() {
    return this._config.activities || []
  }

  /* ---------- Rendu principal ---------- */
  _render() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" })
    }

    const c = this._config

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
          --spacing: 12px;
        }
        .section {
          margin-bottom: 20px;
        }
        .section-title {
          font-size: 16px;
          font-weight: 500;
          color: var(--primary-text-color);
          margin: 0 0 12px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--divider-color, #e0e0e0);
        }
        .field-row {
          display: flex;
          gap: 12px;
          margin-bottom: 12px;
        }
        .field-row > * {
          flex: 1;
        }
        ha-textfield, ha-icon-picker {
          display: block;
          width: 100%;
        }
        /* Panels d'activité */
        .activity-panel {
          border: 1px solid var(--divider-color, #e0e0e0);
          border-radius: 12px;
          margin-bottom: 8px;
          overflow: hidden;
          background: var(--card-background-color, #fff);
        }
        .activity-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          cursor: pointer;
          user-select: none;
          background: var(--secondary-background-color, #fafafa);
          transition: background 0.15s;
        }
        .activity-header:hover {
          background: var(--divider-color, #eee);
        }
        .activity-header .preview-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: var(--primary-color);
          color: #fff;
          flex-shrink: 0;
          overflow: hidden;
        }
        .activity-header .preview-icon ha-icon {
          --mdc-icon-size: 20px;
        }
        .activity-header .preview-icon img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          border-radius: 50%;
        }
        .activity-header .header-text {
          flex: 1;
          font-size: 14px;
          font-weight: 500;
          color: var(--primary-text-color);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .activity-header .header-actions {
          display: flex;
          gap: 4px;
          align-items: center;
        }
        .activity-header .header-actions ha-icon-button {
          --mdc-icon-size: 18px;
          --mdc-icon-button-size: 32px;
        }
        .activity-body {
          display: none;
          padding: 12px 16px 16px;
          border-top: 1px solid var(--divider-color, #e0e0e0);
        }
        .activity-body.open {
          display: block;
        }
        .activity-body .field-row {
          margin-bottom: 8px;
        }
        .add-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 10px;
          margin-top: 8px;
          border: 2px dashed var(--divider-color, #ccc);
          border-radius: 12px;
          background: none;
          color: var(--primary-color);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: border-color 0.2s, background 0.2s;
        }
        .add-btn:hover {
          border-color: var(--primary-color);
          background: rgba(var(--rgb-primary-color, 3, 169, 244), 0.05);
        }
        .chevron {
          transition: transform 0.2s;
          --mdc-icon-size: 20px;
        }
        .chevron.open {
          transform: rotate(180deg);
        }
        /* Image picker */
        .image-picker-row {
          display: flex;
          gap: 12px;
          margin-bottom: 8px;
          align-items: center;
        }
        .image-picker-row ha-textfield {
          flex: 1;
        }
        .image-pick-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 14px;
          border: 1px solid var(--divider-color, #ccc);
          border-radius: 8px;
          background: var(--secondary-background-color, #f5f5f5);
          color: var(--primary-text-color);
          font-size: 13px;
          cursor: pointer;
          white-space: nowrap;
          transition: background 0.15s;
          flex-shrink: 0;
        }
        .image-pick-btn:hover {
          background: var(--divider-color, #eee);
        }
        .image-pick-btn ha-icon {
          --mdc-icon-size: 18px;
        }
        .image-preview {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 8px;
        }
        .image-preview img {
          width: 48px;
          height: 48px;
          object-fit: cover;
          border-radius: 8px;
          border: 1px solid var(--divider-color, #ddd);
        }
        .image-preview .clear-img {
          padding: 4px 10px;
          border: none;
          border-radius: 6px;
          background: #e53935;
          color: #fff;
          font-size: 12px;
          cursor: pointer;
        }
        .file-input-hidden {
          display: none;
        }
      </style>

      <!-- Général -->
      <div class="section">
        <div class="section-title">Général</div>
        <div class="field-row">
          <ha-textfield
            id="cfg-title"
            label="Titre de la carte"
            .value="${c.title || ""}"
          ></ha-textfield>
        </div>
        <div class="field-row" id="entity-row"></div>
      </div>

      <!-- Apparence -->
      <div class="section">
        <div class="section-title">Apparence</div>
        <div class="field-row">
          <ha-textfield id="cfg-button_size" label="Taille bouton (px)" type="number" min="30" max="200"
            .value="${String(c.button_size || 80)}"></ha-textfield>
          <ha-textfield id="cfg-icon_size" label="Taille icône (px)" type="number" min="10" max="120"
            .value="${String(c.icon_size || 40)}"></ha-textfield>
        </div>
        <div class="field-row">
          <ha-textfield id="cfg-font_size" label="Taille texte (px)" type="number" min="8" max="30"
            .value="${String(c.font_size || 12)}"></ha-textfield>
          <ha-textfield id="cfg-gap" label="Espacement (px)" type="number" min="0" max="60"
            .value="${String(c.gap || 12)}"></ha-textfield>
        </div>
        <div class="field-row">
          <ha-textfield id="cfg-active_color" label="Couleur active"
            .value="${c.active_color || "var(--primary-color)"}"></ha-textfield>
          <ha-textfield id="cfg-inactive_color" label="Couleur inactive"
            .value="${c.inactive_color || "var(--card-background-color, #444)"}"></ha-textfield>
        </div>
        <div class="field-row">
          <ha-textfield id="cfg-border_width" label="Bordure (px)" type="number" min="0" max="10"
            .value="${String(c.border_width || 0)}"></ha-textfield>
          <ha-textfield id="cfg-border_color" label="Couleur bordure"
            .value="${c.border_color || "var(--divider-color, #e0e0e0)"}"></ha-textfield>
        </div>
        <div class="field-row">
          <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:14px;color:var(--primary-text-color)">
            <input type="checkbox" id="cfg-show_name" style="width:18px;height:18px;cursor:pointer">
            Afficher le nom des activités
          </label>
        </div>
      </div>

      <!-- Activités -->
      <div class="section">
        <div class="section-title">Activités</div>
        <div id="activities-list"></div>
        <button class="add-btn" id="btn-add">
          <ha-icon icon="mdi:plus"></ha-icon>
          Ajouter une activité
        </button>
      </div>
    `

    // Entity picker (ha-entity-picker)
    this._renderEntityPicker()

    // Activities
    this._renderActivities()

    // Bind global fields
    this._bindField("cfg-title", "title")
    this._bindField("cfg-button_size", "button_size", true)
    this._bindField("cfg-icon_size", "icon_size", true)
    this._bindField("cfg-font_size", "font_size", true)
    this._bindField("cfg-gap", "gap", true)
    this._bindField("cfg-active_color", "active_color")
    this._bindField("cfg-inactive_color", "inactive_color")
    this._bindField("cfg-border_width", "border_width", true)
    this._bindField("cfg-border_color", "border_color")

    // Forcer l'affichage des valeurs (la syntaxe .value dans innerHTML
    // ne fonctionne pas pour les web components HA)
    this._setFieldValue("cfg-title", c.title || "")
    this._setFieldValue("cfg-button_size", String(c.button_size || 80))
    this._setFieldValue("cfg-icon_size", String(c.icon_size || 40))
    this._setFieldValue("cfg-font_size", String(c.font_size || 12))
    this._setFieldValue("cfg-gap", String(c.gap || 12))
    this._setFieldValue("cfg-active_color", c.active_color || "var(--primary-color)")
    this._setFieldValue(
      "cfg-inactive_color",
      c.inactive_color || "var(--card-background-color, #444)"
    )
    this._setFieldValue("cfg-border_width", String(c.border_width != null ? c.border_width : 0))
    this._setFieldValue("cfg-border_color", c.border_color || "var(--divider-color, #e0e0e0)")

    // Checkbox show_name
    const showNameCb = this.shadowRoot.getElementById("cfg-show_name")
    if (showNameCb) {
      showNameCb.checked = c.show_name !== false
      showNameCb.addEventListener("change", (e) => {
        this._config = { ...this._config, show_name: e.target.checked }
        this._fireChanged()
      })
    }

    this.shadowRoot.getElementById("btn-add").addEventListener("click", () => {
      const activities = [
        ...this._activities,
        { name: "Nouvelle", icon: "mdi:help-circle", value: "" },
      ]
      this._config = { ...this._config, activities }
      this._fireChanged()
      this._renderActivities()
    })
  }

  /* ---------- Entity picker natif ---------- */
  _renderEntityPicker() {
    const row = this.shadowRoot.getElementById("entity-row")
    if (!row) return
    row.innerHTML = ""
    const picker = document.createElement("ha-entity-picker")
    picker.hass = this._hass
    picker.value = this._config.entity || ""
    picker.label = "Entité (optionnel)"
    picker.allowCustomEntity = true
    picker.includeDomains = ["input_select", "input_text"]
    picker.addEventListener("value-changed", (e) => {
      this._config = { ...this._config, entity: e.detail.value || "" }
      this._fireChanged()
    })
    row.appendChild(picker)
  }

  /* ---------- Forcer la valeur d'un champ ---------- */
  _setFieldValue(id, value) {
    const el = this.shadowRoot.getElementById(id)
    if (el) {
      el.value = value
      if (el.setAttribute) el.setAttribute("value", value)
    }
  }

  /* ---------- Bind un champ ---------- */
  _bindField(id, key, isNumber = false) {
    const el = this.shadowRoot.getElementById(id)
    if (!el) return
    const evtName = el.tagName === "HA-TEXTFIELD" ? "change" : "value-changed"
    el.addEventListener(evtName, (e) => {
      const raw = e.detail ? e.detail.value : e.target.value
      const val = isNumber ? parseInt(raw, 10) : raw
      if (this._config[key] !== val) {
        this._config = { ...this._config, [key]: val }
        this._fireChanged()
      }
    })
  }

  /* ---------- Rendu des activités ---------- */
  _renderActivities() {
    const container = this.shadowRoot.getElementById("activities-list")
    if (!container) return
    container.innerHTML = ""

    this._activities.forEach((act, idx) => {
      const panel = document.createElement("div")
      panel.classList.add("activity-panel")

      // -- Header --
      const header = document.createElement("div")
      header.classList.add("activity-header")

      // Preview icon
      const preview = document.createElement("div")
      preview.classList.add("preview-icon")
      if (act.image || _isImageUrl(act.icon)) {
        const img = document.createElement("img")
        img.src = act.image || act.icon
        img.alt = ""
        preview.appendChild(img)
      } else if (act.icon) {
        const ic = document.createElement("ha-icon")
        ic.setAttribute("icon", act.icon)
        preview.appendChild(ic)
      } else {
        preview.textContent = (act.name || "?").charAt(0).toUpperCase()
      }
      header.appendChild(preview)

      // Title
      const headerText = document.createElement("span")
      headerText.classList.add("header-text")
      headerText.textContent = act.name || act.value || `Activité ${idx + 1}`
      header.appendChild(headerText)

      // Action buttons
      const actions = document.createElement("span")
      actions.classList.add("header-actions")

      if (idx > 0) {
        const upBtn = document.createElement("ha-icon-button")
        upBtn.innerHTML = `<ha-icon icon="mdi:arrow-up"></ha-icon>`
        upBtn.title = "Monter"
        upBtn.addEventListener("click", (e) => {
          e.stopPropagation()
          this._moveActivity(idx, -1)
        })
        actions.appendChild(upBtn)
      }
      if (idx < this._activities.length - 1) {
        const downBtn = document.createElement("ha-icon-button")
        downBtn.innerHTML = `<ha-icon icon="mdi:arrow-down"></ha-icon>`
        downBtn.title = "Descendre"
        downBtn.addEventListener("click", (e) => {
          e.stopPropagation()
          this._moveActivity(idx, 1)
        })
        actions.appendChild(downBtn)
      }
      const delBtn = document.createElement("ha-icon-button")
      delBtn.innerHTML = `<ha-icon icon="mdi:delete"></ha-icon>`
      delBtn.title = "Supprimer"
      delBtn.addEventListener("click", (e) => {
        e.stopPropagation()
        this._removeActivity(idx)
      })
      actions.appendChild(delBtn)

      // Chevron
      const chevron = document.createElement("ha-icon")
      chevron.setAttribute("icon", "mdi:chevron-down")
      chevron.classList.add("chevron")
      actions.appendChild(chevron)

      header.appendChild(actions)
      panel.appendChild(header)

      // -- Body --
      const body = document.createElement("div")
      body.classList.add("activity-body")

      // Name
      const nameField = this._createTextField("Nom", act.name || "", (v) =>
        this._updateActivity(idx, "name", v)
      )

      // Icon picker
      const iconRow = document.createElement("div")
      iconRow.classList.add("field-row")
      const iconPicker = document.createElement("ha-icon-picker")
      iconPicker.label = "Icône MDI"
      iconPicker.value = !act.image && !_isImageUrl(act.icon) ? act.icon || "" : ""
      iconPicker.addEventListener("value-changed", (e) => {
        this._updateActivity(idx, "icon", e.detail.value || "")
        this._renderActivities()
      })
      iconRow.appendChild(iconPicker)

      // Image picker (file + URL)
      const imageRow = document.createElement("div")
      imageRow.classList.add("image-picker-row")

      const imgTextField = document.createElement("ha-textfield")
      imgTextField.label = "Image URL"
      imgTextField.value = act.image || ""
      imgTextField.addEventListener("change", (e) => {
        this._updateActivity(idx, "image", e.target.value)
        this._renderActivities()
      })
      imageRow.appendChild(imgTextField)

      const fileInput = document.createElement("input")
      fileInput.type = "file"
      fileInput.accept = "image/*"
      fileInput.classList.add("file-input-hidden")
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = (ev) => {
          this._updateActivity(idx, "image", ev.target.result)
          this._renderActivities()
        }
        reader.readAsDataURL(file)
      })
      imageRow.appendChild(fileInput)

      const pickBtn = document.createElement("button")
      pickBtn.classList.add("image-pick-btn")
      pickBtn.innerHTML = `<ha-icon icon="mdi:folder-image"></ha-icon> Parcourir`
      pickBtn.addEventListener("click", () => fileInput.click())
      imageRow.appendChild(pickBtn)

      // Preview si image existante
      const imgPreviewContainer = document.createElement("div")
      const currentImg = act.image || (_isImageUrl(act.icon) ? act.icon : "")
      if (currentImg) {
        imgPreviewContainer.classList.add("image-preview")
        const previewImg = document.createElement("img")
        previewImg.src = currentImg
        previewImg.alt = "aperçu"
        imgPreviewContainer.appendChild(previewImg)

        const clearBtn = document.createElement("button")
        clearBtn.classList.add("clear-img")
        clearBtn.textContent = "Supprimer l'image"
        clearBtn.addEventListener("click", () => {
          this._updateActivity(idx, "image", "")
          this._renderActivities()
        })
        imgPreviewContainer.appendChild(clearBtn)
      }

      // Value
      const valueField = this._createTextField("Valeur", act.value || "", (v) =>
        this._updateActivity(idx, "value", v)
      )

      // Icon color
      const colorField = this._createTextField("Couleur icône", act.icon_color || "", (v) =>
        this._updateActivity(idx, "icon_color", v)
      )

      // Show name checkbox
      const showNameRow = document.createElement("div")
      showNameRow.classList.add("field-row")
      const showNameLabel = document.createElement("label")
      showNameLabel.style.cssText =
        "display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px;color:var(--primary-text-color)"
      const showNameCb = document.createElement("input")
      showNameCb.type = "checkbox"
      showNameCb.style.cssText = "width:16px;height:16px;cursor:pointer"
      showNameCb.checked = act.show_name !== undefined ? act.show_name : true
      showNameCb.addEventListener("change", (e) => {
        this._updateActivity(idx, "show_name", e.target.checked)
      })
      showNameLabel.appendChild(showNameCb)
      showNameLabel.appendChild(document.createTextNode("Afficher le nom"))
      showNameRow.appendChild(showNameLabel)

      body.appendChild(nameField)
      body.appendChild(iconRow)
      body.appendChild(imageRow)
      if (currentImg) body.appendChild(imgPreviewContainer)
      body.appendChild(valueField)
      body.appendChild(colorField)
      body.appendChild(showNameRow)

      panel.appendChild(body)

      // Toggle expand
      header.addEventListener("click", () => {
        const isOpen = body.classList.toggle("open")
        chevron.classList.toggle("open", isOpen)
      })

      container.appendChild(panel)
    })
  }

  /* ---------- Créer un ha-textfield dans un field-row ---------- */
  _createTextField(label, value, onChange) {
    const row = document.createElement("div")
    row.classList.add("field-row")
    const tf = document.createElement("ha-textfield")
    tf.label = label
    tf.value = value
    tf.addEventListener("change", (e) => onChange(e.target.value))
    row.appendChild(tf)
    return row
  }

  /* ---------- Actions sur les activités ---------- */
  _updateActivity(idx, field, value) {
    const activities = [...this._activities]
    activities[idx] = { ...activities[idx], [field]: value }
    this._config = { ...this._config, activities }
    this._fireChanged()
  }

  _removeActivity(idx) {
    const activities = [...this._activities]
    activities.splice(idx, 1)
    this._config = { ...this._config, activities }
    this._fireChanged()
    this._renderActivities()
  }

  _moveActivity(idx, direction) {
    const activities = [...this._activities]
    const swapIdx = idx + direction
    ;[activities[idx], activities[swapIdx]] = [activities[swapIdx], activities[idx]]
    this._config = { ...this._config, activities }
    this._fireChanged()
    this._renderActivities()
  }

  _fireChanged() {
    const event = new CustomEvent("config-changed", {
      detail: { config: this._config },
      bubbles: true,
      composed: true,
    })
    this.dispatchEvent(event)
  }
}

customElements.define("activity-select-card-editor", ActivitySelectCardEditor)

/* ------------------------------------------------------------------ */
/*  Carte principale                                                  */
/* ------------------------------------------------------------------ */
class ActivitySelectCard extends HTMLElement {
  static getConfigElement() {
    return document.createElement("activity-select-card-editor")
  }

  static getStubConfig() {
    return {
      title: "Activités",
      button_size: 80,
      icon_size: 40,
      font_size: 12,
      gap: 12,
      active_color: "var(--primary-color)",
      inactive_color: "var(--card-background-color, #444)",
      border_width: 0,
      border_color: "var(--divider-color, #e0e0e0)",
      show_name: true,
      entity: "",
      activities: [
        { name: "TV", icon: "mdi:television", value: "tv" },
        { name: "Musique", icon: "mdi:music", value: "musique" },
        { name: "Jeux", icon: "mdi:gamepad-variant", value: "jeux" },
      ],
    }
  }

  set hass(hass) {
    this._hass = hass
    this._updateActiveState()
  }

  setConfig(config) {
    if (!config.activities || !Array.isArray(config.activities)) {
      throw new Error("Vous devez définir au moins une activité.")
    }
    this._config = config
    this._selectedValue = null
    this._render()
  }

  getCardSize() {
    return 2
  }

  static getGridOptions() {
    return {
      columns: 12,
      rows: 2,
      min_columns: 6,
      min_rows: 2,
    }
  }

  _render() {
    if (!this.shadowRoot) {
      this.attachShadow({ mode: "open" })
    }

    const btnSize = this._config.button_size || 80
    const iconSize = this._config.icon_size || 40
    const fontSize = this._config.font_size || 12
    const gap = this._config.gap || 12
    const activeColor = this._config.active_color || "var(--primary-color)"
    const inactiveColor = this._config.inactive_color || "var(--card-background-color, #444)"
    const borderWidth = this._config.border_width || 0
    const borderColor = this._config.border_color || "var(--divider-color, #e0e0e0)"
    const title = this._config.title || ""
    /* Espace interne pour centrer icône+label dans le cercle */
    const innerPad = Math.max(4, Math.round(btnSize * 0.08))

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card { padding: 16px; overflow: hidden; }
        .card-title {
          font-size: 18px;
          font-weight: 500;
          margin-bottom: 12px;
          color: var(--primary-text-color);
        }
        .scroll-container {
          overflow-x: auto;
          overflow-y: hidden;
          padding: 8px 4px;
          scrollbar-width: thin;
          -webkit-overflow-scrolling: touch;
        }
        .scroll-container::-webkit-scrollbar {
          height: 4px;
        }
        .scroll-container::-webkit-scrollbar-thumb {
          background: var(--divider-color, #888);
          border-radius: 4px;
        }
        .scroll-inner {
          display: flex;
          flex-direction: row;
          align-items: center;
          justify-content: space-evenly;
          gap: ${gap}px;
          width: fit-content;
          min-width: 100%;
        }
        .activity-btn {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: ${btnSize}px;
          height: ${btnSize}px;
          border-radius: 50%;
          border: ${borderWidth > 0 ? borderWidth : 3}px solid ${borderWidth > 0 ? borderColor : "transparent"};
          background: ${inactiveColor};
          cursor: pointer;
          transition: all 0.25s ease;
          padding: ${innerPad}px;
          box-sizing: border-box;
          user-select: none;
          -webkit-tap-highlight-color: transparent;
          overflow: hidden;
          gap: 2px;
        }
        .activity-btn:active {
          transform: scale(0.92);
        }
        .activity-btn.active {
          border-color: ${activeColor};
          border-width: ${Math.max(borderWidth, 3)}px;
          background: ${activeColor};
          box-shadow: 0 0 12px 2px color-mix(in srgb, ${activeColor} 40%, transparent);
        }
        .activity-btn.active .btn-icon {
          color: var(--text-primary-color, #fff);
        }
        .activity-btn.active .btn-label {
          color: var(--text-primary-color, #fff);
        }
        .btn-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          width: ${iconSize}px;
          height: ${iconSize}px;
          color: var(--primary-text-color);
          transition: color 0.25s ease;
          --mdc-icon-size: ${iconSize}px;
        }
        .btn-icon ha-icon {
          --mdc-icon-size: ${iconSize}px;
          width: ${iconSize}px;
          height: ${iconSize}px;
        }
        .btn-icon img {
          width: ${iconSize}px;
          height: ${iconSize}px;
          object-fit: contain;
          border-radius: 50%;
        }
        .btn-label {
          font-size: ${fontSize}px;
          text-align: center;
          line-height: 1.15;
          color: var(--primary-text-color);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          max-width: ${btnSize - innerPad * 2 - 6}px;
          transition: color 0.25s ease;
        }
        .activity-btn.no-icon .btn-label {
          font-size: ${Math.min(fontSize + 4, Math.round(btnSize * 0.22))}px;
          white-space: normal;
          word-break: break-word;
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
        }
      </style>
      <ha-card>
        ${title ? `<div class="card-title">${this._escHtml(title)}</div>` : ""}
        <div class="scroll-container"><div class="scroll-inner" id="scroll"></div></div>
      </ha-card>
    `

    const scrollContainer = this.shadowRoot.getElementById("scroll")

    ;(this._config.activities || []).forEach((act, idx) => {
      const btn = document.createElement("div")
      btn.classList.add("activity-btn")
      btn.dataset.value = act.value || act.name || String(idx)

      const imgSrc = act.image || (_isImageUrl(act.icon) ? act.icon : null)
      const mdiIcon = !imgSrc ? act.icon : null
      const hasVisual = !!(imgSrc || mdiIcon)
      const globalShowName = this._config.show_name !== false
      const actShowName = act.show_name !== undefined ? act.show_name : globalShowName
      const hasLabel = actShowName && !!act.name

      if (!hasVisual) btn.classList.add("no-icon")

      if (hasVisual) {
        const iconWrap = document.createElement("div")
        iconWrap.classList.add("btn-icon")

        if (imgSrc) {
          const img = document.createElement("img")
          img.src = imgSrc
          img.alt = act.name || ""
          img.loading = "lazy"
          iconWrap.appendChild(img)
        } else {
          if (act.icon_color) {
            iconWrap.style.color = act.icon_color
          }
          const haIcon = document.createElement("ha-icon")
          haIcon.setAttribute("icon", mdiIcon)
          iconWrap.appendChild(haIcon)
        }
        btn.appendChild(iconWrap)
      }

      if (hasLabel) {
        const label = document.createElement("div")
        label.classList.add("btn-label")
        label.textContent = act.name
        btn.appendChild(label)
      }

      btn.addEventListener("click", () => this._handleClick(act))
      scrollContainer.appendChild(btn)
    })

    this._updateActiveState()
  }

  _handleClick(activity) {
    const value = activity.value || activity.name

    if (this._config.entity && this._hass) {
      const domain = this._config.entity.split(".")[0]
      if (domain === "input_select") {
        this._hass.callService("input_select", "select_option", {
          entity_id: this._config.entity,
          option: value,
        })
      } else if (domain === "input_text") {
        this._hass.callService("input_text", "set_value", {
          entity_id: this._config.entity,
          value: value,
        })
      }
    }

    this._selectedValue = value
    this._updateActiveState()

    const event = new CustomEvent("activity-selected", {
      detail: { value, activity },
      bubbles: true,
      composed: true,
    })
    this.dispatchEvent(event)
  }

  _updateActiveState() {
    if (!this.shadowRoot) return
    const buttons = this.shadowRoot.querySelectorAll(".activity-btn")

    let activeValue = this._selectedValue
    if (this._config.entity && this._hass) {
      const stateObj = this._hass.states[this._config.entity]
      if (stateObj) {
        activeValue = stateObj.state
      }
    }

    buttons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.value === activeValue)
    })
  }

  _escHtml(str) {
    const div = document.createElement("div")
    div.textContent = str
    return div.innerHTML
  }
}

customElements.define("activity-select-card", ActivitySelectCard)

window.customCards = window.customCards || []
window.customCards.push({
  type: "activity-select-card",
  name: "Activity Select Card",
  preview: true,
  description:
    "Boutons ronds pour sélectionner une activité, entièrement configurable via l'interface graphique.",
})

console.info(
  `%c ACTIVITY-SELECT-CARD %c v${CARD_VERSION} `,
  "color: white; background: #03a9f4; font-weight: bold; padding: 2px 6px; border-radius: 4px 0 0 4px;",
  "color: #03a9f4; background: #e3f2fd; font-weight: bold; padding: 2px 6px; border-radius: 0 4px 4px 0;"
)
