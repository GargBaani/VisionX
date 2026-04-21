import type { AccessibilityReport, VisionXSettings } from "./types";

export type VisionXMessage =
  | { type: "VISIONX_APPLY_SETTINGS"; settings: VisionXSettings }
  | { type: "VISIONX_TTS_PLAY" }
  | { type: "VISIONX_TTS_PAUSE" }
  | { type: "VISIONX_TTS_RESUME" }
  | { type: "VISIONX_TTS_STOP" }
  | { type: "VISIONX_SCAN_PAGE" }
  | { type: "VISIONX_OPEN_REPORT_PAGE" };

export interface VisionXResponse {
  ok: boolean;
  message?: string;
  report?: AccessibilityReport;
  settings?: VisionXSettings;
}
