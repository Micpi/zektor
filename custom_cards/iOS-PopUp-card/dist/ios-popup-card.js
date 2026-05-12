/**
 * iOS Popup Card v3.0.0 — Custom Lovelace Card
 * Popup style iOS bottom-sheet déclenché par hash navigation (#popup-xxx)
 * Carte invisible — s'active automatiquement quand le hash correspond
 * Éditeur visuel HA-natif inspiré de Bubble Card (ha-form, ha-expansion-panel)
 */

// ══════════════════════════════════════
//  CATALOGUE DE CARTES
// ══════════════════════════════════════
const IOS_POPUP_CARD_CATALOG = [
  {
    id: "popular",
    name: "Populaires",
    icon: "mdi:star",
    cards: [
      { type: "tile", name: "Tuile", icon: "mdi:square-rounded", description: "Tuile compacte et moderne" },
      { type: "button", name: "Bouton", icon: "mdi:gesture-tap-button", description: "Bouton d'action" },
      { type: "entities", name: "Entités", icon: "mdi:view-list", description: "Liste d'entités" },
      { type: "light", name: "Lumière", icon: "mdi:lightbulb-outline", description: "Contrôle d'éclairage" },
      { type: "thermostat", name: "Thermostat", icon: "mdi:thermostat", description: "Contrôle de climatisation" },
      { type: "media-control", name: "Lecteur média", icon: "mdi:cast", description: "Contrôle multimédia" },
      { type: "weather-forecast", name: "Météo", icon: "mdi:weather-partly-cloudy", description: "Prévisions météo" },
      { type: "sensor", name: "Capteur", icon: "mdi:eye", description: "Afficher un capteur" },
      { type: "area", name: "Zone", icon: "mdi:texture-box", description: "Carte de zone" },
    ],
  },
  {
    id: "layout",
    name: "Mise en page",
    icon: "mdi:view-grid-outline",
    cards: [
      { type: "grid", name: "Grille", icon: "mdi:grid", description: "Organiser en grille" },
      { type: "horizontal-stack", name: "Stack horizontal", icon: "mdi:arrow-split-vertical", description: "Cartes en ligne" },
      { type: "vertical-stack", name: "Stack vertical", icon: "mdi:arrow-split-horizontal", description: "Cartes en colonne" },
      { type: "conditional", name: "Conditionnel", icon: "mdi:eye-off-outline", description: "Affichage conditionnel" },
    ],
  },
  {
    id: "mushroom",
    name: "Mushroom",
    icon: "mdi:mushroom-outline",
    cards: [
      { type: "custom:mushroom-light-card", name: "Light", icon: "mdi:lightbulb", description: "Carte lumière Mushroom" },
      { type: "custom:mushroom-entity-card", name: "Entity", icon: "mdi:square-rounded", description: "Carte entité Mushroom" },
      { type: "custom:mushroom-fan-card", name: "Fan", icon: "mdi:fan", description: "Carte ventilateur Mushroom" },
      { type: "custom:mushroom-climate-card", name: "Climate", icon: "mdi:thermostat", description: "Carte climat Mushroom" },
      { type: "custom:mushroom-cover-card", name: "Cover", icon: "mdi:blinds-horizontal", description: "Carte volet Mushroom" },
      { type: "custom:mushroom-chips-card", name: "Chips", icon: "mdi:checkbox-multiple-blank-outline", description: "Puces Mushroom" },
      { type: "custom:mushroom-alarm-control-panel-card", name: "Alarm", icon: "mdi:shield-outline", description: "Carte alarme Mushroom" },
      { type: "custom:mushroom-template-card", name: "Template", icon: "mdi:code-braces", description: "Carte template Mushroom" },
      { type: "custom:mushroom-media-player-card", name: "Media Player", icon: "mdi:play-circle-outline", description: "Lecteur média Mushroom" },
      { type: "custom:mushroom-lock-card", name: "Lock", icon: "mdi:lock-outline", description: "Carte serrure Mushroom" },
      { type: "custom:mushroom-number-card", name: "Number", icon: "mdi:ray-vertex", description: "Carte nombre Mushroom" },
      { type: "custom:mushroom-select-card", name: "Select", icon: "mdi:format-list-bulleted", description: "Carte sélection Mushroom" },
    ],
  },
  {
    id: "custom",
    name: "Custom",
    icon: "mdi:puzzle-outline",
    cards: [
      { type: "custom:button-card", name: "Button Card", icon: "mdi:gesture-tap-button", description: "Bouton hautement personnalisable" },
      { type: "custom:mini-graph-card", name: "Mini Graph", icon: "mdi:chart-line", description: "Graphique compact" },
      { type: "custom:mini-media-player", name: "Mini Media Player", icon: "mdi:play-circle-outline", description: "Lecteur média compact" },
      { type: "custom:stack-in-card", name: "Stack in Card", icon: "mdi:cards-outline", description: "Stack dans une seule carte" },
      { type: "custom:swipe-card", name: "Swipe Card", icon: "mdi:gesture-swipe-horizontal", description: "Carte avec swipe" },
      { type: "custom:bar-card", name: "Bar Card", icon: "mdi:poll", description: "Barre de progression" },
      { type: "custom:auto-entities", name: "Auto Entities", icon: "mdi:format-list-checks", description: "Entités auto-filtrées" },
      { type: "custom:apexcharts-card", name: "ApexCharts", icon: "mdi:chart-areaspline", description: "Graphiques avancés" },
      { type: "custom:decluttering-card", name: "Decluttering", icon: "mdi:content-copy", description: "Templates réutilisables" },
      { type: "custom:layout-card", name: "Layout Card", icon: "mdi:page-layout-body", description: "Mise en page avancée" },
    ],
  },
  {
    id: "basic",
    name: "Basiques",
    icon: "mdi:card-text-outline",
    cards: [
      { type: "markdown", name: "Markdown", icon: "mdi:language-markdown", description: "Texte formaté Markdown" },
      { type: "picture", name: "Image", icon: "mdi:image", description: "Afficher une image" },
      { type: "picture-entity", name: "Image entité", icon: "mdi:image-filter-center-focus", description: "Image liée à une entité" },
      { type: "iframe", name: "iFrame", icon: "mdi:web", description: "Page web intégrée" },
      { type: "map", name: "Carte (Map)", icon: "mdi:map", description: "Carte géographique" },
      { type: "gauge", name: "Jauge", icon: "mdi:gauge", description: "Jauge circulaire" },
      { type: "history-graph", name: "Historique", icon: "mdi:chart-line-variant", description: "Graphique d'historique" },
      { type: "statistics-graph", name: "Statistiques", icon: "mdi:chart-bar", description: "Graphique statistiques" },
      { type: "logbook", name: "Journal", icon: "mdi:format-list-bulleted-type", description: "Journal d'activité" },
      { type: "calendar", name: "Calendrier", icon: "mdi:calendar", description: "Événements calendrier" },
      { type: "todo-list", name: "Liste de tâches", icon: "mdi:clipboard-check-outline", description: "Liste de tâches" },
    ],
  },
];

