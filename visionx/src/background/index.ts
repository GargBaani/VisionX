import type { VisionXMessage, VisionXResponse } from "../shared/messages";
import { getSettings, saveSettings, normalizeSettings } from "../shared/settings";

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
  (message: VisionXMessage, _sender, sendResponse: (response: VisionXResponse) => void) => {
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
