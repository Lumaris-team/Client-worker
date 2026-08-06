import { defaultSettings, loadSettings, saveSettings, applyThemeSettings, saveRemoteSettings } from "/lib/settings.js";

const fields = {
  backgroundType: document.getElementById("backgroundType"),
  gradientStyle: document.getElementById("gradientStyle"),
  gradientOrientation: document.getElementById("gradientOrientation"),
  color1: document.getElementById("color1"),
  color2: document.getElementById("color2"),
  solidColor: document.getElementById("solidColor"),
  fontFamily: document.getElementById("fontFamily"),
  fontWeight: document.getElementById("fontWeight"),
  fontSize: document.getElementById("fontSize"),
  fontSizeValue: document.getElementById("fontSizeValue"),
  saveButton: document.getElementById("saveSettings"),
  resetButton: document.getElementById("resetSettings"),
  preview: document.getElementById("settingsPreview"),
  btnGradient: document.getElementById("btnGradient"),
  btnSolid: document.getElementById("btnSolid"),
  arrowButtons: Array.from(document.querySelectorAll(".arrow-btn")),
};

function getCurrentSettings() {
  return {
    backgroundType: fields.backgroundType.value,
    gradientStyle: fields.gradientStyle.value,
    gradientOrientation: fields.gradientOrientation.value,
    color1: fields.color1.value,
    color2: fields.color2.value,
    solidColor: fields.solidColor.value,
    fontFamily: fields.fontFamily.value,
    fontWeight: fields.fontWeight.checked ? "700" : "500",
    fontSize: Number(fields.fontSize.value),
  };
}

function syncSolidFieldVisibility() {
  const showSolid = fields.backgroundType.value === "solid";
  document.querySelectorAll(".solid-field").forEach((node) => {
    node.style.display = showSolid ? "grid" : "none";
  });
  // show/hide gradient controls
  const isGradient = fields.backgroundType.value === "gradient";
  document.querySelectorAll(".style-group").forEach((n) => (n.style.display = isGradient ? "grid" : "none"));
  document.querySelectorAll(".orientation-group").forEach((n) => (n.style.display = isGradient ? "grid" : "none"));
}

function updateTypeButtons() {
  if (!fields.btnGradient || !fields.btnSolid) return;
  const t = fields.backgroundType.value;
  fields.btnGradient.setAttribute("aria-pressed", t === "gradient" ? "true" : "false");
  fields.btnSolid.setAttribute("aria-pressed", t === "solid" ? "true" : "false");
}

function setOrientationActive(orient) {
  fields.arrowButtons.forEach((b) => {
    b.classList.toggle("active", b.dataset.orient === orient);
  });
}

function renderPreview(settings) {
  if (!fields.preview) return;
  const card = fields.preview.querySelector(".preview-card");
  if (!card) return;
  card.style.background =
    settings.backgroundType === "solid"
      ? settings.solidColor
      : settings.gradientStyle === "radial"
      ? `radial-gradient(circle at center, ${settings.color1} 0%, ${settings.color2} 100%)`
      : `linear-gradient(${settings.gradientOrientation}, ${settings.color1} 0%, ${settings.color2} 100%)`;
  card.style.color = settings.backgroundType === "solid" ? "#f7fbff" : "#ffffff";
  card.style.fontFamily = settings.fontFamily;
  card.style.fontWeight = settings.fontWeight;
}

function populateForm(settings) {
  fields.backgroundType.value = settings.backgroundType;
  fields.gradientStyle.value = settings.gradientStyle;
  fields.gradientOrientation.value = settings.gradientOrientation;
  fields.color1.value = settings.color1;
  fields.color2.value = settings.color2;
  fields.solidColor.value = settings.solidColor;
  fields.fontFamily.value = settings.fontFamily;
  fields.fontWeight.checked = settings.fontWeight === "700";
  fields.fontSize.value = settings.fontSize;
  fields.fontSizeValue.textContent = `${settings.fontSize}px`;
  syncSolidFieldVisibility();
  updateTypeButtons();
  setOrientationActive(settings.gradientOrientation || "0deg");
  renderPreview(settings);
}

function handleFieldChange() {
  const settings = getCurrentSettings();
  applyThemeSettings(settings);
  renderPreview(settings);
  saveSettings(settings);
  saveRemoteSettings(settings).catch(() => undefined);
}

function resetToDefaults() {
  const initial = defaultSettings();
  populateForm(initial);
  applyThemeSettings(initial);
  saveSettings(initial);
  saveRemoteSettings(initial).catch(() => undefined);
}

function wireEvents() {
  // wire individual inputs
  Object.values(fields).forEach((input) => {
    if (!input || input.tagName === "BUTTON" || input.tagName === "OUTPUT") return;
    const eventType = input === fields.fontSize ? "input" : "change";
    input.addEventListener(eventType, () => {
      if (input === fields.fontSize) {
        fields.fontSizeValue.textContent = `${Number(fields.fontSize.value)}px`;
      }
      handleFieldChange();
    });
  });

  // type toggle buttons
  fields.btnGradient?.addEventListener("click", () => {
    fields.backgroundType.value = "gradient";
    updateTypeButtons();
    syncSolidFieldVisibility();
    handleFieldChange();
  });
  fields.btnSolid?.addEventListener("click", () => {
    fields.backgroundType.value = "solid";
    updateTypeButtons();
    syncSolidFieldVisibility();
    handleFieldChange();
  });

  // arrow orientation buttons
  fields.arrowButtons.forEach((b) => {
    b.addEventListener("click", () => {
      const o = b.dataset.orient;
      fields.gradientOrientation.value = o;
      setOrientationActive(o);
      handleFieldChange();
    });
  });

  fields.saveButton?.addEventListener("click", async () => {
    const settings = getCurrentSettings();
    saveSettings(settings);
    await saveRemoteSettings(settings);
    fields.saveButton.textContent = "Enregistré";
    setTimeout(() => {
      fields.saveButton.textContent = "Enregistrer";
    }, 1200);
  });

  fields.resetButton?.addEventListener("click", () => {
    resetToDefaults();
  });
}

function initSettingsPage() {
  const settings = loadSettings();
  populateForm(settings);
  wireEvents();
}

document.addEventListener("DOMContentLoaded", initSettingsPage);
