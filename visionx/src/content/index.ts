import type { VisionXMessage, VisionXResponse } from "../shared/messages";
import type { VisionXSettings } from "../shared/types";
import { saveLatestReport } from "../shared/report";
import {
  SETTINGS_STORAGE_KEY,
  getSettings,
  normalizeSettings,
  saveSettings
} from "../shared/settings";
import { ensureRuntimeStyles } from "./features/baseStyles";
import { ContrastManager } from "./features/contrast";
import { applyReadabilityStyles, clearReadabilityStyles } from "./features/readability";
import { ReaderModeManager } from "./features/readerMode";
import { runAccessibilityScan } from "./features/scanner";
import { TTSManager } from "./features/tts";

class VisionXController {
  private settings: VisionXSettings = normalizeSettings();
  private readonly contrastManager = new ContrastManager();
  private readonly ttsManager = new TTSManager();
  private readonly readerModeManager = new ReaderModeManager(() => {
    void saveSettings({ ...this.settings, readerMode: false });
  });

  async init(): Promise<void> {
    ensureRuntimeStyles();
    this.settings = await getSettings();
    this.applySettings(this.settings);

    chrome.runtime.onMessage.addListener(
      (
        message: VisionXMessage,
        _sender,
        sendResponse: (response: VisionXResponse) => void
      ) => {
        void this.handleMessage(message)
          .then(sendResponse)
          .catch((error) => {
            const messageText = error instanceof Error ? error.message : "Unexpected error";
            sendResponse({ ok: false, message: messageText });
          });

        return true;
      }
    );

    chrome.storage.onChanged.addListener((changes, area) => {
      if (area !== "sync" || !changes[SETTINGS_STORAGE_KEY]) {
        return;
      }

      const nextSettings = normalizeSettings(
        changes[SETTINGS_STORAGE_KEY].newValue as Partial<VisionXSettings>
      );
      this.applySettings(nextSettings);
    });

    window.addEventListener("beforeunload", () => {
      this.destroy();
    });
  }

  private async handleMessage(message: VisionXMessage): Promise<VisionXResponse> {
    switch (message.type) {
      case "VISIONX_APPLY_SETTINGS": {
        this.applySettings(message.settings);
        return { ok: true, settings: this.settings };
      }
      case "VISIONX_TTS_PLAY": {
        this.ttsManager.play(this.settings);
        return { ok: true };
      }
      case "VISIONX_TTS_PAUSE": {
        this.ttsManager.pause();
        return { ok: true };
      }
      case "VISIONX_TTS_RESUME": {
        this.ttsManager.resume();
        return { ok: true };
      }
      case "VISIONX_TTS_STOP": {
        this.ttsManager.stop();
        return { ok: true };
      }
      case "VISIONX_SCAN_PAGE": {
        const report = await runAccessibilityScan();
        await saveLatestReport(report);
        return { ok: true, report };
      }
      default:
        return { ok: false, message: "Unsupported VisionX action." };
    }
  }

  private applySettings(settings: VisionXSettings): void {
    this.settings = normalizeSettings(settings);

    applyReadabilityStyles(this.settings);

    if (!this.settings.enabled) {
      this.contrastManager.disable();
      this.readerModeManager.close();
      this.ttsManager.stop();
      clearReadabilityStyles();
      return;
    }

    if (this.settings.contrastMode) {
      this.contrastManager.enable();
    } else {
      this.contrastManager.disable();
    }

    if (this.settings.readerMode) {
      this.readerModeManager.open(this.settings);
    } else {
      this.readerModeManager.close();
    }
  }

  private destroy(): void {
    this.contrastManager.disable();
    this.readerModeManager.close();
    this.ttsManager.destroy();
  }
}

const controller = new VisionXController();
void controller.init();
