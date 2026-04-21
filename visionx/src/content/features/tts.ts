import type { VisionXSettings } from "../../shared/types";
import { findPrimaryContentRoot, getReadableBlocks } from "./contentExtractor";

interface ReadableBlock {
  element: HTMLElement;
  text: string;
}

export class TTSManager {
  private queue: ReadableBlock[] = [];
  private currentIndex = -1;
  private activeElement: HTMLElement | null = null;
  private currentSettings: VisionXSettings | null = null;
  private speaking = false;
  private paused = false;

  play(settings: VisionXSettings): void {
    if (!("speechSynthesis" in window)) {
      throw new Error("Speech synthesis is not available in this browser.");
    }

    this.stop();
    this.currentSettings = settings;

    const selection = window.getSelection()?.toString().trim();
    if (selection) {
      this.playFreeText(selection);
      return;
    }

    const root =
      document.querySelector<HTMLElement>("#visionx-reader-overlay .visionx-reader-content") ??
      findPrimaryContentRoot();

    this.queue = getReadableBlocks(root)
      .slice(0, 120)
      .map((element) => ({
        element,
        text: (element.textContent || "").replace(/\s+/g, " ").trim()
      }))
      .filter((item) => item.text.length > 20);

    if (!this.queue.length) {
      throw new Error("No readable content was found on this page.");
    }

    this.speaking = true;
    this.paused = false;
    this.currentIndex = 0;
    this.speakCurrentBlock();
  }

  pause(): void {
    if (!this.speaking || !window.speechSynthesis.speaking) {
      return;
    }

    this.paused = true;
    window.speechSynthesis.pause();
  }

  resume(): void {
    if (window.speechSynthesis.paused) {
      this.paused = false;
      window.speechSynthesis.resume();
      return;
    }

    if (this.currentSettings && !window.speechSynthesis.speaking && !this.speaking) {
      this.play(this.currentSettings);
    }
  }

  stop(): void {
    this.speaking = false;
    this.paused = false;
    this.queue = [];
    this.currentIndex = -1;
    window.speechSynthesis.cancel();
    this.clearHighlight();
  }

  destroy(): void {
    this.stop();
  }

  private playFreeText(text: string): void {
    if (!this.currentSettings) {
      return;
    }

    this.speaking = true;
    this.paused = false;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.currentSettings.speechRate;
    utterance.onend = () => {
      this.stop();
    };
    utterance.onerror = () => {
      this.stop();
    };
    window.speechSynthesis.speak(utterance);
  }

  private speakCurrentBlock(): void {
    if (!this.speaking || !this.currentSettings) {
      return;
    }

    const block = this.queue[this.currentIndex];
    if (!block) {
      this.stop();
      return;
    }

    this.highlight(block.element);

    const utterance = new SpeechSynthesisUtterance(block.text);
    utterance.rate = this.currentSettings.speechRate;
    utterance.onend = () => {
      this.clearHighlight(block.element);
      if (!this.speaking || this.paused) {
        return;
      }

      this.currentIndex += 1;
      this.speakCurrentBlock();
    };

    utterance.onerror = () => {
      this.clearHighlight(block.element);
      if (!this.speaking) {
        return;
      }

      this.currentIndex += 1;
      this.speakCurrentBlock();
    };

    window.speechSynthesis.speak(utterance);
  }

  private highlight(element: HTMLElement): void {
    this.clearHighlight();
    this.activeElement = element;
    element.setAttribute("data-visionx-tts-active", "true");
    element.scrollIntoView({ behavior: "smooth", block: "center" });
  }

  private clearHighlight(target?: HTMLElement): void {
    const element = target ?? this.activeElement;
    if (element) {
      element.removeAttribute("data-visionx-tts-active");
    }

    if (!target) {
      this.activeElement = null;
    }
  }
}
