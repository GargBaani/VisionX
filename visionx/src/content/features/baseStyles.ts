const STYLE_ID = "visionx-runtime-style";

export function ensureRuntimeStyles(): void {
  if (document.getElementById(STYLE_ID)) {
    return;
  }

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
    html.visionx-reader-lock,
    body.visionx-reader-lock {
      overflow: hidden !important;
    }

    #visionx-reader-overlay {
      position: fixed;
      inset: 0;
      z-index: 2147483646;
      overflow: auto;
      background:
        radial-gradient(circle at top left, rgba(217, 243, 239, 0.92), transparent 40%),
        rgba(247, 243, 234, 0.96);
      backdrop-filter: blur(14px);
      padding: 24px;
      color: #12263a;
    }

    #visionx-reader-overlay * {
      box-sizing: border-box;
    }

    .visionx-reader-shell {
      width: min(100%, 1120px);
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.96);
      border: 1px solid rgba(18, 38, 58, 0.08);
      border-radius: 24px;
      box-shadow: 0 18px 60px rgba(18, 38, 58, 0.14);
      overflow: hidden;
    }

    .visionx-reader-topbar {
      position: sticky;
      top: 0;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      padding: 20px 24px;
      background: rgba(255, 255, 255, 0.92);
      border-bottom: 1px solid rgba(18, 38, 58, 0.08);
      backdrop-filter: blur(10px);
    }

    .visionx-reader-eyebrow {
      margin: 0 0 6px;
      font: 700 12px/1.2 "Segoe UI", Verdana, sans-serif;
      letter-spacing: 0.12em;
      text-transform: uppercase;
      color: #0f766e;
    }

    .visionx-reader-title {
      margin: 0;
      font-size: clamp(1.3rem, 2vw, 2rem);
      line-height: 1.2;
      color: #12263a;
    }

    .visionx-reader-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }

    .visionx-reader-button {
      appearance: none;
      border: 1px solid rgba(18, 38, 58, 0.12);
      background: #ffffff;
      color: #12263a;
      padding: 10px 14px;
      border-radius: 999px;
      cursor: pointer;
      font: 600 14px/1 "Segoe UI", Verdana, sans-serif;
    }

    .visionx-reader-button:hover {
      border-color: rgba(15, 118, 110, 0.35);
      background: #f3fbfa;
    }

    .visionx-reader-content {
      width: min(100%, var(--visionx-reader-width, 820px));
      margin: 0 auto;
      padding: 32px 24px 56px;
      font-family: var(--visionx-reader-font, "Segoe UI", Verdana, sans-serif);
      color: #12263a;
    }

    .visionx-reader-content :where(h1, h2, h3, h4) {
      line-height: 1.18;
      margin: 1.2em 0 0.5em;
      color: #102033;
    }

    .visionx-reader-content :where(p, li, blockquote, figcaption, td, th) {
      font-size: 1.12rem;
      line-height: 1.9;
      margin: 0.55em 0 0.9em;
    }

    .visionx-reader-content :where(ul, ol) {
      padding-left: 1.35rem;
    }

    .visionx-reader-content :where(img) {
      max-width: 100%;
      height: auto;
      border-radius: 18px;
      margin: 1.25rem 0;
    }

    .visionx-reader-content :where(blockquote) {
      margin: 1rem 0;
      padding: 0.5rem 0 0.5rem 1rem;
      border-left: 4px solid rgba(15, 118, 110, 0.4);
      color: #20405e;
      background: rgba(217, 243, 239, 0.24);
      border-radius: 0 12px 12px 0;
    }

    [data-visionx-tts-active="true"] {
      outline: 3px solid rgba(15, 118, 110, 0.4) !important;
      background: rgba(217, 243, 239, 0.42) !important;
      border-radius: 12px;
      scroll-margin-top: 120px;
      transition: background-color 140ms ease;
    }
  `;

  document.documentElement.appendChild(style);
}
