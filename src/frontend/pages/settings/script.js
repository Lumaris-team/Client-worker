import { defaultSettings, loadSettings, saveSettings, applyThemeSettings, saveRemoteSettings } from "/lib/settings.js";
import { loadIcons } from "/lib/icons.js";
import { authedFetch } from "/lib/auth.js";

const statsData = {
  aiUsage: 12,
  aiLimit: 20,
  storageCapacity: 20,
  storageTotal: 8.5,
  storageFiles: 5.3,
  storageNotes: 3.2,
};

const fields = {
  backgroundType: document.getElementById("backgroundType"),
  gradientStyle: document.getElementById("gradientStyle"),
  gradientOrientation: document.getElementById("gradientOrientation"),
  gradientLinearBtn: document.getElementById("gradientLinear"),
  gradientRadialBtn: document.getElementById("gradientRadial"),
  color1: document.getElementById("color1"),
  color2: document.getElementById("color2"),
  solidColor: document.getElementById("solidColor"),
  orient0: document.getElementById("orient0"),
  orient45: document.getElementById("orient45"),
  orient90: document.getElementById("orient90"),
  orient135: document.getElementById("orient135"),
  bgGradientBtn: document.getElementById("bgGradient"),
  bgSolidBtn: document.getElementById("bgSolid"),
  personalizationBtn: document.getElementById("personalization-btn"),
  statisticsBtn: document.getElementById("statistics-btn"),
  statsTemplate: document.getElementById("statistics-panel-template"),
  pageMain: document.querySelector("main.settings-shell"),
  settingsPreview: document.getElementById("settingsPreview"),
  fontFamily: document.getElementById("fontFamily"),
  fontWeight: document.getElementById("fontWeight"),
  fontSize: document.getElementById("fontSize"),
  fontSizeValue: document.getElementById("fontSizeValue"),
  saveButton: document.getElementById("saveSettings"),
  resetButton: document.getElementById("resetSettings"),
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
  // show/hide the standalone solid color row
  document.querySelectorAll(".solid-field").forEach((node) => {
    node.style.display = showSolid ? "grid" : "none";
  });
  // hide/disable gradient-related controls when solid is selected
  const gradientControls = [fields.gradientStyle, fields.gradientOrientation, fields.color1, fields.color2];
  gradientControls.forEach((ctrl) => {
    if (!ctrl) return;
    const group = ctrl.closest('.field-group');
    if (!group) return;
    if (showSolid) {
      group.style.display = 'none';
      try { ctrl.disabled = true; } catch (e) {}
      group.setAttribute('aria-hidden', 'true');
    } else {
      group.style.display = 'grid';
      try { ctrl.disabled = false; } catch (e) {}
      group.removeAttribute('aria-hidden');
    }
  });

  // hide the whole color-row (Color 1 / Color 2) when solid is selected
  const colorRow = document.querySelector('.color-row');
  if (colorRow) {
    colorRow.style.display = showSolid ? 'none' : 'grid';
    if (showSolid) {
      // disable individual inputs to avoid them being sent accidentally
      if (fields.color1) fields.color1.disabled = true;
      if (fields.color2) fields.color2.disabled = true;
    } else {
      if (fields.color1) fields.color1.disabled = false;
      if (fields.color2) fields.color2.disabled = false;
    }
  }
  // after showing/hiding gradient controls, ensure orientation matches gradient style
  syncGradientStyleVisibility();
}

function syncGradientStyleVisibility() {
  if (!fields.gradientStyle || !fields.gradientOrientation) return;
  const orientGroup = fields.gradientOrientation.closest('.field-group');
  if (!orientGroup) return;
  const isRadial = fields.gradientStyle.value === 'radial';
  if (isRadial) {
    orientGroup.style.display = 'none';
    try { fields.gradientOrientation.disabled = true; } catch (e) {}
    orientGroup.setAttribute('aria-hidden', 'true');
  } else {
    // only show if not hidden by solid selection
    if (fields.backgroundType && fields.backgroundType.value === 'solid') return;
    orientGroup.style.display = 'grid';
    try { fields.gradientOrientation.disabled = false; } catch (e) {}
    orientGroup.removeAttribute('aria-hidden');
  }
}

