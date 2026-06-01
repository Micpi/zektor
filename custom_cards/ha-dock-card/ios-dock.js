/* iOS Liquid Dock - v1.0.7 - Restored Opacity Control */
/* Check if already loaded to prevent double execution */
if (window.__iosDockLoadedV7) {
  console.log("[iOS Dock] Already loaded v1.0.7, skipping")
} else {
  window.__iosDockLoadedV7 = true
  console.log("[iOS Dock] Loading component v1.0.7...")

  /* ------------------------- Main Dock Card ------------------------- */
  class IOSLiquidDockCard extends HTMLElement {
    constructor() {
      super()
      this._config = {}
      this.attachShadow({ mode: "open" })
      this._boundRender = this.render.bind(this)
      this._lastPath = window.location.pathname
      this._isEditor = false

      this._onDockClick = this._onDockClick.bind(this)
      this.shadowRoot.addEventListener("click", this._onDockClick)
    }

    connectedCallback() {
      window.addEventListener("location-changed", this._boundRender)
      window.addEventListener("popstate", this._boundRender)
    }

    disconnectedCallback() {
      window.removeEventListener("location-changed", this._boundRender)
      window.removeEventListener("popstate", this._boundRender)
    }

    setConfig(config) {
      if (!config || typeof config !== "object") {
        throw new Error("Invalid configuration")
      }
      const defaults = {
        position: "bottom",
        offset_y: 20,
        show_labels: true,
        button_width: 85,
        button_gap: 15,
        icon_size: 28,
        text_size: 11,
        active_color: [0, 122, 255], // RGB par défaut
        active_icon_color: [255, 255, 255],
        active_text_color: [255, 255, 255],
        active_bg_opacity: 0.85,
        blur_amount: 35,
        opacity_light: 0.18,
        opacity_dark: 0.15,
        border_radius: 40,
        dock_height: 85,
        side_gap: 5,
        max_width: 600,
        buttons: [],
      }
      this._config = Object.assign({}, defaults, config)
      this.render()
    }

    set hass(hass) {
      this._hass = hass

      // Forcer le rendu si l'URL change (détections d'événements parfois bloquées par certains navigateurs)
      if (this._lastPath !== window.location.pathname) {
        this._lastPath = window.location.pathname
        this.render()
      }

      const wasEditor = this._isEditor
      this._isEditor = this._isEditorMode()
      if (wasEditor !== this._isEditor) this.render()
    }

    getCardSize() {
      return 1
    }

    static getGridOptions() {
      return {
        columns: 12,
        min_columns: 6,
        rows: 1,
        min_rows: 1,
      }
    }

    static getConfigForm() {
      return {
        schema: [
          {
            name: "",
            type: "expandable",
            title: "🎨 Design & Couleurs Actives (Roue Chromatique)",
            schema: [
              {
                name: "",
                type: "grid",
                schema: [
                  { name: "active_color", label: "Couleur Goutte", selector: { color_rgb: {} } },
                  {
                    name: "active_icon_color",
                    label: "Couleur Icône Active",
                    selector: { color_rgb: {} },
                  },
                  {
                    name: "active_text_color",
                    label: "Couleur Texte Actif",
                    selector: { color_rgb: {} },
                  },
                  {
                    name: "active_bg_opacity",
                    label: "Opacité Goutte",
                    selector: { number: { min: 0, max: 1, step: 0.05, mode: "slider" } },
                  },
                  {
                    name: "blur_amount",
                    label: "Flou Glass (px)",
                    selector: { number: { min: 0, max: 100, mode: "slider" } },
                  },
                  {
                    name: "opacity_light",
                    label: "Opacité (Clair)",
                    selector: { number: { min: 0, max: 1, step: 0.01, mode: "slider" } },
                  },
                  {
                    name: "opacity_dark",
                    label: "Opacité (Sombre)",
                    selector: { number: { min: 0, max: 1, step: 0.01, mode: "slider" } },
                  },
                ],
              },
            ],
          },
          {
            name: "",
            type: "expandable",
            title: "📐 Dimensions & Position",
            schema: [
              {
                name: "",
                type: "grid",
                schema: [
                  {
                    name: "position",
                    label: "Position Écran",
                    selector: {
                      select: {
                        options: [
                          { value: "static", label: "Statique" },
                          { value: "bottom", label: "Bas de page" },
                          { value: "top", label: "Haut de page" },
                        ],
                      },
                    },
                  },
                  {
                    name: "offset_y",
                    label: "Distance bordure",
                    selector: { number: { min: 0, max: 300 } },
                  },
                  {
                    name: "side_gap",
                    label: "Marge écran latérale",
                    selector: { number: { min: 0, max: 100 } },
                  },
                  {
                    name: "max_width",
                    label: "Largeur Max (PC/Tablette)",
                    selector: { number: { min: 200, max: 2000 } },
                  },
                  {
                    name: "dock_height",
                    label: "Hauteur Dock",
                    selector: { number: { min: 40, max: 200 } },
                  },
                  {
                    name: "button_width",
                    label: "Largeur boutons",
                    selector: { number: { min: 50, max: 150 } },
                  },
                  {
                    name: "button_gap",
                    label: "Espace boutons",
                    selector: { number: { min: 0, max: 50 } },
                  },
                  {
                    name: "icon_size",
                    label: "Taille icônes",
                    selector: { number: { min: 20, max: 50 } },
                  },
                  { name: "show_labels", label: "Montrer noms", selector: { boolean: {} } },
                  {
                    name: "border_radius",
                    label: "Arrondi Dock",
                    selector: { number: { min: 0, max: 80 } },
                  },
                ],
              },
            ],
          },
          {
            name: "buttons",
            label: "Configuration des boutons (YAML)",
            selector: { object: {} },
          },
        ],
      }
    }

    static getStubConfig() {
      return {
        active_color: [0, 122, 255],
        show_labels: true,
        buttons: [
          { name: "Maison", icon: "mdi:home", link: "/lovelace/0" },
          { name: "Lumières", icon: "mdi:lightbulb-group", link: "/lovelace/lights" },
          { name: "Clim", icon: "mdi:air-conditioner", link: "/lovelace/climate" },
          { name: "Sécurité", icon: "mdi:shield-home", link: "/lovelace/security" },
        ],
      }
    }

    _onDockClick(ev) {
      const target = ev?.target
      const item =
        target?.closest?.(".dock-item") ||
        (ev.composedPath?.() || []).find((n) => n?.classList?.contains?.("dock-item"))
      if (!item) return

      const buttons = Array.isArray(this._config?.buttons) ? this._config.buttons : []
      const idx = Number(item.getAttribute("data-idx"))
      if (!Number.isFinite(idx) || idx < 0 || idx >= buttons.length) return

      this._handleTap(buttons[idx], item)
      // Force render immediately for anchor links
      setTimeout(() => this.render(), 50)
    }

    _handleTap(btn, el) {
      // Effet d'onde haptique visuelle
      const ripple = document.createElement("div")
      ripple.className = "ripple-effect"
      el.appendChild(ripple)

      setTimeout(() => ripple.remove(), 600)

      if (btn.link) {
        try {
          window.history.pushState(null, "", btn.link)
          window.dispatchEvent(new Event("location-changed"))
        } catch (e) {
          window.location.href = btn.link
        }
      } else if (btn.action === "navigate") {
        window.history.pushState(null, "", btn.navigation_path)
        window.dispatchEvent(new Event("location-changed"))
      }
    }

    _getScheme() {
      // Utilise les variables HA si disponibles
      if (this._hass && this._hass.themes && this._hass.themes.darkMode) return "dark"
      return window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
    }

    _isEditorMode() {
      // 1. Détection par l'URL (Dashboard Edit Mode)
      if (window.location.search.toLowerCase().includes("edit=true")) return true

      // 2. Détection par hiérarchie (traversée Shadow DOM exhaustive)
      let node = this
      while (node) {
        const tag = (node.tagName || "").toUpperCase()
        if (
          tag.includes("EDITOR") ||
          tag.includes("PREVIEW") ||
          tag.includes("DIALOG") ||
          tag.includes("HUI-CARD-OPTIONS") ||
          tag.includes("HUI-CARD-CONTROLS") ||
          node.classList?.contains("edit-mode") ||
          node.hasAttribute?.("edit-mode") ||
          node.hasAttribute?.("preview")
        )
          return true

        node = node.parentElement || (node.getRootNode() && node.getRootNode().host)
      }
      return false
    }

    _getColor(cfg) {
      if (Array.isArray(cfg)) return `rgb(${cfg.join(",")})`
      return cfg
    }

    render() {
      if (!this.shadowRoot) return
      const buttons = Array.isArray(this._config.buttons) ? this._config.buttons : []
      const isDark = this._getScheme() === "dark"

      const isEditor = this._isEditor ?? this._isEditorMode()
      if (isEditor) this.setAttribute("is-editor", "")
      else this.removeAttribute("is-editor")

      this.shadowRoot.innerHTML = `
                <style>
                    :host {
                        display: block;
                        --accent: ${this._getColor(this._config.active_color)};
                        --active-icon: ${this._getColor(this._config.active_icon_color)};
                        --active-text: ${this._getColor(this._config.active_text_color)};
                        --blur: ${this._config.blur_amount}px;
                        --bg-opacity: ${isDark ? this._config.opacity_dark : this._config.opacity_light};
                        --drop-opacity: ${this._config.active_bg_opacity ?? 0.85};
                        z-index: 9999;
                        position: relative;
                        width: 100%;
                    }

                    :host([is-editor]) .dock-wrapper {
                        position: relative !important;
                        margin: 40px 0 !important;
                        pointer-events: auto !important;
                        top: 0 !important;
                    }

                    .dock-wrapper {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                        width: 100%;
                        transition: all 0.5s cubic-bezier(0.2, 0.8, 0.2, 1);
                        pointer-events: none;
                    }

                    :host(:not([is-editor])) .dock-wrapper.fixed-bottom {
                        position: fixed;
                        bottom: ${this._config.offset_y}px;
                        left: 0;
                        right: 0;
                        z-index: 9999;
                    }
                    
                    :host(:not([is-editor])) .dock-wrapper.fixed-top {
                        position: fixed;
                        top: ${this._config.offset_y}px;
                        left: 0;
                        right: 0;
                        z-index: 9999;
                    }

                    .dock-glass {
                        position: relative;
                        display: flex;
                        align-items: center;
                        gap: ${this._config.button_gap}px;
                        padding: 0 8px;
                        height: ${this._config.dock_height}px;
                        width: fit-content;
                        max-width: min(${this._config.max_width}px, calc(100vw - ${this._config.side_gap * 2}px));
                        border-radius: ${this._config.border_radius}px;
                        /* Utilisation de var(--bg-opacity) pour redonner le contrôle aux curseurs */
                        background: ${isDark ? `rgba(15, 15, 17, var(--bg-opacity))` : `rgba(10, 10, 12, var(--bg-opacity))`};
                        backdrop-filter: blur(var(--blur)) saturate(200%);
                        -webkit-backdrop-filter: blur(var(--blur)) saturate(200%);
                        pointer-events: auto;
                        border: 1px solid rgba(255, 255, 255, 0.15);
                        box-shadow: 0 12px 40px rgba(0,0,0,0.6);
                        overflow-x: auto;
                        overflow-y: hidden;
                        scrollbar-width: none;
                    }

                    .dock-glass::-webkit-scrollbar {
                        display: none;
                    }

                    .dock-item {
                        position: relative;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: center;
                        width: ${this._config.button_width}px;
                        flex: 0 0 auto;
                        height: 90%;
                        cursor: pointer;
                        text-decoration: none;
                        -webkit-tap-highlight-color: transparent;
                        z-index: 2;
                        transition: transform 0.2s ease;
                        border-radius: 18px;
                    }

                    .ripple-effect {
                        position: absolute;
                        inset: 0;
                        border-radius: inherit;
                        background: rgba(255, 255, 255, 0.35);
                        transform: scale(0.6);
                        opacity: 0.85;
                        animation: rippleAnimation 600ms ease-out;
                        pointer-events: none;
                    }

                    @keyframes rippleAnimation {
                        to {
                            transform: scale(1.15);
                            opacity: 0;
                        }
                    }

                    .liquid-drop {
                        position: absolute;
                        top: 0; left: 0; right: 0; bottom: 0;
                        background: var(--accent);
                        z-index: -1;
                        opacity: 0;
                        transform: scale(0.6);
                        transition: all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1);
                        border-radius: 20px;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                    }

                    .dock-item.active .liquid-drop {
                        opacity: var(--drop-opacity);
                        transform: scale(1);
                        animation: fluidAnimation 6s infinite alternate ease-in-out;
                    }

                    @keyframes fluidAnimation {
                        0% { border-radius: 20px 25px 20px 25px; }
                        50% { border-radius: 25px 20px 25px 20px; }
                        100% { border-radius: 20px 25px 20px 25px; }
                    }

                    ha-icon {
                        --mdc-icon-size: ${this._config.icon_size}px;
                        color: #FFFFFF;
                        opacity: 0.75; /* Augmenté pour lisibilité */
                        transition: all 0.3s ease;
                    }

                    .active ha-icon {
                        color: var(--active-icon) !important;
                        opacity: 1 !important;
                        transform: translateY(-2px);
                    }

                    .dock-label {
                        font-size: ${this._config.text_size}px;
                        font-weight: 800; /* Plus gras */
                        margin-top: 4px;
                        color: #FFFFFF;
                        opacity: 0.8; /* Augmenté pour lisibilité */
                        transition: all 0.3s ease;
                        text-shadow: 0 1px 2px rgba(0,0,0,0.5);
                    }

                    .active .dock-label {
                        color: var(--active-text) !important;
                        opacity: 1 !important;
                    }

                    .dock-item:active {
                        transform: scale(0.92);
                    }
                </style>
                <div class="dock-wrapper fixed-${this._config.position || "bottom"}">
                    <div class="dock-glass">
                        ${(() => {
                          const curPath = window.location.pathname.replace(/\/$/, "") || "/"
                          const curHash = window.location.hash

                          // 1. Calculer les scores pour trouver le meilleur match (Unique)
                          const scores = buttons.map((btn) => {
                            const bRaw = btn.link || btn.navigation_path || ""
                            let bPath = bRaw.split("#")[0].split("?")[0].replace(/\/$/, "")
                            if (bPath !== "" && !bPath.startsWith("/")) bPath = "/" + bPath
                            const bHash = bRaw.includes("#")
                              ? "#" + bRaw.split("#")[1].split("?")[0]
                              : ""

                            // Priorité 1 : Ancre exacte (Popups)
                            if (bHash !== "" && curHash === bHash) return 1000 + bHash.length

                            // Priorité 2 : Chemin exact
                            if (bPath !== "" && curPath === bPath) return 500 + bPath.length

                            // Priorité 3 : Sous-vue (le chemin le plus long gagne)
                            if (bPath !== "" && curPath.startsWith(bPath + "/"))
                              return 100 + bPath.length

                            return -1
                          })

                          const maxScore = Math.max(...scores)
                          const activeIdx = maxScore > 0 ? scores.indexOf(maxScore) : -1

                          return buttons
                            .map((btn, i) => {
                              const isActive = i === activeIdx
                              return `
                                <div class="dock-item ${isActive ? "active" : ""}" data-idx="${i}">
                                    <div class="liquid-drop"></div>
                                    <ha-icon icon="${btn.icon}"></ha-icon>
                                    ${this._config.show_labels ? `<span class="dock-label">${btn.name}</span>` : ""}
                                </div>
                            `
                            })
                            .join("")
                        })()}
                    </div>
                </div>
            `
    }
  }

  /* Register */
  try {
    if (!customElements.get("ios-liquid-dock-card")) {
      customElements.define("ios-liquid-dock-card", IOSLiquidDockCard)
    }
  } catch (e) {}

  /* Advertise to Lovelace */
  window.customCards = window.customCards || []
  const cardId = "custom:ios-liquid-dock-card"
  const existing = window.customCards.find((c) => c.type === cardId)
  if (!existing) {
    window.customCards.push({
      type: cardId,
      name: "iOS Liquid Dock",
      preview: false,
      description: "Dock Premium Liquid Style avec configuration visuelle",
      documentationURL: "https://developers.home-assistant.io/docs/frontend/custom-ui/custom-card/",
    })
  }
} // Close the "if not already loaded" block
