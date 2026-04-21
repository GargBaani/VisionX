import type { VisionXMessage } from "./messages";

export async function storageGet<T>(
  area: "sync" | "local",
  key: string
): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    chrome.storage[area].get(key, (result) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(result[key] as T | undefined);
    });
  });
}

export async function storageSet(
  area: "sync" | "local",
  values: Record<string, unknown>
): Promise<void> {
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

export async function queryActiveTab(): Promise<chrome.tabs.Tab | undefined> {
  return new Promise((resolve, reject) => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(tabs[0]);
    });
  });
}

export async function sendMessageToTab<T>(
  tabId: number,
  message: VisionXMessage
): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, message, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
        return;
      }

      resolve(response as T | undefined);
    });
  });
}
