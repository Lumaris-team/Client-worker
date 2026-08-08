import { ensureSessionToken } from "/lib/auth.js";

const STORAGE_KEY = "dashboard_settings";
const DEFAULT_SETTINGS = {
  backgroundType: "gradient",
  gradientStyle: "linear",
  gradientOrientation: "135deg",
  color1: "#0b3f91",
  color2: "#1c8cff",
  solidColor: "#08100f",
  fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  fontWeight: "500",
  fontSize: 16,
};

export const FONT_PRESETS = {
  system: "system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
  inter: "Inter, ui-sans-serif, system-ui, sans-serif",
  ibm: "'IBM Plex Sans', ui-sans-serif, system-ui, sans-serif",
  poppins: "'Poppins', ui-sans-serif, system-ui, sans-serif",
  jetbrains: "'JetBrains Mono', ui-monospace, monospace",
  lora: "'Lora', Georgia, serif",
};

const ORIENTATIONS = [
  "0deg",
  "45deg",
  "90deg",
  "135deg",
  "180deg",
  "225deg",
  "270deg",
  "315deg",
];

const GRADIENT_STYLES = ["linear", "radial"];
const BACKGROUND_TYPES = ["gradient", "solid"];

function normalizeSettings(settings = {}) {
  const cleaned = {
    backgroundType: BACKGROUND_TYPES.includes(settings.backgroundType) ? settings.backgroundType : DEFAULT_SETTINGS.backgroundType,
    gradientStyle: GRADIENT_STYLES.includes(settings.gradientStyle) ? settings.gradientStyle : DEFAULT_SETTINGS.gradientStyle,
    gradientOrientation: ORIENTATIONS.includes(settings.gradientOrientation)
      ? settings.gradientOrientation
      : DEFAULT_SETTINGS.gradientOrientation,
    color1: typeof settings.color1 === "string" ? settings.color1 : DEFAULT_SETTINGS.color1,
    color2: typeof settings.color2 === "string" ? settings.color2 : DEFAULT_SETTINGS.color2,
    solidColor: typeof settings.solidColor === "string" ? settings.solidColor : DEFAULT_SETTINGS.solidColor,
    fontFamily: typeof settings.fontFamily === "string" ? settings.fontFamily : DEFAULT_SETTINGS.fontFamily,
    fontWeight: ["400", "500", "600", "700", "800"].includes(settings.fontWeight)
      ? settings.fontWeight
      : DEFAULT_SETTINGS.fontWeight,
    fontSize:
      typeof settings.fontSize === "number" && settings.fontSize >= 14 && settings.fontSize <= 28
        ? settings.fontSize
        : DEFAULT_SETTINGS.fontSize,
  };
  return cleaned;
}

export function loadSettings() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return normalizeSettings(JSON.parse(raw));
  } catch (error) {
    console.warn("Failed to parse saved settings:", error);
    return DEFAULT_SETTINGS;
  }
}

export function defaultSettings() {
  return normalizeSettings(DEFAULT_SETTINGS);
}

export function saveSettings(settings) {
  const normalized = normalizeSettings(settings);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized));
  } catch (error) {
    console.warn("Unable to save settings locally:", error);
  }
  applyThemeSettings(normalized);
  return normalized;
}

export function applyThemeSettings(settings) {
  const normalized = normalizeSettings(settings);
  const body = document.body;
  const root = document.documentElement;

  const background =
    normalized.backgroundType === "solid"
      ? normalized.solidColor
      : normalized.gradientStyle === "radial"
      ? `radial-gradient(circle at center, ${normalized.color1} 0%, ${normalized.color2} 100%)`
      : `linear-gradient(${normalized.gradientOrientation}, ${normalized.color1} 0%, ${normalized.color2} 100%)`;

  root.style.setProperty("--theme-background", background);
  root.style.setProperty("--theme-font-family", normalized.fontFamily);
  root.style.setProperty("--theme-font-weight", normalized.fontWeight);
  root.style.setProperty("--theme-font-size", `${normalized.fontSize}px`);
  root.style.setProperty("--theme-accent", normalized.color1);
  root.style.setProperty("--theme-accent-strong", normalized.color2);

  body.style.background = background;
  body.style.color = "#f2f9ff";
  body.style.fontFamily = normalized.fontFamily;
  body.style.fontWeight = normalized.fontWeight;
  body.style.fontSize = `${normalized.fontSize}px`;
  body.style.backgroundAttachment = "fixed";
  body.style.backgroundRepeat = "no-repeat";
  body.style.backgroundSize = "cover";
}

export async function fetchRemoteSettings() {
  const token = await ensureSessionToken();
  if (!token) return null;

  try {
    const response = await fetch("/api/settings/customization", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const data = payload?.resp?.settings ?? payload?.settings ?? null;
    if (!data || typeof data !== "object") return null;
    
    // Convert backend format (background_ prefixed) to frontend format
    const converted = {
      backgroundType: data.background_type || "gradient",
      gradientStyle: data.background_gradient_style || "linear",
      gradientOrientation: data.background_gradient_orientation || "135deg",
      color1: data.background_color_1 || "#0b3f91",
      color2: data.background_color_2 || "#1c8cff",
      solidColor: data.background_solid_color || "#08100f",
      fontFamily: data.background_font_family || "Inter, ui-sans-serif, system-ui, sans-serif",
      fontWeight: data.background_font_weight || "500",
      fontSize: data.background_font_size || 16,
    };
    
    return normalizeSettings(converted);
  } catch (error) {
    console.warn("Unable to fetch remote settings:", error);
    return null;
  }
}

export async function saveRemoteSettings(settings) {
  const token = await ensureSessionToken();
  if (!token) return null;

  try {
    const normalized = normalizeSettings(settings);
    
    // Convert frontend format to backend format (background_ prefixed)
    const converted = {
      background_type: normalized.backgroundType,
      background_gradient_style: normalized.gradientStyle,
      background_gradient_orientation: normalized.gradientOrientation,
      background_color_1: normalized.color1,
      background_color_2: normalized.color2,
      background_solid_color: normalized.solidColor,
      background_font_family: normalized.fontFamily,
      background_font_weight: normalized.fontWeight,
      background_font_size: normalized.fontSize,
    };
    
    const response = await fetch("/api/settings/customization", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ settings: converted }),
    });
    if (!response.ok) return null;
    const payload = await response.json();
    return payload?.resp?.settings ?? payload?.settings ?? null;
  } catch (error) {
    console.warn("Unable to save remote settings:", error);
    return null;
  }
}

const stored = loadSettings();
applyThemeSettings(stored);

(async () => {
  const remote = await fetchRemoteSettings();
  if (remote) {
    saveSettings(remote);
  }
})();
