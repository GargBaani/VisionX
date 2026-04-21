import axe from "axe-core";
import type {
  AccessibilityImpact,
  AccessibilityIssue,
  AccessibilityReport
} from "../../shared/types";

const IMPACT_WEIGHTS: Record<AccessibilityImpact, number> = {
  critical: 18,
  serious: 10,
  moderate: 6,
  minor: 3,
  unknown: 4
};

const ISSUE_SUGGESTIONS: Record<string, string> = {
  "color-contrast": "Increase contrast between text and background colors until body text comfortably meets WCAG AA.",
  "image-alt": "Add concise alt text that explains the meaning of each informative image.",
  "heading-order": "Use a logical heading order without skipping levels so screen readers can follow structure.",
  label: "Associate every form input with a visible or programmatic label.",
  "link-name": "Make link text descriptive enough to understand out of context.",
  region: "Group major content areas into landmarks like main, nav, or complementary regions.",
  "document-title": "Set a clear, unique page title so users understand what page they opened."
};

function normalizeImpact(value?: string | null): AccessibilityImpact {
  if (value === "critical" || value === "serious" || value === "moderate" || value === "minor") {
    return value;
  }

  return "unknown";
}

function trimSnippet(value: string, maxLength = 280): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  return normalized.length > maxLength ? `${normalized.slice(0, maxLength)}...` : normalized;
}

function normalizeTargetPart(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (Array.isArray(value)) {
    return value.map((item) => normalizeTargetPart(item)).join(" > ");
  }

  if (value && typeof value === "object") {
    return JSON.stringify(value);
  }

  return String(value);
}

function scoreViolations(issues: AccessibilityIssue[]): number {
  let total = 100;
  for (const issue of issues) {
    const penalty = IMPACT_WEIGHTS[issue.impact] * Math.min(issue.affectedNodes.length || 1, 3);
    total -= penalty;
  }

  return Math.max(0, Math.round(total));
}

export async function runAccessibilityScan(): Promise<AccessibilityReport> {
  const results = await axe.run(
    {
      include: [["html"]],
      exclude: [["[data-visionx-ui='true']"]]
    } as never,
    {
      runOnly: {
        type: "tag",
        values: ["wcag2a", "wcag2aa", "best-practice"]
      }
    }
  );

  const issues: AccessibilityIssue[] = results.violations
    .map((violation) => ({
      id: violation.id,
      impact: normalizeImpact(violation.impact),
      description: violation.description,
      help: violation.help,
      helpUrl: violation.helpUrl,
      suggestion:
        ISSUE_SUGGESTIONS[violation.id] ??
        "Review the affected nodes and update the markup or styling to match the rule guidance.",
      affectedNodes: violation.nodes.slice(0, 6).map((node) => ({
        target: Array.from(node.target as ArrayLike<unknown>, (part) => normalizeTargetPart(part)),
        html: trimSnippet(node.html),
        failureSummary: trimSnippet(node.failureSummary ?? "No additional details provided.")
      }))
    }))
    .sort((left, right) => IMPACT_WEIGHTS[right.impact] - IMPACT_WEIGHTS[left.impact]);

  return {
    url: window.location.href,
    title: document.title || "Untitled page",
    scannedAt: new Date().toISOString(),
    score: scoreViolations(issues),
    passCount: results.passes.length,
    issueCount: issues.length,
    issues
  };
}