// ══════════════════════════════════════
//  ÉDITEUR VISUEL (HA-NATIF)
// ══════════════════════════════════════
class IOSPopupCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
    this._hass = null;
    this._activeTab = "popup";
    this._openCardEditors = new Set();
    this._editorModes = {};
    this._nativeEditors = {};
    this._forms = {};
    this._didInitialRender = false;
  }

  disconnectedCallback() {
    // Nothing to cleanup for now.
  }

  setConfig(config) {
    const nextConfig = { ...(config || {}) };
    const sameConfig = JSON.stringify(nextConfig) === JSON.stringify(this._config || {});
    this._config = nextConfig;

    // Avoid full editor re-render when HA echoes the same config after each keypress.
    // This keeps focused inputs/caret stable while still dispatching changes immediately.
    if (!this._didInitialRender || !sameConfig) {
      this._render();
    }
  }

  get hass() {
    return this._hass;
  }

  set hass(hass) {
    this._hass = hass;
    // Propagate hass to all ha-form instances
    if (this._forms) {
      Object.values(this._forms).forEach((form) => {
        try { if (form) form.hass = hass; } catch (_) { }
      });
    }
    // Propagate hass to native sub-card editors
    if (this._nativeEditors) {
      Object.values(this._nativeEditors).forEach((editor) => {
        try { if (editor) editor.hass = hass; } catch (_) { }
      });
    }
  }

  // ══════════════════════════════════════
  //  STYLES
  // ══════════════════════════════════════
  _getStyles() {
    return `
      <style>
        :host {
          display: block;
          font-family: var(--paper-font-body1_-_font-family, 'Roboto', sans-serif);
        }
        .card-config {
          padding: 0;
        }

        /* ═══ Tabs (iOS Segmented Control) ═══ */
        .tabs-bar {
          display: flex;
          background: var(--secondary-background-color, rgba(118, 118, 128, 0.12));
          border-radius: 9px;
          padding: 2px;
          margin: 0 0 16px 0;
        }
        .tab-btn {
          flex: 1;
          padding: 7px 12px;
          border: none;
          background: transparent;
          color: var(--primary-text-color);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          border-radius: 7px;
          transition: all 0.25s cubic-bezier(0.25, 0.1, 0.25, 1);
          text-align: center;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
        }
        .tab-btn ha-icon { --mdc-icon-size: 16px; }
        .tab-btn.active {
          background: var(--card-background-color, #fff);
          box-shadow: 0 1px 4px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06);
        }
        .tab-btn:not(.active):hover {
          color: var(--primary-color);
        }

        .tab-content { display: none; }
        .tab-content.active { display: block; }

        .cards-tab-header {
          display: flex;
          margin-bottom: 8px;
        }
        .cards-back-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          border: none;
          background: transparent;
          color: var(--primary-color);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          padding: 2px 0;
        }
        .cards-back-btn ha-icon {
          --mdc-icon-size: 16px;
        }

        /* ═══ Cards Count Badge ═══ */
        .cards-count {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          background: var(--primary-color);
          color: var(--text-primary-color, #fff);
          font-size: 10px;
          font-weight: 700;
          min-width: 18px;
          height: 18px;
          border-radius: 9px;
          padding: 0 5px;
          line-height: 1;
        }

        /* ═══ Expansion Panels ═══ */
        ha-expansion-panel {
          display: block;
          margin-bottom: 8px;
          --input-fill-color: none;
        }
        ha-expansion-panel h4[slot="header"] {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }
        ha-expansion-panel h4[slot="header"] ha-icon {
          --mdc-icon-size: 20px;
          color: var(--secondary-text-color);
        }
        ha-expansion-panel > .content, ha-expansion-panel .content {
          overflow-x: visible !important;
          display: flex;
          flex-direction: column;
        }
        .content {
          margin: 12px 4px 14px 4px;
        }
        .content ha-form {
          display: block;
        }

        ha-form {
          --expansion-panel-summary-padding: 2px 14px;
        }
        ha-textfield {
          width: 100%;
        }

        /* ═══ Info Blocks (Bubble Card style) ═══ */
        .bubble-info {
          padding: 0 0 14px;
          position: relative;
          overflow: auto;
        }
        .bubble-info .content {
          margin: 0;
          padding: 0 18px;
        }
        .bubble-info::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 100%;
          background-color: var(--info-color);
          border-radius: 4px;
          opacity: 0.12;
          pointer-events: none;
        }
        .bubble-info h4 {
          margin: 8px 0 0 0;
          padding: 0 18px;
        }
        .bubble-info p {
          margin: 0;
        }
        .bubble-info * {
          z-index: 0;
        }
        .bubble-section-title {
          font-size: 14px;
          font-weight: 600;
          margin-bottom: -6px !important;
          color: var(--primary-text-color) !important;
          display: flex;
          align-items: center;
          position: relative;
          padding-left: 4px;
        }
        .bubble-section-title ha-icon {
          color: var(--info-color) !important;
          margin: 8px 8px 8px 0;
          line-height: normal !important;
          --mdc-icon-size: 18px;
        }
        .bubble-section-title::before {
          content: "";
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 3px;
          background: var(--primary-color);
          border-radius: 2px;
        }
        .bubble-section-title + p {
          margin-top: 0;
          padding-top: 0;
        }
        .bubble-info > div {
          --mdc-icon-size: 18px;
        }
        .bubble-info p {
          margin: 4px 0;
          font-size: 13px;
          line-height: 1.5;
          color: var(--secondary-text-color);
        }
        .bubble-info p b, .bubble-info p code {
          color: var(--primary-text-color);
        }
        .bubble-info p code {
          background: rgba(0,120,180,0.3);
          color: var(--primary-text-color);
          background-blend-mode: darken;
          padding: 1px 3px;
          border-radius: 6px;
          font-size: 13px;
        }

        /* ═══ Card Header in Expansion Panel (Bubble Card style) ═══ */
        ha-expansion-panel h4:not(.version) {
          display: flex;
          align-items: center;
          margin: 10px 0;
        }
        h4 > ha-icon {
          margin: 8px 12px 8px 8px;
          color: var(--primary-text-color);
        }
        .button-header {
          height: auto;
          width: 100%;
          display: inline-flex;
          align-items: center;
          margin: 0 8px;
        }
        .button-number {
          display: inline-flex;
          width: auto;
        }
        .button-container {
          display: flex;
          margin-left: auto;
        }
        .icon-button {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 8px 16px;
          background: rgba(0,120,180,0.5);
          border: none;
          cursor: pointer;
          margin: 0;
          border-radius: 32px;
          font-size: 13px;
          font-weight: bold;
          text-align: center;
          text-decoration: none;
          color: var(--primary-text-color);
          transition: all 0.2s ease;
        }
        .icon-button:hover {
          background: rgba(0,120,180,0.7);
          transform: translateY(-1px);
        }
        .icon-button:active {
          background: rgba(0,120,180,0.9);
        }
        .icon-button.header {
          background: none;
          padding: 0;
          margin: 0 4px;
        }
        .icon-button ha-icon {
          --mdc-icon-size: 18px;
          color: var(--primary-text-color);
        }
        .disabled {
          opacity: 0.5;
          pointer-events: none;
        }

        /* ═══ Editor Mode Toggle (GUI / Code) ═══ */
        .editor-mode-bar {
          display: flex;
          background: var(--secondary-background-color, rgba(118, 118, 128, 0.12));
          border-radius: 8px;
          padding: 2px;
          margin-bottom: 12px;
        }
        .editor-mode-btn {
          flex: 1;
          padding: 6px 12px;
          border: none;
          background: transparent;
          color: var(--secondary-text-color);
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.2s ease;
          text-align: center;
          -webkit-tap-highlight-color: transparent;
          user-select: none;
        }
        .editor-mode-btn:hover {
          color: var(--primary-text-color);
        }
        .editor-mode-btn.active {
          background: var(--card-background-color, #fff);
          color: var(--primary-text-color);
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }

        /* ═══ Native Editor Containers ═══ */
        .editor-gui-container {
          min-height: 60px;
        }
        .editor-gui-container > * {
          display: block;
        }
        .editor-loading {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 24px 12px;
          color: var(--secondary-text-color);
          font-size: 13px;
        }
        @keyframes iosPopupSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .editor-loading ha-icon {
          animation: iosPopupSpin 1s linear infinite;
        }
        .editor-unavailable {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          padding: 20px 12px;
          color: var(--secondary-text-color);
          font-size: 13px;
          text-align: center;
          line-height: 1.5;
        }
        .editor-unavailable ha-icon {
          --mdc-icon-size: 32px;
          opacity: 0.4;
        }
        .editor-switch-link {
          color: var(--primary-color);
          cursor: pointer;
          font-size: 12px;
          font-weight: 600;
          margin-top: 4px;
        }
        .editor-switch-link:hover { text-decoration: underline; }

        /* ═══ Code Editor ═══ */
        .code-editor-container textarea {
          width: 100%;
          min-height: 120px;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid var(--divider-color, rgba(0,0,0,0.12));
          background: var(--code-editor-background-color, rgba(0,0,0,0.05));
          color: var(--primary-text-color);
          font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace;
          font-size: 12px;
          line-height: 1.5;
          resize: vertical;
          box-sizing: border-box;
          outline: none;
        }
        .code-editor-container textarea:focus {
          border-color: var(--primary-color);
        }
        .card-editor-error {
          font-size: 11px;
          color: var(--error-color, #FF453A);
          margin-top: 4px;
          display: none;
        }

        /* ═══ Add Card Section ═══ */
        .add-card-section {
          margin-top: 12px;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        #add-button {
          margin: 0;
          color: var(--text-primary-color);
          width: 100%;
          height: 36px;
          border-radius: 18px;
          border: none;
          background-color: var(--accent-color);
          cursor: pointer;
          font-size: 13px;
          font-weight: bold;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.15s ease;
        }
        #add-button:hover {
          filter: brightness(1.1);
        }
        #add-button ha-icon {
          --mdc-icon-size: 18px;
        }

        /* ═══ Empty State ═══ */
        .cards-empty {
          text-align: center;
          padding: 40px 20px;
          color: var(--secondary-text-color);
          font-size: 13px;
          line-height: 1.6;
        }
        .cards-empty ha-icon {
          --mdc-icon-size: 40px;
          opacity: 0.4;
          margin-bottom: 8px;
          display: block;
        }

        /* ═══ Native Picker Hint ═══ */
        .picker-hint {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 4px;
          color: var(--primary-color);
          font-size: 12px;
          user-select: none;
        }
        .picker-hint ha-icon {
          --mdc-icon-size: 16px;
        }

        /* Keep only active tab visible */
        .tab-content {
          display: none !important;
        }
        .tab-content.active {
          display: block !important;
        }

        hr {
          display: inline-block;
          width: 100%;
          height: 1px;
          border: none;
          background-color: var(--outline-color);
          margin: 8px 0 0 0;
        }

        .card-config a,
        .card-config p,
        .card-config h4 {
          color: var(--primary-text-color);
        }

        /* ═══ Version Badge ═══ */
        .version {
          text-align: center;
          margin-top: 16px;
          font-size: 11px;
          color: var(--secondary-text-color);
          opacity: 0.6;
        }
      </style>
    `;
  }

  // ══════════════════════════════════════
  //  RENDER PRINCIPAL
  // ══════════════════════════════════════
  _render() {
    const c = this._config;
    const cardCount = (c.cards || []).length;

    this.shadowRoot.innerHTML = `
      ${this._getStyles()}
      <div class="card-config">

        <!-- ═══ TABS ═══ -->
        <div class="tabs-bar">
          <button class="tab-btn ${this._activeTab === "popup" ? "active" : ""}" data-tab="popup">
            <ha-icon icon="mdi:cog-outline"></ha-icon> Configuration
          </button>
          <button class="tab-btn ${this._activeTab === "cards" ? "active" : ""}" data-tab="cards">
            <ha-icon icon="mdi:cards-outline"></ha-icon> Cartes
            ${cardCount > 0 ? '<span class="cards-count">' + cardCount + "</span>" : ""}
          </button>
        </div>

        <!-- ═══ TAB: CONFIGURATION ═══ -->
        <div class="tab-content ${this._activeTab === "popup" ? "active" : ""}" id="tab-popup">

          <!-- Déclencheur -->
          <ha-expansion-panel outlined>
            <h4 slot="header">
              <ha-icon icon="mdi:pound"></ha-icon>
              Déclencheur
            </h4>
            <div class="content">
              <div id="form-trigger"></div>
              <div class="bubble-info">
                <h4 class="bubble-section-title">
                  <ha-icon icon="mdi:information-outline"></ha-icon>
                  Hash navigation
                </h4>
                <div class="content">
                  <p>Le popup s'ouvre automatiquement quand l'URL contient <b>#popup-${c.hash || "xxx"}</b>. Utilisez une action <b>navigate</b> avec ce hash pour ouvrir le popup depuis n'importe quelle carte.</p>
                </div>
              </div>
            </div>
          </ha-expansion-panel>

          <!-- En-tête -->
          <ha-expansion-panel outlined>
            <h4 slot="header">
              <ha-icon icon="mdi:dock-top"></ha-icon>
              En-tête
            </h4>
            <div class="content">
              <div id="form-header"></div>
              <div class="bubble-info">
                <h4 class="bubble-section-title">
                  <ha-icon icon="mdi:information-outline"></ha-icon>
                  Header masqué
                </h4>
                <div class="content">
                  <p>Vous pouvez masquer l'en-tête du popup. Pour le fermer quand il est masqué, faites un <b>swipe vers le bas</b> ou appuyez en dehors du popup.</p>
                </div>
              </div>
            </div>
          </ha-expansion-panel>

          <!-- Apparence -->
          <ha-expansion-panel outlined>
            <h4 slot="header">
              <ha-icon icon="mdi:palette"></ha-icon>
              Apparence du popup
            </h4>
            <div class="content">
              <div id="form-appearance"></div>
              <div class="bubble-info">
                <h4 class="bubble-section-title">
                  <ha-icon icon="mdi:information-outline"></ha-icon>
                  Personnalisation
                </h4>
                <div class="content">
                  <p>Utilisez des valeurs CSS pour les couleurs (ex: <code>rgba(28, 28, 30, 0.92)</code>) et les dimensions (ex: <code>500px</code>, <code>85vh</code>).</p>
                </div>
              </div>
            </div>
          </ha-expansion-panel>

          <!-- Interactions -->
          <ha-expansion-panel outlined>
            <h4 slot="header">
              <ha-icon icon="mdi:gesture-tap"></ha-icon>
              Interactions
            </h4>
            <div class="content">
              <div id="form-interactions"></div>
              <div class="bubble-info">
                <h4 class="bubble-section-title">
                  <ha-icon icon="mdi:information-outline"></ha-icon>
                  Fermeture
                </h4>
                <div class="content">
                  <p>Le popup peut être fermé par <b>swipe vers le bas</b>, en appuyant sur le <b>scrim</b> (fond sombre), avec le <b>bouton X</b>, ou la touche <b>Échap</b>.</p>
                </div>
              </div>
            </div>
          </ha-expansion-panel>

          <!-- About -->
          <div class="bubble-info">
            <h4 class="bubble-section-title">
              <ha-icon icon="mdi:information-outline"></ha-icon>
              iOS Popup Card
            </h4>
            <div class="content">
              <p>Les popups sont un excellent moyen de désencombrer votre dashboard et d'afficher rapidement plus d'informations. Chaque popup est <b>masqué par défaut</b> et peut être ouvert en ciblant son hash avec n'importe quelle carte supportant l'action <b>navigate</b>.</p>
            </div>
          </div>

          <div class="version">iOS Popup Card v3.0.0</div>
        </div>

        <!-- ═══ TAB: CARTES ═══ -->
        <div class="tab-content ${this._activeTab === "cards" ? "active" : ""}" id="tab-cards">
          <div class="cards-tab-header">
            <button class="cards-back-btn" id="cards-back-btn">
              <ha-icon icon="mdi:chevron-left"></ha-icon>
              Retour à la configuration
            </button>
          </div>
          <div id="cards-list"></div>
          <div class="add-card-section" id="add-card-section"></div>
        </div>
      </div>
    `;

    // ═══ Bind tabs ═══
    this.shadowRoot.querySelectorAll(".tab-btn").forEach((btn) => {
      btn.addEventListener("click", () => {
        this._activeTab = btn.dataset.tab;
        this._render();
      });
    });

    // ═══ Bind config tab ═══
    if (this._activeTab === "popup") {
      this._bindConfigForms();
    }

    // ═══ Bind cards tab ═══
    if (this._activeTab === "cards") {
      const backBtn = this.shadowRoot.getElementById("cards-back-btn");
      if (backBtn) {
        backBtn.addEventListener("click", () => {
          this._activeTab = "popup";
          this._render();
        });
      }
      this._renderCardsList();
      this._renderAddCardDropdown();
    }

    this._didInitialRender = true;
  }

  // ══════════════════════════════════════
  //  CONFIG FORMS (ha-form instances)
  // ══════════════════════════════════════
  _bindConfigForms() {
    this._forms = {};

    // ── Déclencheur ──
    this._forms.trigger = this._createForm("form-trigger",
      { hash: this._config.hash || "" },
      [
        { name: "hash", label: "Hash (ex: salon, lumiere)", selector: { text: {} } },
      ]
    );

    // ── En-tête ──
    this._forms.header = this._createForm("form-header",
      {
        title: this._config.title || "",
        subtitle: this._config.subtitle || "",
        icon: this._config.icon || "",
        icon_color: this._config.icon_color || "",
        header_text_color: this._config.header_text_color || "",
        icon_background: this._config.icon_background || "",
        show_header: this._config.show_header !== false,
        show_handle: this._config.show_handle !== false,
        show_close: this._config.show_close !== false,
        sub_btn_1_icon: this._config.sub_btn_1_icon || "",
        sub_btn_1_badge: this._config.sub_btn_1_badge || "",
        sub_btn_1_tap_action: this._config.sub_btn_1_tap_action || { action: "none" },
        sub_btn_1_hold_action: this._config.sub_btn_1_hold_action || { action: "none" },
        sub_btn_1_double_tap_action: this._config.sub_btn_1_double_tap_action || { action: "none" },
        sub_btn_2_icon: this._config.sub_btn_2_icon || "",
        sub_btn_2_badge: this._config.sub_btn_2_badge || "",
        sub_btn_2_tap_action: this._config.sub_btn_2_tap_action || { action: "none" },
        sub_btn_2_hold_action: this._config.sub_btn_2_hold_action || { action: "none" },
        sub_btn_2_double_tap_action: this._config.sub_btn_2_double_tap_action || { action: "none" },
      },
      [
        { name: "title", label: "Titre", selector: { text: {} } },
        { name: "subtitle", label: "Sous-titre", selector: { text: {} } },
        { name: "icon", label: "Icône", selector: { icon: {} } },
        { name: "icon_color", label: "Couleur de l'icône", selector: { text: {} } },
        { name: "header_text_color", label: "Couleur du texte de l'en-tête", selector: { text: {} } },
        { name: "icon_background", label: "Fond de l'icône (CSS, ex: none)", selector: { text: {} } },
        { name: "show_header", label: "Afficher le header", selector: { boolean: {} } },
        { name: "show_handle", label: "Afficher le grab handle", selector: { boolean: {} } },
        { name: "show_close", label: "Afficher le bouton fermer", selector: { boolean: {} } },
        { name: "sub_btn_1_icon", label: "Sub button 1 — Icône", selector: { icon: {} } },
        { name: "sub_btn_1_badge", label: "Sub button 1 — Badge", selector: { text: {} } },
        { name: "sub_btn_1_tap_action", label: "Sub button 1 — Tap", selector: { ui_action: {} } },
        { name: "sub_btn_1_hold_action", label: "Sub button 1 — Hold", selector: { ui_action: {} } },
        { name: "sub_btn_1_double_tap_action", label: "Sub button 1 — Double tap", selector: { ui_action: {} } },
        { name: "sub_btn_2_icon", label: "Sub button 2 — Icône", selector: { icon: {} } },
        { name: "sub_btn_2_badge", label: "Sub button 2 — Badge", selector: { text: {} } },
        { name: "sub_btn_2_tap_action", label: "Sub button 2 — Tap", selector: { ui_action: {} } },
        { name: "sub_btn_2_hold_action", label: "Sub button 2 — Hold", selector: { ui_action: {} } },
        { name: "sub_btn_2_double_tap_action", label: "Sub button 2 — Double tap", selector: { ui_action: {} } },
      ]
    );

    // ── Apparence ──
    this._forms.appearance = this._createForm("form-appearance",
      {
        popup_background: this._config.popup_background || "rgba(28, 28, 30, 0.92)",
        scrim_background: this._config.scrim_background || "rgba(0, 0, 0, 0.4)",
        blur_strength: this._config.blur_strength ?? 40,
        max_width: this._config.max_width || "500px",
        max_height: this._config.max_height || "85vh",
        border_radius: this._config.border_radius || "20px 20px 0 0",
      },
      [
        { name: "popup_background", label: "Fond du popup (CSS)", selector: { text: {} } },
        { name: "scrim_background", label: "Fond du scrim (CSS)", selector: { text: {} } },
        { name: "blur_strength", label: "Intensité du flou (px)", selector: { number: { min: 0, max: 100, step: 5, mode: "slider" } } },
        { name: "max_width", label: "Largeur max (ex: 500px)", selector: { text: {} } },
        { name: "max_height", label: "Hauteur max (ex: 85vh)", selector: { text: {} } },
        { name: "border_radius", label: "Border radius", selector: { text: {} } },
      ]
    );

    // ── Interactions ──
    this._forms.interactions = this._createForm("form-interactions",
      {
        swipe_to_close: this._config.swipe_to_close !== false,
        close_on_scrim: this._config.close_on_scrim !== false,
        haptic: this._config.haptic !== false,
      },
      [
        { name: "swipe_to_close", label: "Swipe pour fermer", selector: { boolean: {} } },
        { name: "close_on_scrim", label: "Fermer au tap sur le scrim", selector: { boolean: {} } },
        { name: "haptic", label: "Haptic feedback", selector: { boolean: {} } },
      ]
    );
  }

  _createForm(containerId, data, schema) {
    const container = this.shadowRoot.getElementById(containerId);
    if (!container) return null;

    const form = document.createElement("ha-form");
    if (this._hass) form.hass = this._hass;
    form.data = data;
    form.schema = schema;
    form.computeLabel = (s) => s.label || s.name || "";

    form.addEventListener("value-changed", (ev) => {
      ev.stopPropagation();
      const newValues = ev.detail.value;
      Object.keys(newValues).forEach((key) => {
        this._config[key] = newValues[key];
      });
      this._config = { ...this._config };
      this._dispatch();
    });

    container.appendChild(form);
    return form;
  }

  // ══════════════════════════════════════
  //  ADD CARD — HA NATIVE DIALOG
  // ══════════════════════════════════════
  _renderAddCardDropdown() {
    const container = this.shadowRoot.getElementById("add-card-section");
    if (!container) return;
    container.innerHTML = "";

    // Single selector: HA's native card picker dialog
    const addBtn = document.createElement("button");
    addBtn.id = "add-button";
    addBtn.innerHTML = '<ha-icon icon="mdi:plus"></ha-icon> Ajouter une carte';
    container.appendChild(addBtn);

    const help = document.createElement("div");
    help.className = "picker-hint";
    help.id = "picker-hint";
    help.innerHTML = '<ha-icon icon="mdi:information-outline"></ha-icon> Sélecteur natif Home Assistant';
    container.appendChild(help);

    addBtn.addEventListener("click", async () => {
      addBtn.disabled = true;
      try {
        const opened = await this._openNativeCardPicker();
        if (!opened) {
          help.innerHTML = '<ha-icon icon="mdi:alert-circle-outline"></ha-icon> Impossible d\'ouvrir le sélecteur natif sur cette vue.';
        }
      } finally {
        setTimeout(() => { addBtn.disabled = false; }, 200);
      }
    });
  }

  async _openNativeCardPicker() {
    // Load card helpers to ensure hui-card-picker et related elements are registered
    try { await window.loadCardHelpers(); } catch (_) { }

    // Get the real lovelace object from the panel
    let lovelace;
    try {
      lovelace = document.querySelector("home-assistant")
        ?.shadowRoot?.querySelector("home-assistant-main")
        ?.shadowRoot?.querySelector("ha-panel-lovelace")?.lovelace;
    } catch (_) { }

    const saveCard = async (cfg) => {
      if (cfg?.type) setTimeout(() => this._addCard(cfg.type, cfg), 50);
    };

    const lovelaceConfig = lovelace?.config || { views: [{ cards: [] }] };
    const origCards = (lovelaceConfig.views?.[0]?.cards) || [];

    const saveConfig = async (newCfg) => {
      const newCards = (newCfg?.views?.[0]?.cards) || [];
      if (newCards.length > origCards.length) {
        const added = newCards[newCards.length - 1];
        if (added?.type) await saveCard(added);
      }
    };

    const dialogParams = {
      // API expected by show-create-card-dialog.ts
      lovelaceConfig,
      saveConfig,
      path: [0],
      entities: this._hass ? Object.keys(this._hass.states).slice(0, 100) : [],
      saveCard,
    };

    // ── Strategy 1 (preferred): native hui-card-picker in local ha-dialog ─────
    // Avoids HA's create-card -> edit-card dialog chain which can close the
    // whole editor context in some views. Selecting a card adds it directly.
    if (customElements.get("hui-card-picker") && customElements.get("ha-dialog")) {
      const dialog = document.createElement("ha-dialog");
      dialog.setAttribute("heading", "Choisir une carte");
      dialog.setAttribute("flexContent", "");
      dialog.style.cssText = "--mdc-dialog-min-width:560px;--mdc-dialog-max-width:90vw;";
      document.body.appendChild(dialog);

      const picker = document.createElement("hui-card-picker");
      picker.hass = this._hass;
      picker.lovelace = lovelaceConfig;
      picker.style.cssText = "display:block;min-height:460px;";
      dialog.appendChild(picker);

      if (typeof picker.requestUpdate === "function") picker.requestUpdate();
      try { await picker.updateComplete; } catch (_) { }
      await new Promise((r) => setTimeout(r, 350));

      picker.addEventListener("config-changed", (ev) => {
        ev.stopPropagation();
        const cfg = ev.detail?.config ?? ev.detail;
        if (cfg?.type) {
          saveCard(cfg);
          dialog.open = false;
          setTimeout(() => {
            try { if (dialog.isConnected) document.body.removeChild(dialog); } catch (_) { }
          }, 50);
        }
      });

      dialog.addEventListener("closed", () => {
        try { if (dialog.isConnected) document.body.removeChild(dialog); } catch (_) { }
      }, { once: true });

      dialog.open = true;
      return true;
    }

    // Check if a HA card creation dialog has appeared.
    // Must look inside home-assistant's shadowRoot too, because HA mounts its
    // dialogs there (not always at document level).
    const findDialog = () => {
      const haShadow = document.querySelector("home-assistant")?.shadowRoot;
      for (const tag of ["hui-dialog-create-card", "hui-dialog-suggest-card"]) {
        if (document.querySelector(tag)) return true;
        if (haShadow?.querySelector(tag)) return true;
      }
      return false;
    };

    const waitForDialog = async (maxMs = 600) => {
      const steps = Math.ceil(maxMs / 40);
      for (let i = 0; i < steps; i++) {
        await new Promise(r => setTimeout(r, 40));
        if (findDialog()) return true;
      }
      return false;
    };

    // ── Strategy 1: show-dialog from `this` (editor inside HA's tree) ─────────
    // Our editor is rendered inside hui-dialog-edit-card which lives in
    // home-assistant's shadowRoot.  Events dispatched from `this` with
    // { bubbles:true, composed:true } bubble up through that shadow boundary
    // and reach home-assistant (where HA's dialog manager is registered).
    // This is exactly the same mechanism used by every native HA editor.
    const fireShowDialog = (target, dialogTag) => {
      if (!target?.dispatchEvent) return;
      // Use new Event + .detail = detail (HA's internal fireEvent pattern)
      const ev = new Event("show-dialog", { bubbles: true, cancelable: false, composed: true });
      ev.detail = { dialogTag, dialogImport: () => window.loadCardHelpers(), dialogParams };
      target.dispatchEvent(ev);
    };

    for (const tag of ["hui-dialog-create-card", "hui-dialog-suggest-card"]) {
      fireShowDialog(this, tag);
      if (await waitForDialog(600)) return true;
    }

    // ── Strategy 2: dispatch directly on home-assistant element ───────────────
    // If the dialog manager listener is on home-assistant itself (not on main),
    // dispatching directly on it triggers it at the target phase.
    const ha = document.querySelector("home-assistant");
    for (const tag of ["hui-dialog-create-card", "hui-dialog-suggest-card"]) {
      fireShowDialog(ha, tag);
      if (await waitForDialog(500)) return true;
    }

    // ── Strategy 3: dispatch on home-assistant-main ───────────────────────────
    const haMain = ha?.shadowRoot?.querySelector("home-assistant-main");
    for (const tag of ["hui-dialog-create-card", "hui-dialog-suggest-card"]) {
      fireShowDialog(haMain, tag);
      if (await waitForDialog(400)) return true;
    }

    // ── Strategy 4: direct element instantiation ──────────────────────────────
    for (const tag of ["hui-dialog-create-card", "hui-dialog-suggest-card"]) {
      if (!customElements.get(tag)) continue;
      try {
        const el = document.createElement(tag);
        if (this._hass) el.hass = this._hass;
        document.body.appendChild(el);
        if (typeof el.showDialog === "function") {
          el.showDialog(dialogParams);
          if (await waitForDialog(500)) return true;
        }
        try { document.body.removeChild(el); } catch (_) { }
      } catch (_) { }
    }

    console.warn("iOS Popup Card: impossible d'ouvrir le sélecteur natif.");
    return false;
  }

  _addCard(type, fullConfig) {
    if (!type) return;
    const cards = [...(this._config.cards || [])];

    // Use full config from native dialog if available, otherwise build minimal config
    let newCard;
    if (fullConfig && typeof fullConfig === "object") {
      newCard = { ...fullConfig };
    } else {
      newCard = { type };
      if (
        type.includes("button") || type.includes("entity") ||
        type.includes("light") || type.includes("fan") ||
        type.includes("climate") || type.includes("cover") ||
        type.includes("lock") || type.includes("sensor") ||
        type.includes("media") || type === "tile"
      ) {
        newCard.entity = "";
      }
      if (type === "custom:button-card") newCard.name = "Nouvelle carte";
      if (type === "grid") { newCard.columns = 2; newCard.square = false; newCard.cards = []; }
      if (type === "markdown") newCard.content = "# Titre";
    }

    cards.push(newCard);
    this._config = { ...this._config, cards };
    this._dispatch();

    const newIdx = cards.length - 1;
    this._openCardEditors = new Set([newIdx]);
    this._editorModes[newIdx] = "gui";
    this._nativeEditors = {};
    this._render();
  }

  // ══════════════════════════════════════
  //  CARDS LIST (ha-expansion-panel per card)
  // ══════════════════════════════════════
  _renderCardsList() {
    const container = this.shadowRoot.getElementById("cards-list");
    if (!container) return;

    const cards = this._config.cards || [];
    if (cards.length === 0) {
      container.innerHTML = `
        <div class="cards-empty">
          <ha-icon icon="mdi:cards-outline"></ha-icon>
          Aucune carte configurée.<br>
          Ajoutez des cartes à afficher dans le popup.
        </div>`;
      return;
    }

    const findCardInfo = (type) => {
      for (const section of IOS_POPUP_CARD_CATALOG) {
        const found = section.cards.find((c) => c.type === type);
        if (found) return found;
      }
      return null;
    };

    container.innerHTML = cards.map((card, i) => {
      const info = findCardInfo(card.type);
      const icon = info ? info.icon : "mdi:card-outline";
      const mode = this._editorModes[i] || "gui";
      const cardLabel = card.type || "carte inconnue";
      const cardDetail = info ? info.name : "";
      const entityDetail = card.entity ? " · " + card.entity : "";

      return `
        <ha-expansion-panel outlined id="cardpanel-${i}" ${this._openCardEditors.has(i) ? "expanded" : ""}>
          <h4 slot="header">
            <ha-icon icon="${icon}"></ha-icon>
            Carte ${i + 1} ${cardDetail ? "- " + cardDetail : "- " + cardLabel}${entityDetail}
            <div class="button-container" id="card-actions-${i}">
              <button class="icon-button header ${i === 0 ? "disabled" : ""}" data-action="up" data-idx="${i}" title="Monter">
                <ha-icon icon="mdi:arrow-up"></ha-icon>
              </button>
              <button class="icon-button header ${i === cards.length - 1 ? "disabled" : ""}" data-action="down" data-idx="${i}" title="Descendre">
                <ha-icon icon="mdi:arrow-down"></ha-icon>
              </button>
              <button class="icon-button header" data-action="delete" data-idx="${i}" title="Supprimer">
                <ha-icon icon="mdi:delete"></ha-icon>
              </button>
            </div>
          </h4>
          <div class="content">
            <div class="editor-mode-bar">
              <div class="editor-mode-btn ${mode === "gui" ? "active" : ""}" data-mode="gui" data-idx="${i}">
                Visuel
              </div>
              <div class="editor-mode-btn ${mode === "code" ? "active" : ""}" data-mode="code" data-idx="${i}">
                Code
              </div>
            </div>
            <div class="editor-gui-container" id="card-gui-${i}" style="display:${mode === "gui" ? "block" : "none"}">
              <div class="editor-loading" id="card-gui-loading-${i}">
                <ha-icon icon="mdi:loading" style="--mdc-icon-size:20px"></ha-icon>
                Chargement de l'éditeur visuel…
              </div>
            </div>
            <div class="code-editor-container" id="card-code-${i}" style="display:${mode === "code" ? "block" : "none"}">
              <textarea id="card-yaml-${i}" spellcheck="false">${JSON.stringify(card, null, 2)}</textarea>
              <div class="card-editor-error" id="card-error-${i}"></div>
            </div>
          </div>
        </ha-expansion-panel>`;
    }).join("");

    // ── Bind expansion panel events ──
    cards.forEach((_, i) => {
      const panel = this.shadowRoot.getElementById("cardpanel-" + i);
      if (panel) {
        panel.addEventListener("expanded-changed", (ev) => {
          ev.stopPropagation();
          const isExpanded = (ev.detail && ev.detail.expanded !== undefined) ? ev.detail.expanded : (ev.target ? ev.target.expanded : false);
          if (isExpanded) {
            this._openCardEditors.add(i);
            if ((this._editorModes[i] || "gui") === "gui") {
              this._loadNativeEditor(i);
            }
          } else {
            this._openCardEditors.delete(i);
          }
        });
      }

      // Stop propagation on action buttons to prevent panel toggle
      const actionsDiv = this.shadowRoot.getElementById("card-actions-" + i);
      if (actionsDiv) {
        actionsDiv.addEventListener("click", (e) => e.stopPropagation());
        actionsDiv.addEventListener("mousedown", (e) => e.stopPropagation());
        actionsDiv.addEventListener("touchstart", (e) => e.stopPropagation());
      }
    });

    // ── Bind card action buttons ──
    container.querySelectorAll("button.icon-button:not(.disabled)").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx, 10);
        this._handleCardAction(btn.dataset.action, idx);
      });
    });

    // ── Bind textareas ──
    cards.forEach((_, i) => {
      const textarea = this.shadowRoot.getElementById("card-yaml-" + i);
      if (textarea) {
        textarea.addEventListener("blur", () => this._saveCardFromTextarea(i));
        textarea.addEventListener("input", () => {
          const err = this.shadowRoot.getElementById("card-error-" + i);
          if (err) err.style.display = "none";
        });
      }
    });

    // ── Bind editor mode toggles ──
    container.querySelectorAll(".editor-mode-btn").forEach((btn) => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const idx = parseInt(btn.dataset.idx || btn.getAttribute("data-idx"), 10);
        const mode = btn.dataset.mode || btn.getAttribute("data-mode");
        this._switchEditorMode(idx, mode);
      });
    });

    // ── Load native editors for expanded panels in GUI mode ──
    this._nativeEditors = {};
    cards.forEach((_, i) => {
      if (this._openCardEditors.has(i) && (this._editorModes[i] || "gui") === "gui") {
        this._loadNativeEditor(i);
      }
    });
  }

  // ══════════════════════════════════════
  //  CARD ACTIONS (move, delete)
  // ══════════════════════════════════════
  _handleCardAction(action, idx) {
    const cards = [...(this._config.cards || [])];
    switch (action) {
      case "up":
        if (idx > 0) {
          [cards[idx - 1], cards[idx]] = [cards[idx], cards[idx - 1]];
          const wasOpen = this._openCardEditors.has(idx);
          const prevWasOpen = this._openCardEditors.has(idx - 1);
          this._openCardEditors.delete(idx);
          this._openCardEditors.delete(idx - 1);
          if (wasOpen) this._openCardEditors.add(idx - 1);
          if (prevWasOpen) this._openCardEditors.add(idx);
          const tmpMode = this._editorModes[idx];
          this._editorModes[idx] = this._editorModes[idx - 1];
          this._editorModes[idx - 1] = tmpMode;
        }
        break;
      case "down":
        if (idx < cards.length - 1) {
          [cards[idx], cards[idx + 1]] = [cards[idx + 1], cards[idx]];
          const wasOpen = this._openCardEditors.has(idx);
          const nextWasOpen = this._openCardEditors.has(idx + 1);
          this._openCardEditors.delete(idx);
          this._openCardEditors.delete(idx + 1);
          if (wasOpen) this._openCardEditors.add(idx + 1);
          if (nextWasOpen) this._openCardEditors.add(idx);
          const tmpMode = this._editorModes[idx];
          this._editorModes[idx] = this._editorModes[idx + 1];
          this._editorModes[idx + 1] = tmpMode;
        }
        break;
      case "delete":
        cards.splice(idx, 1);
        this._openCardEditors.delete(idx);
        delete this._editorModes[idx];
        // Re-index after deletion
        const newOpenSet = new Set();
        this._openCardEditors.forEach((i) => {
          if (i < idx) newOpenSet.add(i);
          else if (i > idx) newOpenSet.add(i - 1);
        });
        this._openCardEditors = newOpenSet;
        const newModes = {};
        Object.keys(this._editorModes).forEach((key) => {
          const k = parseInt(key, 10);
          if (k < idx) newModes[k] = this._editorModes[k];
          else if (k > idx) newModes[k - 1] = this._editorModes[k];
        });
        this._editorModes = newModes;
        break;
    }
    this._nativeEditors = {};
    this._config = { ...this._config, cards };
    this._dispatch();
    this._renderCardsList();
  }

  _saveCardFromTextarea(idx) {
    const textarea = this.shadowRoot.getElementById("card-yaml-" + idx);
    const errorEl = this.shadowRoot.getElementById("card-error-" + idx);
    if (!textarea) return;

    try {
      const parsed = JSON.parse(textarea.value);
      if (!parsed || typeof parsed !== "object") throw new Error("Objet JSON attendu");
      if (!parsed.type) throw new Error("La propriété 'type' est requise");
      const cards = [...(this._config.cards || [])];
      cards[idx] = parsed;
      this._config = { ...this._config, cards };
      this._dispatch();
      if (errorEl) { errorEl.style.display = "none"; errorEl.textContent = ""; }
    } catch (e) {
      if (errorEl) { errorEl.style.display = "block"; errorEl.textContent = "Erreur JSON : " + e.message; }
    }
  }

  // ══════════════════════════════════════
  //  NATIVE HA CARD EDITOR (GUI)
  // ══════════════════════════════════════
  async _loadNativeEditor(idx) {
    const cards = this._config.cards || [];
    if (idx >= cards.length) return;
    const cardConfig = cards[idx];

    const guiContainer = this.shadowRoot.getElementById("card-gui-" + idx);
    const loadingEl = this.shadowRoot.getElementById("card-gui-loading-" + idx);
    if (!guiContainer) return;

    // If already loaded, just update config and hass
    if (this._nativeEditors[idx]) {
      try { this._nativeEditors[idx].hass = this._hass; } catch (_) { }
      try { this._nativeEditors[idx].setConfig(cardConfig); } catch (_) { }
      return;
    }

    const isCustom = cardConfig.type.startsWith("custom:");
    const tag = isCustom
      ? cardConfig.type.substring(7)
      : "hui-" + cardConfig.type + "-card";

    try {
      let editorEl = null;

      // Step 1: Load HA card helpers (with timeout to avoid hanging)
      const helpers = await Promise.race([
        window.loadCardHelpers(),
        new Promise(function (_, rej) {
          setTimeout(function () { rej(new Error("loadCardHelpers timeout")); }, 5000);
        }),
      ]);

      // Step 2: Trigger lazy-loading of the card module
      // Use minimal config (just type) to avoid errors from missing required fields
      try { helpers.createCardElement({ type: cardConfig.type }); } catch (_) { }

      // Step 3: Wait for the card custom element to register (resolve on timeout, don't reject)
      if (!customElements.get(tag)) {
        await Promise.race([
          customElements.whenDefined(tag),
          new Promise(function (r) { setTimeout(r, 6000); }),
        ]);
      }

      // Step 4: Get the config editor via getConfigElement() on the card class
      const cardClass = customElements.get(tag);
      if (cardClass && typeof cardClass.getConfigElement === "function") {
        try {
          const result = cardClass.getConfigElement();
          if (result instanceof Promise) {
            editorEl = await Promise.race([
              result,
              new Promise(function (_, rej) {
                setTimeout(function () { rej(new Error("getConfigElement timeout")); }, 4000);
              }),
            ]);
          } else {
            editorEl = result;
          }
        } catch (_) { }
      }

      // Step 5: Fallback — try creating hui-{type}-card-editor directly
      if (!editorEl && !isCustom) {
        const editorTag = "hui-" + cardConfig.type + "-card-editor";
        if (customElements.get(editorTag)) {
          try { editorEl = document.createElement(editorTag); } catch (_) { }
        }
      }

      // Result
      if (editorEl) {
        // Wait for editor element to be upgraded (resolve on timeout)
        if (editorEl.localName && editorEl.localName.includes("-") && !customElements.get(editorEl.localName)) {
          await Promise.race([
            customElements.whenDefined(editorEl.localName),
            new Promise(function (r) { setTimeout(r, 3000); }),
          ]);
        }

        // Append to DOM first — some editors need DOM presence before setConfig
        if (loadingEl) loadingEl.remove();
        guiContainer.appendChild(editorEl);

        // Try to get the lovelace instance for editors that need it
        try {
          const lovelace = document.querySelector("home-assistant")
            ?.shadowRoot?.querySelector("home-assistant-main")
            ?.shadowRoot?.querySelector("ha-panel-lovelace")?.lovelace;
          if (lovelace) editorEl.lovelace = lovelace;
        } catch (_) { }

        // Set hass and config
        if (this._hass) editorEl.hass = this._hass;
        try {
          editorEl.setConfig(cardConfig);
        } catch (_) {
          await new Promise(function (r) { setTimeout(r, 100); });
          try { editorEl.setConfig(cardConfig); } catch (_) { }
        }

        // Wait for Lit render
        if (editorEl.updateComplete) {
          try { await editorEl.updateComplete; } catch (_) { }
        }

        // Listen for config changes from the native editor
        editorEl.addEventListener("config-changed", (ev) => {
          ev.stopPropagation();
          const newConfig = ev.detail.config;
          const updatedCards = [...(this._config.cards || [])];
          updatedCards[idx] = newConfig;
          this._config = { ...this._config, cards: updatedCards };
          this._dispatch();
          // Sync code textarea
          const textarea = this.shadowRoot.getElementById("card-yaml-" + idx);
          if (textarea) textarea.value = JSON.stringify(newConfig, null, 2);
        });

        this._nativeEditors[idx] = editorEl;
      } else {
        this._showEditorUnavailable(loadingEl, cardConfig.type, idx);
      }
    } catch (e) {
      console.warn("iOS Popup Card: Could not load visual editor for", cardConfig.type, e);
      this._showEditorUnavailable(loadingEl, cardConfig.type, idx);
    }
  }

  _showEditorUnavailable(loadingEl, cardType, idx) {
    if (!loadingEl) return;
    loadingEl.className = "";
    loadingEl.innerHTML = `
      <div class="editor-unavailable">
        <ha-icon icon="mdi:pencil-off-outline"></ha-icon>
        Pas d'éditeur visuel pour <b>${cardType}</b>.
        <span class="editor-switch-link" id="switch-code-${idx}">Passer à l'éditeur de code →</span>
      </div>`;
    const switchLink = loadingEl.querySelector("#switch-code-" + idx);
    if (switchLink) {
      switchLink.addEventListener("click", () => this._switchEditorMode(idx, "code"));
    }
  }

  _switchEditorMode(idx, mode) {
    this._editorModes[idx] = mode;

    const guiContainer = this.shadowRoot.getElementById("card-gui-" + idx);
    const codeContainer = this.shadowRoot.getElementById("card-code-" + idx);

    if (guiContainer) guiContainer.style.display = mode === "gui" ? "block" : "none";
    if (codeContainer) codeContainer.style.display = mode === "code" ? "block" : "none";

    // Update mode buttons
    const panel = this.shadowRoot.getElementById("cardpanel-" + idx);
    if (panel) {
      panel.querySelectorAll(".editor-mode-btn").forEach((btn) => {
        btn.classList.toggle("active", btn.dataset.mode === mode);
      });
    }

    // Sync textarea with latest config when switching to code
    if (mode === "code") {
      const cards = this._config.cards || [];
      const textarea = this.shadowRoot.getElementById("card-yaml-" + idx);
      if (textarea && cards[idx]) {
        textarea.value = JSON.stringify(cards[idx], null, 2);
      }
    }

    // Load native editor when switching to GUI
    if (mode === "gui") {
      this._loadNativeEditor(idx);
    }
  }

  // ══════════════════════════════════════
  //  DISPATCH CONFIG CHANGE
  // ══════════════════════════════════════
  _dispatch() {
    this.dispatchEvent(
      new CustomEvent("config-changed", {
        detail: { config: this._config },
        bubbles: true,
        composed: true,
      })
    );
  }
}

