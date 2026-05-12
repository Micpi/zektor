;(() => {
  const CARD_FILES = [
    "custom_cards/activity-select-card/activity-select-card.js",
    "custom_cards/area-card/alpha-area-card.js",
    "custom_cards/iOS-PopUp-card/ios-popup-card.js",
    "custom_cards/naive-flex-card/naive-flex-card.js",
    "custom_cards/thermo-halo-card/thermo-halo-card.js",
  ]

  const currentScript = document.currentScript
  if (!currentScript || !currentScript.src) {
    console.warn("[homeassistant-ai-cards] Unable to resolve loader URL.")
    return
  }

  const baseUrl = new URL("./", currentScript.src)
  const loadedMarker = "__homeassistant_ai_cards_loaded__"

  if (window[loadedMarker]) {
    return
  }
  window[loadedMarker] = true

  const appendScript = (relativePath) => {
    const url = new URL(relativePath, baseUrl).toString()

    if (document.querySelector(`script[data-ha-ai-card=\"${url}\"]`)) {
      return
    }

    const script = document.createElement("script")
    script.src = url
    script.type = "module"
    script.dataset.haAiCard = url
    script.async = false
    script.onerror = () => {
      console.error(`[homeassistant-ai-cards] Failed to load: ${relativePath}`)
    }

    document.head.appendChild(script)
  }

  CARD_FILES.forEach(appendScript)
  console.info("[homeassistant-ai-cards] Dashboard cards bundle loaded.")
})()