function renderPreview(settings) {
  if (!fields.settingsPreview) return;
  const card = fields.settingsPreview.querySelector(".preview-card");
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
  renderPreview(settings);
  // update visual swatches for color inputs
  updateColorSwatches();
  // update background toggle buttons active state
  updateBgToggleButtons();
  // update gradient toggle buttons active state
  updateGradientToggleButtons();
  // update orientation buttons active state
  updateOrientationButtons();
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
  Object.values(fields).forEach((input) => {
    if (!input || input.tagName === "BUTTON" || input.tagName === "OUTPUT") return;
    input.addEventListener("change", () => {
      fields.fontSizeValue.textContent = `${Number(fields.fontSize.value)}px`;
      handleFieldChange();
    });
  });

  // Background toggle buttons handlers
  if (fields.bgGradientBtn && fields.bgSolidBtn && fields.backgroundType) {
    fields.bgGradientBtn.addEventListener('click', () => {
      fields.backgroundType.value = 'gradient';
      updateBgToggleButtons();
      syncSolidFieldVisibility();
      handleFieldChange();
    });
    fields.bgSolidBtn.addEventListener('click', () => {
      fields.backgroundType.value = 'solid';
      updateBgToggleButtons();
      syncSolidFieldVisibility();
      handleFieldChange();
    });
  }

  if (fields.personalizationBtn && fields.statisticsBtn) {
    fields.personalizationBtn.addEventListener('click', () => showView('personalization'));
    fields.statisticsBtn.addEventListener('click', () => showView('statistics'));
  }

  // Gradient style toggle buttons handlers
  if (fields.gradientLinearBtn && fields.gradientRadialBtn && fields.gradientStyle) {
    fields.gradientLinearBtn.addEventListener('click', () => {
      fields.gradientStyle.value = 'linear';
      updateGradientToggleButtons();
      syncGradientStyleVisibility();
      handleFieldChange();
    });
    fields.gradientRadialBtn.addEventListener('click', () => {
      fields.gradientStyle.value = 'radial';
      updateGradientToggleButtons();
      syncGradientStyleVisibility();
      handleFieldChange();
    });
  }

  // Orientation buttons handlers
  const orientationButtons = [fields.orient0, fields.orient45, fields.orient90, fields.orient135];
  orientationButtons.forEach((btn) => {
    if (!btn || !fields.gradientOrientation) return;
    btn.addEventListener('click', () => {
      const val = btn.dataset.value;
      fields.gradientOrientation.value = val;
      updateOrientationButtons();
      handleFieldChange();
    });
  });

  // ensure switching background type updates which controls are visible
  fields.backgroundType?.addEventListener('change', () => {
    syncSolidFieldVisibility();
    // update immediate preview and persist change
    handleFieldChange();
  });

  // ensure switching gradient style hides/shows orientation appropriately
  fields.gradientStyle?.addEventListener('change', () => {
    syncGradientStyleVisibility();
    handleFieldChange();
  });

  // color inputs should update the visible swatch on input (live)
  [fields.color1, fields.color2, fields.solidColor].forEach((colorInput) => {
    if (!colorInput) return;
    colorInput.addEventListener("input", (e) => {
      updateColorSwatch(colorInput);
      // trigger the normal change handling (live preview/save)
      handleFieldChange();
    });
  });

  fields.saveButton?.addEventListener("click", async () => {
    const settings = getCurrentSettings();
    saveSettings(settings);
    await saveRemoteSettings(settings);
    fields.saveButton.textContent = "Saved";
    setTimeout(() => {
      fields.saveButton.textContent = "Save";
    }, 1200);
  });

  fields.resetButton?.addEventListener("click", () => {
    resetToDefaults();
  });
}

async function fetchStatsData() {
  try {
    const response = await authedFetch("/api/stats", { method: "GET" });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload?.resp ?? payload ?? null;
  } catch (error) {
    console.warn("Unable to fetch stats data:", error);
    return null;
  }
}

function createStatsPanel(stats) {
  if (!fields.statsTemplate) return null;
  const clone = fields.statsTemplate.content.firstElementChild.cloneNode(true);
  if (!clone) return null;

  const aiUsageNode = clone.querySelector(".stats-row strong");
  if (aiUsageNode && stats?.aiUsage) {
    aiUsageNode.textContent = `${stats.aiUsage.used} / ${stats.aiUsage.limit} requests`;
  }

  const storageValue = clone.querySelector(".storage-center span");
  const storageSubtitle = clone.querySelector(".storage-center small");
  if (storageValue && stats?.storage) {
    storageValue.textContent = `${(stats.storage.totalBytes / 1024 / 1024 / 1024).toFixed(1)} GB`;
  }
  if (storageSubtitle && stats?.storage) {
    storageSubtitle.textContent = `of ${stats.storage.capacityGB} GB used`;
  }

  const filesLegend = clone.querySelector(".legend-item .legend-dot.files")?.parentElement;
  const notesLegend = clone.querySelector(".legend-item .legend-dot.notes")?.parentElement;
  if (filesLegend && stats?.storage?.items) {
    const filesItem = stats.storage.items.find((item) => item.key === "files/");
    filesLegend.innerHTML = `<span class="legend-dot files"></span> ${filesItem?.label ?? "lumaris/files/"} — ${(filesItem?.bytes ?? 0) / 1024 / 1024 / 1024} GB`;
  }
  if (notesLegend && stats?.storage?.items) {
    const notesItem = stats.storage.items.find((item) => item.key === "study-notes/");
    notesLegend.innerHTML = `<span class="legend-dot notes"></span> ${notesItem?.label ?? "lumaris/study-notes/"} — ${(notesItem?.bytes ?? 0) / 1024 / 1024 / 1024} GB`;
  }

  updateStorageRing(clone, stats);
  return clone;
}

