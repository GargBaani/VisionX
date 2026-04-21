import { useEffect, useState } from "react";
import type { VisionXMessage, VisionXResponse } from "../shared/messages";
import { getLatestReport } from "../shared/report";
import { defaultSettings, normalizeSettings, saveSettings } from "../shared/settings";
import { queryActiveTab, sendMessageToTab } from "../shared/chrome";
import type { AccessibilityReport, FontPreset, VisionXSettings } from "../shared/types";

function formatHost(url?: string): string {
  if (!url) {
    return "Open any webpage to start";
  }

  try {
    return new URL(url).host;
  } catch {
    return url;
  }
}

function ControlCard({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="panel space-y-3 p-4">
      <div className="space-y-1">
        <h2 className="text-sm font-semibold uppercase tracking-[0.18em] text-vision-teal">{title}</h2>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
      {children}
    </section>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (value: boolean) => void;
}) {
  return (
    <label className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200/90 bg-white/70 px-3 py-3">
      <span className="space-y-1">
        <span className="block text-sm font-semibold text-slate-900">{label}</span>
        <span className="block text-xs leading-5 text-slate-600">{description}</span>
      </span>
      <input
        type="checkbox"
        className="mt-1 h-5 w-5 rounded border-slate-300 text-vision-teal focus:ring-vision-teal"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
    </label>
  );
}

function RangeField({
  label,
  value,
  min,
  max,
  step,
  displayValue,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  displayValue: string;
  onChange: (value: number) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="flex items-center justify-between text-sm font-medium text-slate-800">
        <span>{label}</span>
        <span className="chip">{displayValue}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-vision-teal"
      />
    </label>
  );
}

const fontPresetOptions: Array<{ value: FontPreset; label: string }> = [
  { value: "accessibleSans", label: "Accessible Sans" },
  { value: "readingSerif", label: "Reading Serif" },
  { value: "dyslexiaFriendly", label: "Dyslexia Friendly" }
];