customElements.define("ios-popup-card-editor", IOSPopupCardEditor);

// ══════════════════════════════════════
//  CARTE PRINCIPALE (iOS Bottom Sheet)
// ══════════════════════════════════════
class IOSPopupCard extends HTMLElement {
  static get properties() {
    return { _config: {}, hass: {} };
  }

  static getConfigElement() {
    return document.createElement("ios-popup-card-editor");
  }

  static getStubConfig() {
    return {
      hash: "salon",
      title: "Salon",
      subtitle: "Contrôle rapide",
      icon: "mdi:sofa",
      cards: [],
    };
  }

  constructor() {
    super();
    this._popupOpen = false;
    this._popupCards = [];
    this._previewCards = [];
    this._boundHashHandler = this._handleLocationChange.bind(this);
    this._boundLocationHandler = this._handleLocationChange.bind(this);
  }

  set hass(hass) {
    this._hass = hass;
    if (this._popupCards) {
      this._popupCards.forEach((c) => {
        if (c) { try { c.hass = hass; } catch (_) { } }
      });
    }
    if (this._previewCards) {
      this._previewCards.forEach((c) => {
        if (c) { try { c.hass = hass; } catch (_) { } }
      });
    }
  }

  setConfig(config) {
    console.info("iOS Popup Card: setConfig called", config);
    if (!config) throw new Error("Configuration invalide");
    if (!config.hash) throw new Error("'hash' est requis (ex: hash: salon)");

    const pickCss = (value, fallback) => {
      if (typeof value !== "string") return fallback;
      const trimmed = value.trim();
      return trimmed === "" ? fallback : trimmed;
    };

    this._config = {
      ...config,
      hash: config.hash,
      title: config.title || "",
      subtitle: config.subtitle || "",
      icon: config.icon || "mdi:dots-horizontal",
      icon_color: config.icon_color || "var(--primary-text-color)",
      icon_background: pickCss(config.icon_background, "rgba(255,255,255,0.06)"),
      header_text_color: pickCss(config.header_text_color, "var(--primary-text-color, #fff)"),
      cards: config.cards || [],
      popup_background: pickCss(config.popup_background, "rgba(28, 28, 30, 0.92)"),
      scrim_background: pickCss(config.scrim_background, "rgba(0, 0, 0, 0.4)"),
      blur_strength: config.blur_strength ?? 40,
      max_width: pickCss(config.max_width, "500px"),
      max_height: pickCss(config.max_height, "85vh"),
      border_radius: pickCss(config.border_radius, "20px 20px 0 0"),
      show_header: config.show_header !== false,
      show_handle: config.show_handle !== false,
      show_close: config.show_close !== false,
      sub_btn_1_icon: (config.sub_btn_1_icon || "").trim(),
      sub_btn_1_badge: String(config.sub_btn_1_badge || "").trim(),
      sub_btn_1_tap_target: (config.sub_btn_1_tap_target || config.sub_btn_1_target || "").trim(),
      sub_btn_1_hold_target: (config.sub_btn_1_hold_target || "").trim(),
      sub_btn_1_double_tap_target: (config.sub_btn_1_double_tap_target || "").trim(),
      sub_btn_2_icon: (config.sub_btn_2_icon || "").trim(),
      sub_btn_2_badge: String(config.sub_btn_2_badge || "").trim(),
      sub_btn_2_tap_target: (config.sub_btn_2_tap_target || config.sub_btn_2_target || "").trim(),
      sub_btn_2_hold_target: (config.sub_btn_2_hold_target || "").trim(),
      sub_btn_2_double_tap_target: (config.sub_btn_2_double_tap_target || "").trim(),
      // Compatibilite ancienne config
      sub_btn_1_target: (config.sub_btn_1_tap_target || config.sub_btn_1_target || "").trim(),
      sub_btn_2_target: (config.sub_btn_2_tap_target || config.sub_btn_2_target || "").trim(),
      // Actions natives (selector ui_action), avec fallback texte legacy
      sub_btn_1_tap_action: config.sub_btn_1_tap_action || this._targetToAction(config.sub_btn_1_tap_target || config.sub_btn_1_target),
      sub_btn_1_hold_action: config.sub_btn_1_hold_action || this._targetToAction(config.sub_btn_1_hold_target),
      sub_btn_1_double_tap_action: config.sub_btn_1_double_tap_action || this._targetToAction(config.sub_btn_1_double_tap_target),
      sub_btn_2_tap_action: config.sub_btn_2_tap_action || this._targetToAction(config.sub_btn_2_tap_target || config.sub_btn_2_target),
      sub_btn_2_hold_action: config.sub_btn_2_hold_action || this._targetToAction(config.sub_btn_2_hold_target),
      sub_btn_2_double_tap_action: config.sub_btn_2_double_tap_action || this._targetToAction(config.sub_btn_2_double_tap_target),
      swipe_to_close: config.swipe_to_close !== false,
      close_on_scrim: config.close_on_scrim !== false,
      haptic: config.haptic !== false,
    };
    this._buildCard();
  }

