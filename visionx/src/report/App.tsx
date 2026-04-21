import { useEffect, useState } from "react";
import { getLatestReport } from "../shared/report";
import type { AccessibilityIssue, AccessibilityReport } from "../shared/types";

function formatTimestamp(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

function IssueCard({ issue }: { issue: AccessibilityIssue }) {
  return (
    <article className="panel p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <span className="chip">{issue.impact}</span>
            <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-[0.12em] text-slate-600">
              {issue.id}
            </span>
          </div>
          <h3 className="text-lg font-semibold text-slate-900">{issue.help}</h3>
        </div>
        <a
          href={issue.helpUrl}
          target="_blank"
          rel="noreferrer"
          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-vision-teal hover:text-vision-teal"
        >
          Rule guidance
        </a>
      </div>

      <p className="mt-3 text-sm leading-7 text-slate-600">{issue.description}</p>
      <p className="mt-3 rounded-2xl bg-vision-sea/60 px-4 py-3 text-sm leading-7 text-slate-700">
        {issue.suggestion}
      </p>

      <div className="mt-4 space-y-3">
        {issue.affectedNodes.map((node, index) => (
          <div key={`${issue.id}-${index}`} className="rounded-2xl border border-slate-200/90 bg-slate-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">
              Target
            </p>
            <p className="mt-1 break-all text-sm text-slate-700">{node.target.join(" ")}</p>
            <pre className="mt-3 overflow-auto rounded-xl bg-white p-3 text-xs text-slate-600">
              {node.html}
            </pre>
            <p className="mt-3 text-sm leading-6 text-slate-600">{node.failureSummary}</p>
          </div>
        ))}
      </div>
    </article>
  );
}

export function App() {
  const [report, setReport] = useState<AccessibilityReport | null>(null);

  useEffect(() => {
    void getLatestReport().then(setReport);

    const listener = (
      changes: { [key: string]: chrome.storage.StorageChange },
      areaName: string
    ) => {
      if (areaName === "local" && changes["visionx.latestReport"]?.newValue) {
        setReport(changes["visionx.latestReport"].newValue as AccessibilityReport);
      }
    };

    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }, []);

  if (!report) {
    return (
      <main className="mx-auto flex min-h-screen max-w-5xl items-center justify-center p-8">
        <div className="panel max-w-xl space-y-4 p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-vision-teal">
            VisionX Report
          </p>
          <h1 className="text-3xl font-semibold text-slate-900">No accessibility report yet</h1>
          <p className="text-base leading-8 text-slate-600">
            Run a scan from the VisionX popup on any supported webpage, then come back here to review the issues.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl space-y-6 p-6 md:p-8">
      <header className="panel p-6 md:p-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-vision-teal">
              VisionX Report
            </p>
            <h1 className="text-3xl font-semibold text-slate-900 md:text-4xl">{report.title}</h1>
            <p className="break-all text-sm leading-6 text-slate-600">{report.url}</p>
            <p className="text-sm text-slate-500">Scanned {formatTimestamp(report.scannedAt)}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="metric-card min-w-[120px]">
              <span className="metric-label">Score</span>
              <span className="metric-value">{report.score}</span>
            </div>
            <div className="metric-card min-w-[120px]">
              <span className="metric-label">Issues</span>
              <span className="metric-value">{report.issueCount}</span>
            </div>
            <div className="metric-card min-w-[120px]">
              <span className="metric-label">Passes</span>
              <span className="metric-value">{report.passCount}</span>
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-5">
        {report.issues.length ? (
          report.issues.map((issue) => <IssueCard key={issue.id} issue={issue} />)
        ) : (
          <div className="panel p-8 text-center text-slate-600">
            No issues were found in the latest scan.
          </div>
        )}
      </section>
    </main>
  );
}
