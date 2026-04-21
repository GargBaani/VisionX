"use strict";
(() => {
  // src/shared/chrome.ts
  async function storageGet(area, key) {
    return new Promise((resolve, reject) => {
      chrome.storage[area].get(key, (result) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve(result[key]);
      });
    });
  }
  async function storageSet(area, values) {
    return new Promise((resolve, reject) => {
      chrome.storage[area].set(values, () => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        resolve();
      });
    });
  }

  // src/shared/settings.ts
  var SETTINGS_STORAGE_KEY = "visionx.settings";
  var defaultSettings = {
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
  var clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  function normalizeSettings(value) {
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
  function normalizeFontPreset(value) {
    if (value === "readingSerif" || value === "dyslexiaFriendly") {
      return value;
    }
    return "accessibleSans";
  }
  async function getSettings() {
    const stored = await storageGet("sync", SETTINGS_STORAGE_KEY);
    return normalizeSettings(stored);
  }
  async function saveSettings(settings) {
    const normalized = normalizeSettings(settings);
    await storageSet("sync", { [SETTINGS_STORAGE_KEY]: normalized });
    return normalized;
  }

  // src/background/index.ts
  async function ensureSettings() {
    const settings = await getSettings();
    await saveSettings(normalizeSettings(settings));
  }
  chrome.runtime.onInstalled.addListener(() => {
    void ensureSettings();
  });
  chrome.runtime.onStartup.addListener(() => {
    void ensureSettings();
  });
  chrome.runtime.onMessage.addListener(
    (message, _sender, sendResponse) => {
      if (message.type !== "VISIONX_OPEN_REPORT_PAGE") {
        return false;
      }
      chrome.tabs.create({ url: chrome.runtime.getURL("report.html") }, () => {
        if (chrome.runtime.lastError) {
          sendResponse({ ok: false, message: chrome.runtime.lastError.message });
          return;
        }
        sendResponse({ ok: true });
      });
      return true;
    }
  );
})();
