import { storageGet, storageSet } from "./chrome";
import type { AccessibilityReport } from "./types";

export const REPORT_STORAGE_KEY = "visionx.latestReport";

export async function getLatestReport(): Promise<AccessibilityReport | null> {
  const report = await storageGet<AccessibilityReport>("local", REPORT_STORAGE_KEY);
  return report ?? null;
}

export async function saveLatestReport(report: AccessibilityReport): Promise<void> {
  await storageSet("local", { [REPORT_STORAGE_KEY]: report });
}
