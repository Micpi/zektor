class BlazeAppCard extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {
      title: "Blaze Control Center",
      entity_prefix: "blaze_powerzone",
      entry_id: "",
      show_raw_panel: true,
    };
    this._hass = null;
    this._activeTab = "overview";
    this._rawCommand = "GET API_VERSION";
    this._statusMessage = "";
  }

  setConfig(config) {
    if (!config || typeof config !== "object") {
      throw new Error("Invalid configuration");
    }

    this._config = {
      ...this._config,
      ...config,
    };

    this._render();
  }

  set hass(hass) {
    this._hass = hass;
    this._render();
  }

  getCardSize() {
    return 8;
  }

  static getConfigElement() {
    return document.createElement("blaze-app-card-editor");
  }

  static getStubConfig() {
    return {
      type: "custom:blaze-app-card",
      title: "Blaze Control Center",
      entity_prefix: "blaze_powerzone",
      show_raw_panel: true,
    };
  }

  _matchesBlazeEntity(entityId, stateObj) {
    const prefix = (this._config.entity_prefix || "blaze_powerzone").toLowerCase();
    const lowerId = entityId.toLowerCase();
    const manufacturer = (stateObj?.attributes?.manufacturer || "").toLowerCase();

    return lowerId.includes(prefix) || manufacturer.includes("blaze");
  }

  _collectEntities() {
    if (!this._hass) {
      return { sensors: [], numbers: [], selects: [], switches: [], buttons: [] };
    }

    const result = { sensors: [], numbers: [], selects: [], switches: [], buttons: [] };

    for (const [entityId, stateObj] of Object.entries(this._hass.states)) {
      if (!this._matchesBlazeEntity(entityId, stateObj)) {
        continue;
      }

      if (entityId.startsWith("sensor.")) result.sensors.push([entityId, stateObj]);
      if (entityId.startsWith("number.")) result.numbers.push([entityId, stateObj]);
      if (entityId.startsWith("select.")) result.selects.push([entityId, stateObj]);
      if (entityId.startsWith("switch.")) result.switches.push([entityId, stateObj]);
      if (entityId.startsWith("button.")) result.buttons.push([entityId, stateObj]);
    }

    const sortByName = (a, b) => {
      const nameA = a[1].attributes.friendly_name || a[0];
      const nameB = b[1].attributes.friendly_name || b[0];
      return nameA.localeCompare(nameB);
    };

    result.sensors.sort(sortByName);
    result.numbers.sort(sortByName);
    result.selects.sort(sortByName);
    result.switches.sort(sortByName);
    result.buttons.sort(sortByName);

    return result;
  }

  async _callService(domain, service, data) {
    try {
      await this._hass.callService(domain, service, data || {});
      this._statusMessage = "Action envoyee avec succes";
    } catch (err) {
      this._statusMessage = `Erreur: ${err?.message || err}`;
    }
    this._render();
  }

  _renderTabs() {
    const tabs = [
      ["overview", "Vue Globale"],
      ["controls", "Controles"],
      ["variables", "Variables"],
      ["api", "API"],
    ];

    return tabs
      .map(
        ([id, label]) => `
          <button class="tab ${this._activeTab === id ? "is-active" : ""}" data-tab="${id}">${label}</button>
        `,
      )
      .join("");
  }

  _renderOverview(entities) {
    const systemSensors = entities.sensors.filter(([entityId]) =>
      entityId.includes("system") || entityId.includes("api_version") || entityId.includes("firmware"),
    );

    return `
      <section class="panel-grid">
        <article class="panel">
          <h3>Etat Systeme</h3>
          <div class="kv-list">
            ${systemSensors
              .slice(0, 10)
              .map(([entityId, st]) => {
                const name = st.attributes.friendly_name || entityId;
                return `<div class="kv"><span>${name}</span><strong>${st.state}</strong></div>`;
              })
              .join("")}
          </div>
        </article>

        <article class="panel">
          <h3>Actions Rapides</h3>
          <div class="actions">
            ${entities.buttons
              .map(([entityId, st]) => {
                const name = st.attributes.friendly_name || entityId;
                return `<button class="action" data-press="${entityId}">${name}</button>`;
              })
              .join("")}
          </div>
        </article>

        <article class="panel">
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
    `;
  }

  _renderControls(entities) {
    return `
      <section class="stack">
        <article class="panel">
          <h3>Switches</h3>
          <div class="rows">
            ${entities.switches
              .map(([entityId, st]) => {
                const name = st.attributes.friendly_name || entityId;
                const isOn = st.state === "on";
                return `
                  <label class="row">
                    <span>${name}</span>
                    <input type="checkbox" data-toggle="${entityId}" ${isOn ? "checked" : ""}>
                  </label>
                `;
              })
              .join("")}
          </div>
        </article>

        <article class="panel">
          <h3>Numbers (SET / INC)</h3>
          <div class="rows">
            ${entities.numbers
              .map(([entityId, st]) => {
                const name = st.attributes.friendly_name || entityId;
                const min = Number(st.attributes.min ?? -100);
                const max = Number(st.attributes.max ?? 100);
                const step = Number(st.attributes.step ?? 1);
                const value = Number(st.state);
                return `
                  <div class="row row-number">
                    <span>${name}</span>
                    <input class="range" type="range" min="${min}" max="${max}" step="${step}" value="${Number.isFinite(value) ? value : min}" data-number="${entityId}">
                    <span class="value">${st.state}</span>
                  </div>
                `;
              })
              .join("")}
          </div>
        </article>

        <article class="panel">
          <h3>Selects</h3>
          <div class="rows">
            ${entities.selects
              .map(([entityId, st]) => {
                const name = st.attributes.friendly_name || entityId;
                const options = Array.isArray(st.attributes.options) ? st.attributes.options : [];
                const current = st.state;
                return `
                  <label class="row row-select">
                    <span>${name}</span>
                    <select data-select="${entityId}">
                      ${options
                        .map((opt) => `<option value="${opt}" ${opt === current ? "selected" : ""}>${opt}</option>`)
                        .join("")}
                    </select>
                  </label>
                `;
              })
              .join("")}
          </div>
        </article>
      </section>
    `;
  }

  _renderVariables(entities) {
    return `
      <section class="panel">
        <h3>Variables Blaze (lecture)</h3>
        <div class="table">
          <div class="thead"><span>Entity</span><span>Value</span></div>
          ${entities.sensors
            .map(([entityId, st]) => `<div class="tr"><span>${entityId}</span><strong>${st.state}</strong></div>`)
            .join("")}
        </div>
      </section>
    `;
  }

  _renderApiPanel() {
    if (!this._config.show_raw_panel) {
      return '<section class="panel"><h3>API</h3><p>Panel API desactive dans la configuration.</p></section>';
    }

    return `
      <section class="panel">
        <h3>Commandes API Brutes</h3>
        <p class="hint">Fonctions supportees: GET, SET, INC, SUBSCRIBE, UNSUBSCRIBE, POWER_ON, POWER_OFF.</p>
        <div class="api-row">
          <input class="raw-input" data-raw-input value="${this._rawCommand}">
          <button class="action" data-send-raw>Envoyer</button>
        </div>
      </section>
    `;
  }

  _render() {
    if (!this._hass) {
      return;
    }

    const entities = this._collectEntities();

    let content = "";
    if (this._activeTab === "overview") content = this._renderOverview(entities);
    if (this._activeTab === "controls") content = this._renderControls(entities);
    if (this._activeTab === "variables") content = this._renderVariables(entities);
    if (this._activeTab === "api") content = this._renderApiPanel();

    this.shadowRoot.innerHTML = `
      <style>
        :host { display: block; }
        ha-card {
          --blaze-blue: #00AEEF;
          --blaze-accent: #38BDF8;
          --blaze-bg: #0F172A;
          --blaze-surface: #1E293B;
          color: #E2E8F0;
          background: radial-gradient(circle at 12% 20%, rgba(56,189,248,0.22), transparent 34%), linear-gradient(145deg, #0F172A 0%, #1E293B 100%);
          border: 1px solid rgba(56, 189, 248, 0.25);
          overflow: hidden;
        }
        .wrap { padding: 14px; display: grid; gap: 12px; }
        .title { display: flex; justify-content: space-between; align-items: center; gap: 12px; }
        .title h2 { margin: 0; font: 700 1.1rem "Segoe UI", sans-serif; letter-spacing: 0.02em; }
        .status { color: #7DD3FC; font-size: 0.85rem; }
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
        .panel-grid { display: grid; gap: 10px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
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
        .row-number { grid-template-columns: 1fr minmax(140px, 220px) auto; }
        .row-select { grid-template-columns: 1fr minmax(140px, 260px); }
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
        .table { max-height: 420px; overflow: auto; }
        .thead { color: #93C5FD; font-weight: 600; position: sticky; top: 0; background: rgba(15,23,42,0.95); padding-bottom: 4px; }
        .tr { font-size: 0.9rem; border-bottom: 1px solid rgba(148,163,184,0.16); padding-bottom: 6px; }
        .hint { color: #BAE6FD; margin: 0 0 8px 0; font-size: 0.86rem; }
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
        @media (max-width: 840px) {
          .row-number, .row-select { grid-template-columns: 1fr; }
          .api-row { grid-template-columns: 1fr; }
        }
      </style>
      <ha-card>
        <div class="wrap">
          <div class="title">
            <h2>${this._config.title}</h2>
            <span class="status">${this._statusMessage || "Pret"}</span>
          </div>
          <div class="tabs">${this._renderTabs()}</div>
          ${content}
        </div>
      </ha-card>
    `;

    this.shadowRoot.querySelectorAll(".tab").forEach((el) => {
      el.addEventListener("click", () => {
        this._activeTab = el.dataset.tab;
        this._render();
      });
    });

    this.shadowRoot.querySelectorAll("[data-press]").forEach((el) => {
      el.addEventListener("click", async () => {
        await this._callService("button", "press", { entity_id: el.dataset.press });
      });
    });

    this.shadowRoot.querySelectorAll("[data-toggle]").forEach((el) => {
      el.addEventListener("change", async () => {
        await this._callService("homeassistant", "toggle", { entity_id: el.dataset.toggle });
      });
    });

    this.shadowRoot.querySelectorAll("[data-number]").forEach((el) => {
      el.addEventListener("change", async () => {
        await this._callService("number", "set_value", {
          entity_id: el.dataset.number,
          value: Number(el.value),
        });
      });
    });

    this.shadowRoot.querySelectorAll("[data-select]").forEach((el) => {
      el.addEventListener("change", async () => {
        await this._callService("select", "select_option", {
          entity_id: el.dataset.select,
          option: el.value,
        });
      });
    });

    const rawInput = this.shadowRoot.querySelector("[data-raw-input]");
    if (rawInput) {
      rawInput.addEventListener("input", () => {
        this._rawCommand = rawInput.value;
      });
    }

    const rawButton = this.shadowRoot.querySelector("[data-send-raw]");
    if (rawButton) {
      rawButton.addEventListener("click", async () => {
        const payload = { command: this._rawCommand };
        if (this._config.entry_id) {
          payload.entry_id = this._config.entry_id;
        }
        await this._callService("blaze_powerzone", "send_raw_command", payload);
      });
    }
  }
}

class BlazeAppCardEditor extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this._config = {};
  }

  setConfig(config) {
    this._config = {
      title: "Blaze Control Center",
      entity_prefix: "blaze_powerzone",
      entry_id: "",
      show_raw_panel: true,
      ...config,
    };
    this._render();
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

  _setValue(key, value) {
    const next = { ...this._config, [key]: value };
    this._config = next;
    this._emitConfig();
  }

  _render() {
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

            <label>Prefix entites</label>
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
      </div>
    `;

    this.shadowRoot.querySelectorAll("input[data-key]").forEach((input) => {
      input.addEventListener("input", () => {
        this._setValue(input.dataset.key, input.value);
      });
    });

    this.shadowRoot.querySelectorAll("select[data-key]").forEach((select) => {
      select.addEventListener("change", () => {
        this._setValue(select.dataset.key, select.value === "true");
      });
    });
  }
}

customElements.define("blaze-app-card", BlazeAppCard);
customElements.define("blaze-app-card-editor", BlazeAppCardEditor);

window.customCards = window.customCards || [];
window.customCards.push({
  type: "blaze-app-card",
  name: "Blaze App Card",
  description: "Structured control center for Blaze PowerZone integration",
});