function updateStorageRing(panel, stats) {
  const circumference = 339.292;
  const totalBytes = stats?.storage?.totalBytes || 0;
  const filesBytes = stats?.storage?.items?.find((item) => item.key === "files/")?.bytes || 0;
  const notesBytes = stats?.storage?.items?.find((item) => item.key === "study-notes/")?.bytes || 0;
  const filesPct = totalBytes ? Math.min(filesBytes / totalBytes, 1) : 0;
  const notesPct = totalBytes ? Math.min(notesBytes / totalBytes, 1 - filesPct) : 0;
  const filesOffset = circumference * (1 - filesPct);
  const notesOffset = circumference * (1 - filesPct - notesPct);

  const filesCircle = panel.querySelector('.ring-files');
  const notesCircle = panel.querySelector('.ring-notes');
  if (filesCircle) {
    filesCircle.setAttribute('stroke-dasharray', `${circumference}`);
    filesCircle.setAttribute('stroke-dashoffset', `${filesOffset}`);
  }
  if (notesCircle) {
    notesCircle.setAttribute('stroke-dasharray', `${circumference}`);
    notesCircle.setAttribute('stroke-dashoffset', `${notesOffset}`);
  }
}

let statsPanel = null;

async function showView(view) {
  if (!fields.pageMain) return;

  const isPersonalization = view === 'personalization';
  const personalizationBtn = fields.personalizationBtn;
  const statisticsBtn = fields.statisticsBtn;

  if (personalizationBtn) {
    personalizationBtn.dataset.active = isPersonalization ? 'true' : 'false';
    personalizationBtn.classList.toggle('active', isPersonalization);
  }
  if (statisticsBtn) {
    statisticsBtn.dataset.active = !isPersonalization ? 'true' : 'false';
    statisticsBtn.classList.toggle('active', !isPersonalization);
  }

  fields.pageMain.style.display = isPersonalization ? '' : 'none';

  if (!isPersonalization) {
    if (!statsPanel) {
      const stats = await fetchStatsData();
      statsPanel = createStatsPanel(stats);
      if (statsPanel && fields.pageMain) {
        fields.pageMain.insertAdjacentElement('afterend', statsPanel);
      }
    }
    if (statsPanel) statsPanel.style.display = '';
  } else if (statsPanel) {
    statsPanel.style.display = 'none';
  }
}

function loadSettingsIcons() {
  loadIcons('.settings-icon[data-icon]').catch(() => undefined);
}

function initSettingsPage() {
  const settings = loadSettings();
  populateForm(settings);
  wireEvents();
  loadSettingsIcons();
  showView('personalization');
}

document.addEventListener("DOMContentLoaded", initSettingsPage);

/* Helpers: update the .color-swatch element background to match input value */
function updateColorSwatch(input) {
  try {
    const parent = input.closest('.color-field') || input.closest('.solid-field');
    if (!parent) return;
    const swatch = parent.querySelector('.color-swatch');
    if (!swatch) return;
    swatch.style.background = input.value;
    // ensure contrast for swatch border when dark
    const c = input.value.replace('#','');
    if (c.length === 6) {
      const r = parseInt(c.slice(0,2),16);
      const g = parseInt(c.slice(2,4),16);
      const b = parseInt(c.slice(4,6),16);
      const l = (0.299*r + 0.587*g + 0.114*b)/255;
      swatch.style.borderColor = l > 0.6 ? 'rgba(0,0,0,0.08)' : 'rgba(255,255,255,0.08)';
    }
  } catch (err) {
    // ignore
  }
}

function updateColorSwatches() {
  [fields.color1, fields.color2, fields.solidColor].forEach((inp) => {
    if (inp) updateColorSwatch(inp);
  });
}

function updateBgToggleButtons() {
  if (!fields.bgGradientBtn || !fields.bgSolidBtn || !fields.backgroundType) return;
  const val = fields.backgroundType.value;
  fields.bgGradientBtn.classList.toggle('active', val === 'gradient');
  fields.bgSolidBtn.classList.toggle('active', val === 'solid');
  fields.bgGradientBtn.setAttribute('aria-pressed', String(val === 'gradient'));
  fields.bgSolidBtn.setAttribute('aria-pressed', String(val === 'solid'));
}

function updateGradientToggleButtons() {
  if (!fields.gradientLinearBtn || !fields.gradientRadialBtn || !fields.gradientStyle) return;
  const val = fields.gradientStyle.value;
  fields.gradientLinearBtn.classList.toggle('active', val === 'linear');
  fields.gradientRadialBtn.classList.toggle('active', val === 'radial');
  fields.gradientLinearBtn.setAttribute('aria-pressed', String(val === 'linear'));
  fields.gradientRadialBtn.setAttribute('aria-pressed', String(val === 'radial'));
}

function updateOrientationButtons() {
  if (!fields.orient0) return;
  const val = fields.gradientOrientation?.value || '';
  [fields.orient0, fields.orient45, fields.orient90, fields.orient135].forEach((btn) => {
    if (!btn) return;
    btn.classList.toggle('active', btn.dataset.value === val);
    btn.setAttribute('aria-pressed', String(btn.dataset.value === val));
  });
}