  getCardSize() { return 0; }

  connectedCallback() {
    // HA's navigate action uses history.pushState which does NOT fire 'hashchange'.
    // HA fires 'location-changed' instead. Listen to both + popstate for back/forward.
    window.addEventListener("hashchange", this._boundHashHandler);
    window.addEventListener("location-changed", this._boundLocationHandler);
    window.addEventListener("popstate", this._boundHashHandler);
    console.info("iOS Popup Card: connectedCallback");
    requestAnimationFrame(() => {
      this._detectContext();
      this._onHashChange();
    });
  }

  disconnectedCallback() {
    window.removeEventListener("hashchange", this._boundHashHandler);
    window.removeEventListener("location-changed", this._boundLocationHandler);
    window.removeEventListener("popstate", this._boundHashHandler);
  }

  _detectContext() {
    // Walk up shadow DOM tree to detect if we're inside the HA card editor preview
    let node = this;
    let isDialogPreview = false;
    for (let i = 0; i < 20; i++) {
      const root = node.getRootNode();
      if (!root || root === document || root === node) break;
      if (root instanceof ShadowRoot && root.host) {
        node = root.host;
        const tag = (node.localName || "").toLowerCase();
        if (tag.includes("preview") || tag.includes("edit-card") || tag === "ha-dialog") {
          isDialogPreview = true;
          break;
        }
      } else {
        break;
      }
    }

    // Detect Lovelace dashboard edit mode (card should stay visible for preview)
    let isDashboardEditMode = false;
    try {
      const urlHasEditFlag = /(?:^|[?&])edit=1(?:&|$)/.test(window.location.search || "");
      const ha = document.querySelector("home-assistant");
      const haMain = ha?.shadowRoot?.querySelector("home-assistant-main");
      const panel = haMain?.shadowRoot?.querySelector("ha-panel-lovelace");
      const huiRoot = panel?.shadowRoot?.querySelector("hui-root");

      const lovelaceEdit = Boolean(
        huiRoot?.lovelace?.editMode ||
        panel?.lovelace?.editMode ||
        huiRoot?.editMode
      );

      const attrEdit = Boolean(
        haMain?.hasAttribute("edit-mode") ||
        panel?.hasAttribute("edit-mode") ||
        huiRoot?.hasAttribute?.("edit-mode")
      );

      isDashboardEditMode = urlHasEditFlag || lovelaceEdit || attrEdit;
    } catch (_) { }

    this._isEditorPreview = isDialogPreview || isDashboardEditMode;

    // On the dashboard (not in editor), hide the card entirely
    if (!this._isEditorPreview) {
      this.style.cssText = "display:none!important;width:0!important;height:0!important;overflow:hidden!important;position:absolute!important;";
    } else {
      this.style.cssText = "";
    }
  }

