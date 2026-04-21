import { storageGet, storageSet } from "./chrome";
import type { FontPreset, VisionXSettings } from "./types";

export const SETTINGS_STORAGE_KEY = "visionx.settings";

export const defaultSettings: VisionXSettings = {
  enabled: true,
  readabilityMode: true,
  contrastMode: false,
  readerMode: false,
  fontScale: 114,
  lineHeight: 1.75,
  maxWidth: 820,
  speechRate: 1,
  fontPreset: "accessibleSans"
};

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

export function normalizeSettings(
  value?: Partial<VisionXSettings>
): VisionXSettings {
  const merged = { ...defaultSettings, ...value };

  return {
    enabled: Boolean(merged.enabled),
    readabilityMode: Boolean(merged.readabilityMode),
    contrastMode: Boolean(merged.contrastMode),
    readerMode: Boolean(merged.readerMode),
    fontScale: Math.round(clamp(Number(merged.fontScale) || 114, 90, 160)),
    lineHeight: Math.round(clamp(Number(merged.lineHeight) || 1.75, 1.4, 2.4) * 100) / 100,
    maxWidth: Math.round(clamp(Number(merged.maxWidth) || 820, 560, 1100)),
    speechRate: Math.round(clamp(Number(merged.speechRate) || 1, 0.7, 1.8) * 100) / 100,
    fontPreset: normalizeFontPreset(merged.fontPreset)
  };
}

function normalizeFontPreset(value?: FontPreset): FontPreset {
  if (value === "readingSerif" || value === "dyslexiaFriendly") {
    return value;
  }

  return "accessibleSans";
}

export function getFontStack(fontPreset: FontPreset): string {
  switch (fontPreset) {
    case "readingSerif":
      return "'Iowan Old Style', 'Palatino Linotype', Georgia, serif";
    case "dyslexiaFriendly":
      return "'OpenDyslexic', 'Trebuchet MS', Verdana, sans-serif";
    case "accessibleSans":
    default:
      return "'Atkinson Hyperlegible', 'Segoe UI', Verdana, sans-serif";
  }
}

export async function getSettings(): Promise<VisionXSettings> {
  const stored = await storageGet<Partial<VisionXSettings>>("sync", SETTINGS_STORAGE_KEY);
  return normalizeSettings(stored);
}

export async function saveSettings(settings: VisionXSettings): Promise<VisionXSettings> {
  const normalized = normalizeSettings(settings);
  await storageSet("sync", { [SETTINGS_STORAGE_KEY]: normalized });
  return normalized;
}
