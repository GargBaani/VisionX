interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

const CANDIDATE_SELECTOR = "p, span, a, li, div, button, label, input, textarea, h1, h2, h3, h4, h5, h6, td, th";

function parseColor(value: string): RGBA | null {
  const normalized = value.trim().toLowerCase();
  if (!normalized) {
    return null;
  }

  if (normalized === "transparent") {
    return { r: 255, g: 255, b: 255, a: 0 };
  }

  const rgbMatch = normalized.match(
    /^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d*\.?\d+))?\)$/
  );

  if (!rgbMatch) {
    return null;
  }

  return {
    r: Number(rgbMatch[1]),
    g: Number(rgbMatch[2]),
    b: Number(rgbMatch[3]),
    a: rgbMatch[4] ? Number(rgbMatch[4]) : 1
  };
}

function resolveBackgroundColor(element: HTMLElement): RGBA {
  let current: HTMLElement | null = element;

  while (current) {
    const parsed = parseColor(window.getComputedStyle(current).backgroundColor);
    if (parsed && parsed.a > 0) {
      return parsed;
    }
    current = current.parentElement;
  }

  const bodyBackground = parseColor(window.getComputedStyle(document.body).backgroundColor);
  return bodyBackground && bodyBackground.a > 0
    ? bodyBackground
    : { r: 255, g: 255, b: 255, a: 1 };
}

function luminance(color: RGBA): number {
  const normalize = (channel: number) => {
    const value = channel / 255;
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  };

  return 0.2126 * normalize(color.r) + 0.7152 * normalize(color.g) + 0.0722 * normalize(color.b);
}

function contrastRatio(foreground: RGBA, background: RGBA): number {
  const lighter = Math.max(luminance(foreground), luminance(background));
  const darker = Math.min(luminance(foreground), luminance(background));
  return (lighter + 0.05) / (darker + 0.05);
}

function storeOriginalStyle(element: HTMLElement): void {
  if (element.dataset.visionxOriginalColor === undefined) {
    element.dataset.visionxOriginalColor = element.style.color || "__unset__";
  }

  if (element.dataset.visionxOriginalBackground === undefined) {
    element.dataset.visionxOriginalBackground = element.style.backgroundColor || "__unset__";
  }
}

function restoreManagedStyle(element: HTMLElement): void {
  if (element.dataset.visionxOriginalColor !== undefined) {
    const originalColor = element.dataset.visionxOriginalColor;
    if (originalColor === "__unset__") {
      element.style.removeProperty("color");
    } else {
      element.style.color = originalColor;
    }
    delete element.dataset.visionxOriginalColor;
  }

  if (element.dataset.visionxOriginalBackground !== undefined) {
    const originalBackground = element.dataset.visionxOriginalBackground;
    if (originalBackground === "__unset__") {
      element.style.removeProperty("background-color");
    } else {
      element.style.backgroundColor = originalBackground;
    }
    delete element.dataset.visionxOriginalBackground;
  }
}

function isMeaningfulTextElement(element: HTMLElement): boolean {
  if (element.closest("[data-visionx-ui='true']")) {
    return false;
  }

  const style = window.getComputedStyle(element);
  if (
    style.display === "none" ||
    style.visibility === "hidden" ||
    Number(style.opacity) === 0 ||
    style.position === "fixed"
  ) {
    return false;
  }

  const text = (element.innerText || "").replace(/\s+/g, " ").trim();
  if (text.length < 3) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function toCssColor(color: RGBA): string {
  return `rgb(${Math.round(color.r)}, ${Math.round(color.g)}, ${Math.round(color.b)})`;
}

function pickBetterContrast(element: HTMLElement): void {
  const style = window.getComputedStyle(element);
  const foreground = parseColor(style.color);
  if (!foreground) {
    return;
  }

  const background = resolveBackgroundColor(element);
  const currentContrast = contrastRatio(foreground, background);
  if (currentContrast >= 4.5) {
    restoreManagedStyle(element);
    return;
  }

  const candidates = [
    { text: { r: 17, g: 24, b: 39, a: 1 } },
    { text: { r: 255, g: 255, b: 255, a: 1 } },
    {
      text: { r: 17, g: 24, b: 39, a: 1 },
      background: { r: 255, g: 255, b: 255, a: 1 }
    },
    {
      text: { r: 255, g: 255, b: 255, a: 1 },
      background: { r: 17, g: 24, b: 39, a: 1 }
    }
  ];

  const bestCandidate = candidates
    .map((candidate) => {
      const activeBackground = candidate.background ?? background;
      return {
        ...candidate,
        score: contrastRatio(candidate.text, activeBackground)
      };
    })
    .sort((left, right) => right.score - left.score)[0];

  storeOriginalStyle(element);
  element.style.color = toCssColor(bestCandidate.text);

  if (bestCandidate.background && style.backgroundImage === "none") {
    element.style.backgroundColor = toCssColor(bestCandidate.background);
  }
}

export class ContrastManager {
  private observer: MutationObserver | null = null;
  private enabled = false;
  private scheduled = false;

  enable(): void {
    if (this.enabled) {
      this.processPage();
      return;
    }

    this.enabled = true;
    this.processPage();
    this.observer = new MutationObserver(() => {
      if (this.scheduled) {
        return;
      }

      this.scheduled = true;
      window.requestAnimationFrame(() => {
        this.scheduled = false;
        if (this.enabled) {
          this.processPage();
        }
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  disable(): void {
    this.enabled = false;
    this.observer?.disconnect();
    this.observer = null;

    document
      .querySelectorAll<HTMLElement>("[data-visionx-original-color], [data-visionx-original-background]")
      .forEach((element) => restoreManagedStyle(element));
  }

  processPage(): void {
    const elements = Array.from(document.body.querySelectorAll<HTMLElement>(CANDIDATE_SELECTOR));
    for (const element of elements) {
      if (isMeaningfulTextElement(element)) {
        pickBetterContrast(element);
      }
    }
  }
}