  _handleLocationChange() {
    this._detectContext();
    this._onHashChange();
  }

  _buildCard() {
    if (!this.shadowRoot) this.attachShadow({ mode: "open" });
    const cfg = this._config;
    const cardCount = (cfg.cards || []).length;
    const iconColor = cfg.icon_color || "var(--primary-text-color)";
    const iconBackground = (cfg.icon_background !== undefined && cfg.icon_background !== null) ? cfg.icon_background : "rgba(255,255,255,0.06)";
    const headerTextColor = cfg.header_text_color || "var(--primary-text-color, #fff)";

    this.shadowRoot.innerHTML = `
      <style>
        :host {
          display: block;
        }
        .popup-preview {
          border-radius: var(--ha-card-border-radius, 12px);
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .preview-badge {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 12px;
          font-size: 11px;
          font-weight: 600;
          color: var(--secondary-text-color);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .preview-badge ha-icon {
          --mdc-icon-size: 16px;
          color: var(--primary-color);
        }
        .preview-sheet {
          background: ${cfg.popup_background};
          border-radius: ${cfg.border_radius};
          border-top: 0.5px solid rgba(255,255,255,0.12);
          box-shadow: 0 -2px 16px rgba(0,0,0,0.15), 0 0 0 0.5px rgba(255,255,255,0.05);
          overflow: hidden;
        }
        .preview-handle {
          display: ${cfg.show_handle ? "flex" : "none"};
          justify-content: center;
          padding: 10px 0 6px 0;
        }
        .preview-handle-bar {
          width: 36px;
          height: 5px;
          border-radius: 100px;
          background: rgba(255,255,255,0.28);
        }
        .preview-header {
          display: ${cfg.show_header ? "flex" : "none"};
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 4px 16px 8px 20px;
        }
        .preview-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .preview-header-icon {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: ${iconBackground};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .preview-header-icon ha-icon {
          --mdc-icon-size: 20px;
          color: ${iconColor};
        }
        .preview-title {
          font-size: 18px;
          font-weight: 700;
          color: ${headerTextColor};
          letter-spacing: -0.4px;
          line-height: 1.2;
        }
        .preview-sub {
          font-size: 12px;
          font-weight: 500;
          color: var(--secondary-text-color, rgba(255,255,255,0.4));
          margin-top: 1px;
        }
        .preview-header-right {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
          flex-shrink: 0;
        }
        .preview-sub-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: none;
          background: rgba(255,255,255,0.1);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--primary-text-color, #fff);
          opacity: 0.9;
          cursor: default;
          position: relative;
        }
        .preview-sub-btn ha-icon {
          --mdc-icon-size: 16px;
        }
        .preview-sub-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          min-width: 14px;
          height: 14px;
          border-radius: 14px;
          padding: 0 4px;
          background: var(--error-color, #FF453A);
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          line-height: 14px;
          text-align: center;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.2);
        }
        .preview-sep {
          display: ${cfg.show_header ? "block" : "none"};
          height: 0.5px;
          background: rgba(255,255,255,0.07);
          margin: 0 16px 4px 16px;
        }
        .preview-content {
          padding: 4px 12px 12px 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .preview-empty {
          text-align: center;
          padding: 24px 16px;
          color: var(--secondary-text-color, rgba(255,255,255,0.35));
          font-size: 13px;
        }
        .preview-hash {
          text-align: center;
          padding: 8px;
          font-size: 11px;
          color: var(--secondary-text-color);
          opacity: 0.6;
          font-family: 'SF Mono', 'Menlo', monospace;
        }
      </style>
      <div class="popup-preview">
        <div class="preview-badge">
          <ha-icon icon="mdi:dock-bottom"></ha-icon>
          iOS Popup
        </div>
        <div class="preview-sheet">
          <div class="preview-handle"><div class="preview-handle-bar"></div></div>
          <div class="preview-header">
            <div class="preview-header-left">
              ${cfg.icon ? '<div class="preview-header-icon"><ha-icon icon="' + cfg.icon + '"></ha-icon></div>' : ""}
              <div>
                <div class="preview-title">${cfg.title || "Popup"}</div>
                ${cfg.subtitle ? '<div class="preview-sub">' + cfg.subtitle + "</div>" : ""}
              </div>
            </div>
            <div class="preview-header-right">
              ${cfg.sub_btn_1_icon && this._hasUiAction(cfg.sub_btn_1_tap_action || this._targetToAction(cfg.sub_btn_1_tap_target || cfg.sub_btn_1_target)) ? '<button class="preview-sub-btn" type="button"><ha-icon icon="' + cfg.sub_btn_1_icon + '"></ha-icon>' + (cfg.sub_btn_1_badge ? '<span class="preview-sub-badge">' + cfg.sub_btn_1_badge + '</span>' : '') + '</button>' : ""}
              ${cfg.sub_btn_2_icon && this._hasUiAction(cfg.sub_btn_2_tap_action || this._targetToAction(cfg.sub_btn_2_tap_target || cfg.sub_btn_2_target)) ? '<button class="preview-sub-btn" type="button"><ha-icon icon="' + cfg.sub_btn_2_icon + '"></ha-icon>' + (cfg.sub_btn_2_badge ? '<span class="preview-sub-badge">' + cfg.sub_btn_2_badge + '</span>' : '') + '</button>' : ""}
            </div>
          </div>
          <div class="preview-sep"></div>
          <div class="preview-content" id="preview-cards">
            ${cardCount === 0 ? '<div class="preview-empty">Aucune carte configurée</div>' : ""}
          </div>
        </div>
        <div class="preview-hash">#popup-${cfg.hash}</div>
      </div>
    `;

    // Render actual sub-cards in the preview
    if (cardCount > 0) {
      this._renderPreviewCards();
    }
  }

