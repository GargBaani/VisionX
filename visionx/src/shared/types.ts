export type FontPreset = "accessibleSans" | "readingSerif" | "dyslexiaFriendly";
export type AccessibilityImpact = "minor" | "moderate" | "serious" | "critical" | "unknown";

export interface VisionXSettings {
  enabled: boolean;
  readabilityMode: boolean;
  contrastMode: boolean;
  readerMode: boolean;
  fontScale: number;
  lineHeight: number;
  maxWidth: number;
  speechRate: number;
  fontPreset: FontPreset;
}

export interface AccessibilityNodeSummary {
  target: string[];
  html: string;
  failureSummary: string;
}

export interface AccessibilityIssue {
  id: string;
  impact: AccessibilityImpact;
  description: string;
  help: string;
  helpUrl: string;
  suggestion: string;
  affectedNodes: AccessibilityNodeSummary[];
}

export interface AccessibilityReport {
  url: string;
  title: string;
  scannedAt: string;
  score: number;
  passCount: number;
  issueCount: number;
  issues: AccessibilityIssue[];
}
