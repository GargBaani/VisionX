import { getFontStack } from "../../shared/settings";
import type { VisionXSettings } from "../../shared/types";
import { findPrimaryContentRoot, sanitizeContentClone } from "./contentExtractor";

export class ReaderModeManager {
  private overlay: HTMLElement | null = null;
  private currentSettings: VisionXSettings | null = null;

  constructor(private readonly onClose: () => void) {}

  open(settings: VisionXSettings): void {
    this.currentSettings = settings;
    const source = findPrimaryContentRoot();
    const cleaned = sanitizeContentClone(source);

    if (!cleaned.textContent?.replace(/\s+/g, " ").trim()) {
      return;
    }

    const overlay = this.ensureOverlay();
    const titleElement = overlay.querySelector<HTMLElement>(".visionx-reader-title");
    const contentElement = overlay.querySelector<HTMLElement>(".visionx-reader-content");
    if (!titleElement || !contentElement) {
      return;
    }

    titleElement.textContent = document.title || "Reader mode";
    contentElement.replaceChildren(...Array.from(cleaned.childNodes));
    overlay.style.setProperty("--visionx-reader-width", `${settings.maxWidth}px`);
    overlay.style.setProperty("--visionx-reader-font", getFontStack(settings.fontPreset));

    if (!overlay.isConnected) {
      document.body.appendChild(overlay);
    }

    document.documentElement.classList.add("visionx-reader-lock");
    document.body.classList.add("visionx-reader-lock");
  }

  close(): void {
    this.overlay?.remove();
    this.overlay = null;
    document.documentElement.classList.remove("visionx-reader-lock");
    document.body.classList.remove("visionx-reader-lock");
  }

  isOpen(): boolean {
    return Boolean(this.overlay?.isConnected);
  }

  private ensureOverlay(): HTMLElement {
    if (this.overlay) {
      return this.overlay;
    }

    const overlay = document.createElement("div");
    overlay.id = "visionx-reader-overlay";
    overlay.setAttribute("data-visionx-ui", "true");
    overlay.innerHTML = `
      <div class="visionx-reader-shell">
        <div class="visionx-reader-topbar">
          <div>
            <p class="visionx-reader-eyebrow">VisionX Reader Mode</p>
            <h1 class="visionx-reader-title"></h1>
          </div>
          <div class="visionx-reader-actions">
            <button type="button" class="visionx-reader-button" data-action="refresh">Refresh</button>
            <button type="button" class="visionx-reader-button" data-action="close">Close</button>
          </div>
        </div>
        <div class="visionx-reader-content"></div>
      </div>
    `;

    overlay
      .querySelector<HTMLButtonElement>("[data-action='refresh']")
      ?.addEventListener("click", () => {
        if (this.currentSettings) {
          this.open(this.currentSettings);
        }
      });

    overlay
      .querySelector<HTMLButtonElement>("[data-action='close']")
      ?.addEventListener("click", () => {
        this.close();
        this.onClose();
      });

    this.overlay = overlay;
    return overlay;
  }
}