  async _renderPreviewCards() {
    const container = this.shadowRoot && this.shadowRoot.getElementById("preview-cards");
    if (!container) return;
    container.innerHTML = "";

    let helpers;
    try { helpers = await window.loadCardHelpers(); } catch (_) { }

    this._previewCards = [];

    for (const cardConfig of this._config.cards) {
      let el;
      try {
        if (helpers && helpers.createCardElement) {
          el = helpers.createCardElement(cardConfig);
        } else {
          const tag = cardConfig.type.startsWith("custom:")
            ? cardConfig.type.substr(7)
            : "hui-" + cardConfig.type + "-card";
          el = document.createElement(tag);
          if (el.setConfig) el.setConfig(cardConfig);
        }
      } catch (e) {
        el = document.createElement("div");
        el.textContent = "Erreur: " + cardConfig.type;
        el.style.cssText = "color:#FF453A;padding:8px;font-size:12px;background:rgba(255,69,58,0.1);border-radius:8px;";
      }
      if (el) {
        if (this._hass) el.hass = this._hass;
        this._previewCards.push(el);
        container.appendChild(el);
      }
    }
  }

  _onHashChange() {
    const hash = window.location.hash;
    const target = "#popup-" + this._config.hash;
    if (hash === target && !this._popupOpen) {
      this._openPopup();
    }
  }