export function App() {
  const [settings, setSettings] = useState<VisionXSettings>(defaultSettings);
  const [latestReport, setLatestReport] = useState<AccessibilityReport | null>(null);
  const [pageLabel, setPageLabel] = useState("Open any webpage to start");
  const [status, setStatus] = useState("VisionX is ready.");
  const [busyAction, setBusyAction] = useState<"scan" | "voice" | null>(null);

  useEffect(() => {
    void (async () => {
      const savedSettings = normalizeSettings(await chrome.storage.sync.get("visionx.settings").then((result) => result["visionx.settings"]));
      const report = await getLatestReport();
      const tab = await queryActiveTab();

      setSettings(savedSettings);
      setLatestReport(report);
      setPageLabel(formatHost(tab?.url));
    })();

    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "local" && changes["visionx.latestReport"]?.newValue) {
        setLatestReport(changes["visionx.latestReport"].newValue as AccessibilityReport);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  async function applySettings(next: VisionXSettings) {
    const normalized = normalizeSettings(next);
    setSettings(normalized);
    await saveSettings(normalized);

    try {
      const tab = await queryActiveTab();
      if (!tab?.id) {
        setStatus("Open a standard webpage to preview VisionX changes.");
        return;
      }

      await sendMessageToTab<VisionXResponse>(tab.id, {
        type: "VISIONX_APPLY_SETTINGS",
        settings: normalized
      });
      setStatus("Settings applied to the current page.");
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update this page.";
      setStatus(message);
    }
  }

  async function sendTabCommand(message: VisionXMessage, successText: string) {
    setBusyAction(message.type === "VISIONX_SCAN_PAGE" ? "scan" : "voice");
    try {
      const tab = await queryActiveTab();
      if (!tab?.id) {
        throw new Error("Open a standard webpage before using VisionX controls.");
      }

      const response = await sendMessageToTab<VisionXResponse>(tab.id, message);
      if (!response?.ok) {
        throw new Error(response?.message || "The page could not complete that action.");
      }

      if (response.report) {
        setLatestReport(response.report);
      }

      setStatus(successText);
    } catch (error) {
      const messageText = error instanceof Error ? error.message : "The request could not be completed.";
      setStatus(messageText);
    } finally {
      setBusyAction(null);
    }
  }

  return (
    <main className="mx-auto w-[390px] space-y-4 p-4 text-slate-900">
      <header className="panel overflow-hidden p-5">
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-vision-teal via-vision-coral to-vision-sand" />
        <div className="relative space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-vision-teal">
                VisionX
              </p>
              <h1 className="text-2xl font-semibold text-slate-900">Live Web Accessibility Controls</h1>
              <p className="text-sm leading-6 text-slate-600">{pageLabel}</p>
            </div>
            <label className="flex items-center gap-2 rounded-full bg-vision-sea px-3 py-2">
              <span className="text-sm font-semibold text-slate-900">Enable</span>
              <input
                type="checkbox"
                className="h-5 w-5 rounded border-slate-300 text-vision-teal focus:ring-vision-teal"
                checked={settings.enabled}
                onChange={(event) => void applySettings({ ...settings, enabled: event.target.checked })}
              />
            </label>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="metric-card">
              <span className="metric-label">Score</span>
              <span className="metric-value">{latestReport?.score ?? "--"}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Issues</span>
              <span className="metric-value">{latestReport?.issueCount ?? "--"}</span>
            </div>
            <div className="metric-card">
              <span className="metric-label">Passes</span>
              <span className="metric-value">{latestReport?.passCount ?? "--"}</span>
            </div>
          </div>

          <p className="rounded-2xl bg-slate-50 px-3 py-3 text-sm leading-6 text-slate-700">{status}</p>
        </div>
      </header>

      <ControlCard
        title="Readability"
        description="Scale text, line spacing, and reading width for clearer study-friendly pages."
      >
        <ToggleRow
          label="Smart readability mode"
          description="Applies a more readable font stack and relaxed spacing on the current page."
          checked={settings.readabilityMode}
          onChange={(value) => void applySettings({ ...settings, readabilityMode: value })}
        />

        <label className="space-y-2">
          <span className="text-sm font-medium text-slate-800">Font preset</span>
          <select
            value={settings.fontPreset}
            onChange={(event) =>
              void applySettings({ ...settings, fontPreset: event.target.value as FontPreset })
            }
            className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-3 text-sm text-slate-900 outline-none ring-0 transition focus:border-vision-teal"
          >
            {fontPresetOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <RangeField
          label="Font size"
          value={settings.fontScale}
          min={90}
          max={160}
          step={2}
          displayValue={`${settings.fontScale}%`}
          onChange={(value) => void applySettings({ ...settings, fontScale: value })}
        />

        <RangeField
          label="Line height"
          value={Math.round(settings.lineHeight * 100)}
          min={140}
          max={240}
          step={5}
          displayValue={settings.lineHeight.toFixed(2)}
          onChange={(value) => void applySettings({ ...settings, lineHeight: value / 100 })}
        />

        <RangeField
          label="Reading width"
          value={settings.maxWidth}
          min={560}
          max={1100}
          step={20}
          displayValue={`${settings.maxWidth}px`}
          onChange={(value) => void applySettings({ ...settings, maxWidth: value })}
        />
      </ControlCard>

      <ControlCard
        title="Page Modes"
        description="Improve contrast automatically or switch the page into distraction-free reader mode."
      >
        <ToggleRow
          label="Auto contrast fixer"
          description="Detects weak text contrast and adjusts colors toward a more accessible range."
          checked={settings.contrastMode}
          onChange={(value) => void applySettings({ ...settings, contrastMode: value })}
        />

        <ToggleRow
          label="Simplified reading mode"
          description="Extracts main content into a clean overlay and removes clutter."
          checked={settings.readerMode}
          onChange={(value) => void applySettings({ ...settings, readerMode: value })}
        />
      </ControlCard>

      <ControlCard
        title="Voice Tools"
        description="Read highlighted text or the main article aloud using browser speech synthesis."
      >
        <RangeField
          label="Speech rate"
          value={Math.round(settings.speechRate * 100)}
          min={70}
          max={180}
          step={5}
          displayValue={`${settings.speechRate.toFixed(2)}x`}
          onChange={(value) => void applySettings({ ...settings, speechRate: value / 100 })}
        />

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="action-button"
            disabled={busyAction === "voice"}
            onClick={() => void sendTabCommand({ type: "VISIONX_TTS_PLAY" }, "Voice playback started.")}
          >
            Play
          </button>
          <button
            type="button"
            className="action-button"
            disabled={busyAction === "voice"}
            onClick={() => void sendTabCommand({ type: "VISIONX_TTS_PAUSE" }, "Voice playback paused.")}
          >
            Pause
          </button>
          <button
            type="button"
            className="action-button"
            disabled={busyAction === "voice"}
            onClick={() => void sendTabCommand({ type: "VISIONX_TTS_RESUME" }, "Voice playback resumed.")}
          >
            Resume
          </button>
          <button
            type="button"
            className="action-button"
            disabled={busyAction === "voice"}
            onClick={() => void sendTabCommand({ type: "VISIONX_TTS_STOP" }, "Voice playback stopped.")}
          >
            Stop
          </button>
        </div>
      </ControlCard>

      <ControlCard
        title="Scanner"
        description="Run an accessibility scan on the active page and review the latest report."
      >
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            className="action-button"
            disabled={busyAction === "scan"}
            onClick={() =>
              void sendTabCommand(
                { type: "VISIONX_SCAN_PAGE" },
                "Accessibility scan complete. Open the report for issue details."
              )
            }
          >
            {busyAction === "scan" ? "Scanning..." : "Run scan"}
          </button>
          <button
            type="button"
            className="action-button-secondary"
            onClick={() =>
              void chrome.runtime.sendMessage<VisionXMessage, VisionXResponse>(
                { type: "VISIONX_OPEN_REPORT_PAGE" },
                () => {
                  if (chrome.runtime.lastError) {
                    setStatus(chrome.runtime.lastError.message ?? "Unable to open the VisionX report.");
                    return;
                  }

                  setStatus("Opened the VisionX report view.");
                }
              )
            }
          >
            Open report
          </button>
        </div>
      </ControlCard>
    </main>
  );
}
