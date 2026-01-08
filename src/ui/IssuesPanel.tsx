import React, { useMemo, useState } from "react";
import type { ValidationIssue } from "../routing/types";
import { SectionTitle } from "./components";

export function IssuesPanel({ issues }: { issues: ValidationIssue[] }) {
  const [show, setShow] = useState<"all" | "errors" | "warnings">("all");

  const filtered = useMemo(() => {
    if (show === "all") return issues;
    if (show === "errors") return issues.filter((i) => i.severity === "error");
    return issues.filter((i) => i.severity === "warning");
  }, [issues, show]);

  const tone = (s: ValidationIssue["severity"]) =>
    s === "error" ? "danger" : s === "warning" ? "warn" : "ok";

  return (
    <div className="panel" style={{ height: "100%" }}>
      <SectionTitle
        title="Validation"
        subtitle="Integrity checks across providers, models, classes and defaults."
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <select value={show} onChange={(e) => setShow(e.target.value as any)}>
              <option value="all">All</option>
              <option value="errors">Errors</option>
              <option value="warnings">Warnings</option>
            </select>
          </div>
        }
      />
      <div className="body">
        {!filtered.length ? (
          <div className="card">
            <div style={{ fontSize: 13 }}>No issues 🎉</div>
            <div className="small">You’re ready to download.</div>
          </div>
        ) : (
          <div className="list">
            {filtered.map((i, idx) => (
              <div key={idx} className="card">
                <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                  <span className={`badge ${tone(i.severity)}`}>{i.severity}</span>
                  <span className="mono" style={{ fontSize: 12, opacity: 0.9 }}>
                    {i.path}
                  </span>
                </div>
                <div style={{ marginTop: 8, fontSize: 13 }}>{i.message}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