  _targetToAction(target) {
    const t = String(target || "").trim();
    if (!t) return { action: "none" };
    if (t.startsWith("#") || t.startsWith("/")) {
      return { action: "navigate", navigation_path: t };
    }
    if (/^https?:\/\//i.test(t)) {
      return { action: "url", url_path: t };
    }
    return { action: "none" };
  }

  _hasUiAction(actionConfig) {
    return !!(actionConfig && typeof actionConfig === "object" && actionConfig.action && actionConfig.action !== "none");
  }

  _getSubButtonAction(slot, gesture) {
    const key = `sub_btn_${slot}_${gesture}_action`;
    const legacyKey = `sub_btn_${slot}_${gesture}_target`;
    const legacy = this._config[legacyKey];
    return this._config[key] || this._targetToAction(legacy);
  }

  _runSubButtonAction(actionConfig) {
    if (!this._hasUiAction(actionConfig)) return;
    const action = actionConfig.action;

    if (action === "navigate") {
      const path = actionConfig.navigation_path || actionConfig.path;
      if (!path) return;
      if (String(path).startsWith("#")) {
        window.location.hash = String(path);
      } else {
        history.pushState(null, "", String(path));
        window.dispatchEvent(new CustomEvent("location-changed"));
      }
      return;
    }

    if (action === "url") {
      const url = actionConfig.url_path || actionConfig.url;
      if (!url) return;
      if (actionConfig.new_tab === false) {
        window.location.href = String(url);
      } else {
        window.open(String(url), "_blank", "noopener,noreferrer");
      }
      return;
    }

    if (action === "more-info") {
      const entityId = actionConfig.entity || actionConfig.entity_id;
      if (!entityId) return;
      const ev = new Event("hass-more-info", { bubbles: true, composed: true });
      ev.detail = { entityId };
      this.dispatchEvent(ev);
      return;
    }

    if (action === "toggle") {
      const entityId = actionConfig.entity || actionConfig.entity_id;
      if (!entityId || !this._hass?.callService) return;
      this._hass.callService("homeassistant", "toggle", { entity_id: entityId });
      return;
    }

    if (action === "perform-action" || action === "call-service") {
      const raw = actionConfig.perform_action || actionConfig.service || "";
      const parts = String(raw).split(".");
      if (parts.length !== 2 || !this._hass?.callService) return;
      const [domain, service] = parts;
      this._hass.callService(domain, service, actionConfig.data || actionConfig.service_data || {});
      return;
    }
  }

  _bindHeaderSubButtonGestures(overlay) {
    const buttons = overlay.querySelectorAll(".ios-sub-btn");
    buttons.forEach((btn) => {
      const slot = btn.getAttribute("data-slot");
      let holdTimer = null;
      let singleTapTimer = null;
      let held = false;
      let lastTapAt = 0;

      const onPointerDown = (ev) => {
        ev.stopPropagation();
        held = false;
        const holdAction = this._getSubButtonAction(slot, "hold");
        if (this._hasUiAction(holdAction)) {
          holdTimer = setTimeout(() => {
            held = true;
            this._runSubButtonAction(holdAction);
            holdTimer = null;
          }, 450);
        }
      };

      const onPointerUp = (ev) => {
        ev.stopPropagation();
        if (holdTimer) {
          clearTimeout(holdTimer);
          holdTimer = null;
        }
        if (held) {
          lastTapAt = 0;
          return;
        }

        const now = Date.now();
        const tapAction = this._getSubButtonAction(slot, "tap");
        const doubleTapAction = this._getSubButtonAction(slot, "double_tap");
        const hasDouble = this._hasUiAction(doubleTapAction);

        if (hasDouble && lastTapAt && now - lastTapAt < 280) {
          lastTapAt = 0;
          if (singleTapTimer) {
            clearTimeout(singleTapTimer);
            singleTapTimer = null;
          }
          this._runSubButtonAction(doubleTapAction);
          return;
        }

        lastTapAt = now;
        singleTapTimer = setTimeout(() => {
          singleTapTimer = null;
          this._runSubButtonAction(tapAction);
          lastTapAt = 0;
        }, hasDouble ? 260 : 0);
      };

      const onPointerCancel = () => {
        if (holdTimer) {
          clearTimeout(holdTimer);
          holdTimer = null;
        }
        if (singleTapTimer) {
          clearTimeout(singleTapTimer);
          singleTapTimer = null;
        }
        held = false;
        lastTapAt = 0;
      };

      btn.addEventListener("pointerdown", onPointerDown);
      btn.addEventListener("pointerup", onPointerUp);
      btn.addEventListener("pointercancel", onPointerCancel);
      btn.addEventListener("contextmenu", (ev) => ev.preventDefault());
    });
  }

  _clearHash() {
    history.replaceState(null, "", window.location.pathname + window.location.search);
  }

