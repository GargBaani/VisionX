import { getFontStack } from "../../shared/settings";
import type { VisionXSettings } from "../../shared/types";

const STYLE_ID = "visionx-readability-style";

function ensureStyleElement(): HTMLStyleElement {
  const existing = document.getElementById(STYLE_ID);
  if (existing instanceof HTMLStyleElement) {
    return existing;
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;
  document.documentElement.appendChild(style);
  return style;
}

export function applyReadabilityStyles(settings: VisionXSettings): void {
  const style = ensureStyleElement();
  const root = document.documentElement;

  root.classList.toggle("visionx-enabled", settings.enabled);
  root.classList.toggle("visionx-readable", settings.enabled && settings.readabilityMode);

  if (!settings.enabled || !settings.readabilityMode) {
    style.textContent = "";
    return;
  }

  const fontStack = getFontStack(settings.fontPreset);
  const scaleFactor = settings.fontScale / 100;

  style.textContent = `
    html.visionx-enabled.visionx-readable body {
      text-rendering: optimizeLegibility;
      -webkit-font-smoothing: antialiased;
      accent-color: #0f766e;
    }

    html.visionx-enabled.visionx-readable body :where(
      p, li, blockquote, dd, dt, figcaption, article, main, section,
      h1, h2, h3, h4, h5, h6, a, span, label, button, input, textarea, select
    ) {
      font-family: ${fontStack} !important;
    }

    html.visionx-enabled.visionx-readable body :where(p, li, blockquote, dd, dt, figcaption, td, th) {
      font-size: calc(1em * ${scaleFactor.toFixed(2)}) !important;
      line-height: ${settings.lineHeight} !important;
      letter-spacing: 0.01em !important;
      word-spacing: 0.05em !important;
      margin-top: 0.55em !important;
      margin-bottom: 0.85em !important;
    }

    html.visionx-enabled.visionx-readable body :where(
      article, main, [role="main"], p, li, blockquote, figure, figcaption
    ) {
      max-width: min(100%, ${settings.maxWidth}px) !important;
    }

    html.visionx-enabled.visionx-readable body :where(article, main, [role="main"]) {
      margin-inline: auto !important;
    }

    html.visionx-enabled.visionx-readable body :where(a, button, input, textarea, select) {
      line-height: 1.5 !important;
    }
  `;
}

export function clearReadabilityStyles(): void {
  document.documentElement.classList.remove("visionx-enabled", "visionx-readable");
  const style = document.getElementById(STYLE_ID);
  if (style) {
    style.remove();
  }
}
