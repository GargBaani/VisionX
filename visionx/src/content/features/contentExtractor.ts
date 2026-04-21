const PREFERRED_ROOT_SELECTORS = [
  "article",
  "main",
  "[role='main']",
  ".article",
  ".article-body",
  ".post",
  ".post-content",
  ".entry-content",
  ".content",
  ".main-content",
  "#content"
];

const REMOVAL_SELECTORS = [
  "script",
  "style",
  "noscript",
  "iframe",
  "canvas",
  "video",
  "audio",
  "form",
  "button",
  "input",
  "textarea",
  "select",
  "nav",
  "aside",
  "footer",
  "[role='navigation']",
  "[hidden]",
  "[aria-hidden='true']",
  ".advertisement",
  ".ads",
  ".share",
  ".social",
  "[data-visionx-ui='true']"
].join(", ");

function getVisibleTextLength(element: HTMLElement): number {
  return (element.innerText || "").replace(/\s+/g, " ").trim().length;
}

function isVisible(element: HTMLElement): boolean {
  const style = window.getComputedStyle(element);
  if (style.display === "none" || style.visibility === "hidden" || Number(style.opacity) === 0) {
    return false;
  }

  const rect = element.getBoundingClientRect();
  return rect.width > 0 && rect.height > 0;
}

function countNodes(element: HTMLElement, selector: string): number {
  return element.querySelectorAll(selector).length;
}

function getLinkDensity(element: HTMLElement): number {
  const textLength = Math.max(getVisibleTextLength(element), 1);
  const linkText = Array.from(element.querySelectorAll("a")).reduce((total, link) => {
    return total + (link.textContent || "").replace(/\s+/g, " ").trim().length;
  }, 0);

  return linkText / textLength;
}

function scoreCandidate(element: HTMLElement): number {
  const textLength = getVisibleTextLength(element);
  if (textLength < 250 || !isVisible(element)) {
    return Number.NEGATIVE_INFINITY;
  }

  const paragraphs = countNodes(element, "p");
  const headings = countNodes(element, "h1, h2, h3, h4");
  const images = countNodes(element, "img");
  const controls = countNodes(element, "button, input, select, textarea, nav, aside, form");
  const linkDensity = getLinkDensity(element);

  return (
    textLength +
    paragraphs * 180 +
    headings * 120 +
    images * 35 -
    controls * 240 -
    linkDensity * 500
  );
}

export function findPrimaryContentRoot(doc: Document = document): HTMLElement {
  for (const selector of PREFERRED_ROOT_SELECTORS) {
    const matches = Array.from(doc.querySelectorAll<HTMLElement>(selector)).filter(
      (element) => !element.closest("[data-visionx-ui='true']") && isVisible(element)
    );

    const preferred = matches.find((element) => getVisibleTextLength(element) > 250);
    if (preferred) {
      return preferred;
    }
  }

  const candidates = Array.from(doc.querySelectorAll<HTMLElement>("article, main, section, div")).filter(
    (element) => !element.closest("[data-visionx-ui='true']")
  );

  let bestElement: HTMLElement = doc.body;
  let bestScore = Number.NEGATIVE_INFINITY;

  for (const element of candidates) {
    const score = scoreCandidate(element);
    if (score > bestScore) {
      bestScore = score;
      bestElement = element;
    }
  }

  return bestElement;
}

function keepAttribute(tagName: string, attributeName: string): boolean {
  if (tagName === "a") {
    return attributeName === "href";
  }

  if (tagName === "img") {
    return ["src", "alt", "srcset", "sizes"].includes(attributeName);
  }

  return false;
}

export function sanitizeContentClone(source: HTMLElement): HTMLElement {
  const clone = source.cloneNode(true) as HTMLElement;
  clone.querySelectorAll(REMOVAL_SELECTORS).forEach((node) => node.remove());

  const elements = Array.from(clone.querySelectorAll<HTMLElement>("*"));
  for (const element of elements) {
    if (element.matches(REMOVAL_SELECTORS)) {
      element.remove();
      continue;
    }

    if (getLinkDensity(element) > 0.75 && getVisibleTextLength(element) < 200) {
      element.remove();
      continue;
    }

    const tagName = element.tagName.toLowerCase();
    for (const attribute of Array.from(element.attributes)) {
      if (!keepAttribute(tagName, attribute.name)) {
        element.removeAttribute(attribute.name);
      }
    }

    if (
      !element.children.length &&
      !element.textContent?.replace(/\s+/g, " ").trim() &&
      tagName !== "img"
    ) {
      element.remove();
    }
  }

  return clone;
}

export function getReadableBlocks(root?: ParentNode): HTMLElement[] {
  const scope =
    root ??
    document.querySelector<HTMLElement>("#visionx-reader-overlay .visionx-reader-content") ??
    findPrimaryContentRoot();

  return Array.from(
    scope.querySelectorAll<HTMLElement>("h1, h2, h3, h4, h5, h6, p, li, blockquote, figcaption")
  ).filter((element) => {
    if (element.closest("[data-visionx-ui='true']") && !element.closest("#visionx-reader-overlay")) {
      return false;
    }

    return (element.textContent || "").replace(/\s+/g, " ").trim().length > 20;
  });
}