  // ══════════════════════════════════════
  //  POPUP iOS
  // ══════════════════════════════════════
  async _openPopup() {
    if (this._popupOpen) return;
    this._popupOpen = true;

    if (this._config.haptic) {
      try {
        if (navigator.vibrate) navigator.vibrate(10);
        window.dispatchEvent(new CustomEvent("haptic", { detail: "light" }));
      } catch (_) { }
    }

    const cfg = this._config;
    const iconBackground = (cfg.icon_background !== undefined && cfg.icon_background !== null) ? cfg.icon_background : "rgba(255,255,255,0.06)";
    const headerTextColor = cfg.header_text_color || "var(--primary-text-color, #fff)";
    const iconColor = cfg.icon_color || "var(--primary-text-color)";

    const _borderParts = String(cfg.border_radius || '').split(/\s+/).filter(Boolean);
    const _topLeftRadius = _borderParts[0] || '0';
    const _topRightRadius = _borderParts[1] || _borderParts[0] || '0';

    const overlay = document.createElement("div");
    overlay.className = "ios-popup-overlay";
    this._overlay = overlay;

    overlay.innerHTML = `
      <style>
        .ios-popup-overlay {
          position: fixed;
          inset: 0;
          z-index: 9999;
          display: flex;
          align-items: flex-end;
          justify-content: center;
          font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', sans-serif;
          -webkit-font-smoothing: antialiased;
        }
        .ios-scrim {
          position: absolute;
          inset: 0;
          background: ${cfg.scrim_background};
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
          opacity: 0;
          animation: ios-scrimIn 0.32s ease forwards;
        }
        @keyframes ios-scrimIn { to { opacity: 1; } }
        @keyframes ios-scrimOut { to { opacity: 0; } }
        .ios-scrim.closing {
          animation: ios-scrimOut 0.3s ease forwards;
        }
        .ios-sheet {
          position: relative;
          z-index: 1;
          width: 100%;
          max-width: ${cfg.max_width};
          max-height: ${cfg.max_height};
          overflow: hidden;
          background: ${cfg.popup_background};
          backdrop-filter: blur(${cfg.blur_strength}px) saturate(190%);
          -webkit-backdrop-filter: blur(${cfg.blur_strength}px) saturate(190%);
          border-radius: ${cfg.border_radius};
          border-top: 0.5px solid rgba(255,255,255,0.12);
          box-shadow:
            0 -4px 30px rgba(0,0,0,0.25),
            0 0 0 0.5px rgba(255,255,255,0.05);
          padding-bottom: env(safe-area-inset-bottom, 16px);
          transform: translateY(100%);
          animation: ios-sheetIn 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          will-change: transform;
          display: flex;
          flex-direction: column;
        }
        @keyframes ios-sheetIn {
          from { transform: translateY(100%); }
          to   { transform: translateY(0); }
        }
        @keyframes ios-sheetOut {
          from { transform: translateY(0); }
          to   { transform: translateY(100%); }
        }
        .ios-sheet.closing {
          animation: ios-sheetOut 0.35s cubic-bezier(0.32, 0.72, 0, 1) forwards;
        }
        .ios-sheet::-webkit-scrollbar { display: none; }
        .ios-sheet { scrollbar-width: none; }
        .ios-handle-area {
          display: ${cfg.show_handle ? "flex" : "none"};
          justify-content: center;
          padding: 14px 0 10px 0;
          cursor: grab;
          touch-action: none;
          user-select: none;
        }
        .ios-handle {
          width: 36px; height: 5px;
          border-radius: 100px;
          background: rgba(255,255,255,0.28);
        }
        .ios-top {
          position: relative;
          z-index: 3;
          background: transparent;
          backdrop-filter: none;
          -webkit-backdrop-filter: none;
          overflow: hidden;
          border-top-left-radius: ${_topLeftRadius};
          border-top-right-radius: ${_topRightRadius};
        }
        .ios-header {
          display: ${cfg.show_header ? "flex" : "none"};
          align-items: center;
          justify-content: space-between;
          padding: 4px 16px 8px 20px;
        }
        .ios-header-left {
          display: flex;
          align-items: center;
          gap: 12px;
          min-width: 0;
        }
        .ios-header-icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          background: ${iconBackground};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ios-header-icon ha-icon {
          --mdc-icon-size: 20px;
          color: ${cfg.icon_color};
        }
        .ios-header-title {
          font-size: 20px; font-weight: 700;
          color: ${headerTextColor};
          letter-spacing: -0.4px;
          line-height: 1.2;
        }
        .ios-header-sub {
          font-size: 13px; font-weight: 500;
          color: var(--secondary-text-color, rgba(255,255,255,0.4));
          margin-top: 1px;
          letter-spacing: -0.1px;
        }
        .ios-close {
          display: ${cfg.show_close ? "flex" : "none"};
          width: 30px; height: 30px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          border: none;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: background 0.15s ease, transform 0.1s ease;
          -webkit-tap-highlight-color: transparent;
          flex-shrink: 0;
        }
        .ios-close:active {
          transform: scale(0.9);
          background: rgba(255,255,255,0.18);
        }
        .ios-close svg {
          width: 14px; height: 14px;
          stroke: rgba(255,255,255,0.5);
          stroke-width: 2.5;
          stroke-linecap: round;
          fill: none;
        }
        .ios-header-right {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-left: auto;
          flex-shrink: 0;
        }
        .ios-sub-btn {
          width: 30px;
          height: 30px;
          border-radius: 50%;
          background: rgba(255,255,255,0.1);
          border: none;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: var(--primary-text-color, #fff);
          cursor: pointer;
          transition: background 0.15s ease, transform 0.1s ease;
          -webkit-tap-highlight-color: transparent;
          position: relative;
        }
        .ios-sub-btn:active {
          transform: scale(0.92);
          background: rgba(255,255,255,0.18);
        }
        .ios-sub-btn ha-icon {
          --mdc-icon-size: 17px;
          color: var(--primary-text-color, #fff);
        }
        .ios-sub-badge {
          position: absolute;
          top: -4px;
          right: -4px;
          min-width: 14px;
          height: 14px;
          border-radius: 14px;
          padding: 0 4px;
          background: var(--error-color, #FF453A);
          color: #fff;
          font-size: 9px;
          font-weight: 700;
          line-height: 14px;
          text-align: center;
          box-shadow: 0 0 0 1px rgba(0,0,0,0.25);
        }
        .ios-sep {
          display: ${cfg.show_header ? "block" : "none"};
          height: 0.5px;
          background: rgba(255,255,255,0.07);
          margin: 0 16px 4px 16px;
        }
        .ios-content {
          flex: 1;
          min-height: 0;
          overflow-y: auto;
          overscroll-behavior: contain;
          -webkit-overflow-scrolling: touch;
          padding: 4px 12px 12px 12px;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .ios-content::-webkit-scrollbar { display: none; }
        .ios-content { scrollbar-width: none; }
      </style>

      <div class="ios-scrim"></div>
      <div class="ios-sheet">
        <div class="ios-top">
          <div class="ios-handle-area">
            <div class="ios-handle"></div>
          </div>
          <div class="ios-header">
            <div class="ios-header-left">
              ${cfg.icon ? '<div class="ios-header-icon"><ha-icon icon="' + cfg.icon + '"></ha-icon></div>' : ""}
              <div>
                <div class="ios-header-title">${cfg.title}</div>
                ${cfg.subtitle ? '<div class="ios-header-sub">' + cfg.subtitle + "</div>" : ""}
              </div>
            </div>
            <div class="ios-header-right">
              ${cfg.sub_btn_1_icon && this._hasUiAction(cfg.sub_btn_1_tap_action || this._targetToAction(cfg.sub_btn_1_tap_target || cfg.sub_btn_1_target)) ? '<button class="ios-sub-btn" data-slot="1"><ha-icon icon="' + cfg.sub_btn_1_icon + '"></ha-icon>' + (cfg.sub_btn_1_badge ? '<span class="ios-sub-badge">' + cfg.sub_btn_1_badge + '</span>' : '') + '</button>' : ""}
              ${cfg.sub_btn_2_icon && this._hasUiAction(cfg.sub_btn_2_tap_action || this._targetToAction(cfg.sub_btn_2_tap_target || cfg.sub_btn_2_target)) ? '<button class="ios-sub-btn" data-slot="2"><ha-icon icon="' + cfg.sub_btn_2_icon + '"></ha-icon>' + (cfg.sub_btn_2_badge ? '<span class="ios-sub-badge">' + cfg.sub_btn_2_badge + '</span>' : '') + '</button>' : ""}
              <button class="ios-close">
                <svg viewBox="0 0 14 14"><line x1="1" y1="1" x2="13" y2="13"/><line x1="13" y1="1" x2="1" y2="13"/></svg>
              </button>
            </div>
          </div>
          <div class="ios-sep"></div>
        </div>
        <div class="ios-content"></div>
      </div>
    `;

    document.body.appendChild(overlay);

    // Désactiver le scroll du body pour empêcher le scroll en arrière-plan
    this._originalBodyOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const sheet = overlay.querySelector(".ios-sheet");
    const scrim = overlay.querySelector(".ios-scrim");
    const closeBtn = overlay.querySelector(".ios-close");
    const content = overlay.querySelector(".ios-content");

    await this._renderCards(content);

    const close = () => this._closePopup(sheet, scrim, overlay);
    closeBtn.addEventListener("click", close);
    this._bindHeaderSubButtonGestures(overlay);
    if (cfg.close_on_scrim) scrim.addEventListener("click", close);

    // Swipe to dismiss — uniquement depuis le grab handle
    // Utilise pointer events + setPointerCapture pour un suivi fiable sur iOS/Android
    // même si le doigt quitte la zone du handle.
    if (cfg.swipe_to_close) {
      const handleArea = overlay.querySelector(".ios-handle-area");
      // Forcer touch-action:none via JS pour s'assurer que le scroll du parent ne vole pas le geste
      handleArea.style.touchAction = "none";
      let startY = 0, currentY = 0, dragging = false;

      handleArea.addEventListener("pointerdown", (e) => {
        // Capturer le pointer : tous les events suivants arrivent ici même hors zone
        try { handleArea.setPointerCapture(e.pointerId); } catch (_) { }
        startY = e.clientY;
        currentY = startY;
        dragging = true;
        // Geler l'animation d'ouverture à sa position courante pour éviter un saut
        const currentTransform = getComputedStyle(sheet).transform;
        sheet.style.animation = "none";
        sheet.style.transform = currentTransform === "none" ? "translateY(0)" : currentTransform;
        sheet.style.transition = "none";
        scrim.style.animation = "none";
        scrim.style.transition = "none";
      });

      handleArea.addEventListener("pointermove", (e) => {
        if (!dragging) return;
        currentY = e.clientY;
        const delta = Math.max(0, currentY - startY);
        // Légère résistance pour un feel naturel
        sheet.style.transform = "translateY(" + (delta * 0.88) + "px)";
        scrim.style.opacity = String(1 - Math.min(delta / 320, 1) * 0.75);
      });

      const onRelease = () => {
        if (!dragging) return;
        dragging = false;
        const delta = currentY - startY;

        if (delta > 90) {
          // ── Fermeture inline ───────────────────────────────────────────────
          // On NE passe PAS par _closePopup (qui ajoute la classe .closing animant
          // depuis translateY(0)) pour éviter le saut si le popup est déjà descendu.
          this._popupOpen = false;
          if (this._config.haptic) {
            try { if (navigator.vibrate) navigator.vibrate(5); } catch (_) { }
          }
          // Restaurer le scroll du body
          document.body.style.overflow = this._originalBodyOverflow;
          // Animer depuis la position actuelle vers 100% en bas
          sheet.style.transition = "transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)";
          sheet.style.transform = "translateY(100%)";
          scrim.style.transition = "opacity 0.28s ease";
          scrim.style.opacity = "0";
          // Nettoyer tous les listeners
          if (this._escHandler) window.removeEventListener("keydown", this._escHandler);
          if (this._closeOnHash) {
            window.removeEventListener("hashchange", this._closeOnHash);
            window.removeEventListener("location-changed", this._closeOnHash);
            window.removeEventListener("popstate", this._closeOnHash);
          }
          this._clearHash();
          setTimeout(() => { try { overlay.remove(); } catch (_) { } this._popupCards = []; }, 300);
        } else {
          // ── Rebond : snap-back avec spring ────────────────────────────────
          sheet.style.transition = "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)";
          sheet.style.transform = "translateY(0)";
          scrim.style.transition = "opacity 0.35s ease";
          scrim.style.opacity = "1";
        }
      };

      handleArea.addEventListener("pointerup", onRelease);
      // pointercancel = geste interrompu (appel entrant, etc.) → snap-back
      handleArea.addEventListener("pointercancel", () => {
        dragging = false;
        sheet.style.transition = "transform 0.45s cubic-bezier(0.16, 1, 0.3, 1)";
        sheet.style.transform = "translateY(0)";
        scrim.style.transition = "opacity 0.35s ease";
        scrim.style.opacity = "1";
      });

      this._swipeCleanup = () => { /* pointer capture — pas de listeners globaux */ };
    }

    this._escHandler = (e) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", this._escHandler);

    this._closeOnHash = () => {
      const h = window.location.hash;
      if (h !== "#popup-" + this._config.hash) close();
    };
    window.addEventListener("hashchange", this._closeOnHash);
    window.addEventListener("location-changed", this._closeOnHash);
    window.addEventListener("popstate", this._closeOnHash);
  }

  _closePopup(sheet, scrim, overlay) {
    if (!this._popupOpen) return;
    this._popupOpen = false;

    if (this._config.haptic) {
      try { if (navigator.vibrate) navigator.vibrate(5); } catch (_) { }
    }

    // Restaurer le scroll du body
    document.body.style.overflow = this._originalBodyOverflow;

    // Reverse animation (same visual language as opening)
    sheet.classList.add("closing");
    scrim.classList.add("closing");

    if (this._escHandler) window.removeEventListener("keydown", this._escHandler);
    if (this._swipeCleanup) this._swipeCleanup();
    if (this._closeOnHash) {
      window.removeEventListener("hashchange", this._closeOnHash);
      window.removeEventListener("location-changed", this._closeOnHash);
      window.removeEventListener("popstate", this._closeOnHash);
    }

    this._clearHash();

    const cleanup = () => {
      try { overlay.remove(); } catch (_) { }
      this._popupCards = [];
    };

    // Prefer animation end for smoothness; keep timeout fallback for safety
    sheet.addEventListener("animationend", cleanup, { once: true });
    setTimeout(cleanup, 420);
  }

  async _renderCards(container) {
    if (!this._config.cards || !this._config.cards.length) return;

    let helpers;
    try { helpers = await window.loadCardHelpers(); } catch (_) { }

    this._popupCards = [];

    for (const cardConfig of this._config.cards) {
      let el;
      try {
        if (helpers && helpers.createCardElement) {
          el = helpers.createCardElement(cardConfig);
        } else {
          const tag = cardConfig.type.startsWith("custom:")
            ? cardConfig.type.substr(7)
            : "hui-" + cardConfig.type + "-card";
          el = document.createElement(tag);
          if (el.setConfig) el.setConfig(cardConfig);
        }
      } catch (e) {
        el = document.createElement("div");
        el.textContent = "Erreur: " + cardConfig.type + " — " + e.message;
        el.style.cssText = "color:#FF453A;padding:12px;font-size:13px;background:rgba(255,69,58,0.1);border-radius:10px;";
      }

      if (el) {
        if (this._hass) el.hass = this._hass;
        this._popupCards.push(el);
        container.appendChild(el);
      }
    }
  }
}

// ══════════════════════════════════════
//  REGISTER
// ══════════════════════════════════════
customElements.define("ios-popup-card", IOSPopupCard);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "ios-popup-card",
  name: "iOS Popup Card",
  description: "Popup iOS bottom-sheet déclenché par hash navigation (#popup-xxx). Carte invisible.",
  preview: false,
  documentationURL: "https://github.com/",
});

console.info(
  "%c iOS-POPUP-CARD %c v3.0.0 ",
  "background:#0A84FF;color:white;font-weight:bold;border-radius:4px 0 0 4px;padding:2px 6px",
  "background:#1c1c1e;color:#0A84FF;font-weight:bold;border-radius:0 4px 4px 0;padding:2px 6px"
);