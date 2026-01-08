import React, { useMemo } from "react";
import type { ValidationIssue } from "../routing/types";
import type { SectionKey } from "./Sidebar";
import { InlineAction, ViewHeader } from "./components";

export type GoToRequest =
  | { section: Extract<SectionKey, "providers">; focus: { kind: "providers"; providerId?: string } }
  | { section: Extract<SectionKey, "models">; focus: { kind: "models"; modelId?: string } }
  | { section: Extract<SectionKey, "classes">; focus: { kind: "classes"; classKey?: string; index?: number } }
  | { section: Extract<SectionKey, "defaults">; focus: { kind: "defaults"; field?: "licensed" | "unlicensed" } }
  | { section: Extract<SectionKey, "legacy">; focus: { kind: "legacy"; key?: string } }
  | { section: Extract<SectionKey, "rawJson">; focus: { kind: "rawJson" } };

type IssueGroupKey = "providers" | "models" | "classes" | "defaults" | "legacy";

function plural(n: number, noun: string): string {
  return `${n} ${noun}${n === 1 ? "" : "s"}`;
}

function pathAfter(prefix: string, path: string): string | null {
  return path.startsWith(prefix) ? path.slice(prefix.length) : null;
}

function extractQuoted(message: string, prefix: string): string | null {
  const re = new RegExp(`${prefix}\\s+'([^']+)'`, "i");
  const m = message.match(re);
  return m?.[1] ?? null;
}

function parseClassesPath(path: string): { classKey?: string; index?: number } {
  const rest = pathAfter("classes.", path);
  if (!rest) return {};
  const m = rest.match(/^(.+?)(?:\[(\d+)\])?$/);
  if (!m) return {};
  const classKey = m[1];
  const index = m[2] ? Number(m[2]) : undefined;
  return { classKey, index: Number.isFinite(index) ? index : undefined };
}

function classifyIssue(issue: ValidationIssue): { group: IssueGroupKey; goTo: GoToRequest } {
  if (issue.path.startsWith("defaults.")) {
    const field = issue.path === "defaults.licensed" ? "licensed" : issue.path === "defaults.unlicensed" ? "unlicensed" : undefined;
    return { group: "defaults", goTo: { section: "defaults", focus: { kind: "defaults", field } } };
  }

  if (issue.path.startsWith("legacyPreferenceMap.")) {
    const key = pathAfter("legacyPreferenceMap.", issue.path) ?? undefined;
    return { group: "legacy", goTo: { section: "legacy", focus: { kind: "legacy", key } } };
  }

  const missingProvider = extractQuoted(issue.message, "Provider");
  if (missingProvider) {
    return { group: "providers", goTo: { section: "providers", focus: { kind: "providers", providerId: missingProvider } } };
  }

  const missingModel = extractQuoted(issue.message, "Model");
  if (missingModel) {
    return { group: "models", goTo: { section: "models", focus: { kind: "models", modelId: missingModel } } };
  }

  if (issue.path === "providers" || issue.path.startsWith("providers.")) {
    return { group: "providers", goTo: { section: "providers", focus: { kind: "providers" } } };
  }

  if (issue.path.startsWith("models.")) {
    const modelId = pathAfter("models.", issue.path) ?? undefined;
    return { group: "models", goTo: { section: "models", focus: { kind: "models", modelId } } };
  }

  if (issue.path.startsWith("classes.")) {
    const { classKey, index } = parseClassesPath(issue.path);
    return { group: "classes", goTo: { section: "classes", focus: { kind: "classes", classKey, index } } };
  }

  return { group: "classes", goTo: { section: "rawJson", focus: { kind: "rawJson" } } };
}

export function IssuesPanel({
  issues,
  onGoTo,
  fileName,
  fileUri,
  dirty,
}: {
  issues: ValidationIssue[];
  onGoTo: (req: GoToRequest) => void;
  fileName: string;
  fileUri: string | null;
  dirty: boolean;
}) {
  const errors = useMemo(() => issues.filter((i) => i.severity === "error").length, [issues]);
  const warnings = useMemo(() => issues.filter((i) => i.severity === "warning").length, [issues]);

  const grouped = useMemo(() => {
    const out: Record<IssueGroupKey, Array<{ issue: ValidationIssue; goTo: GoToRequest }>> = {
      providers: [],
      models: [],
      classes: [],
      defaults: [],
      legacy: [],
    };
    for (const issue of issues) {
      const { group, goTo } = classifyIssue(issue);
      out[group].push({ issue, goTo });
    }
    return out;
  }, [issues]);

  const groups: Array<{ key: IssueGroupKey; title: string }> = useMemo(
    () => [
      { key: "providers", title: "Providers" },
      { key: "models", title: "Models" },
      { key: "classes", title: "Classes" },
      { key: "defaults", title: "Defaults" },
      { key: "legacy", title: "Legacy map" },
    ],
    [],
  );

  const summary = issues.length === 0 ? "Validation: 0 issues" : `Validation: ${plural(issues.length, "issue")}`;
  const detail =
    issues.length === 0 ? "✓ No issues detected" : `${plural(errors, "error")}, ${plural(warnings, "warning")}`;

  return (
    <section className="panel panel-problems" aria-label="Problems">
      <ViewHeader title="Problems" subtitle={`${summary} • ${detail}`} />

      <div className="panel-body">
        <div className="problems-file">
          <div className="problems-file-row">
            <span className="muted">File</span>
            <span className="mono">{fileName}</span>
          </div>
          <div className="muted">
            {fileUri === null ? "Not saved yet" : dirty ? "Unsaved changes" : "Saved"}
          </div>
        </div>

        {issues.length === 0 ? (
          <div className="empty-state">✓ No issues detected</div>
        ) : (
          <div className="problem-groups">
            {groups.map(({ key, title }) => {
              const items = grouped[key];
              if (items.length === 0) return null;
              return (
                <section key={key} className="problem-group" aria-label={title}>
                  <div className="problem-group-title">
                    <span>{title}</span>
                    <span className="muted">({items.length})</span>
                  </div>
                  <ul className="problem-list">
                    {items.map(({ issue, goTo }, idx) => (
                      <li key={`${issue.path}-${idx}`} className="problem-item">
                        <div className="problem-meta">
                          <span className={`problem-severity problem-severity-${issue.severity}`}>
                            {issue.severity}
                          </span>
                          <span className="problem-path">{issue.path}</span>
                        </div>
                        <div className="problem-message">{issue.message}</div>
                        <div className="problem-actions">
                          <InlineAction
                            onClick={() => onGoTo(goTo)}
                            aria-label={`Go to ${issue.path}`}
                          >
                            Go to
                          </InlineAction>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
