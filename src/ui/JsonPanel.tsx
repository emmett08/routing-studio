import React, { useMemo } from "react";
import { SectionTitle, SmallButton } from "./components";

export function JsonPanel({
  rawJsonDraft,
  setRawJsonDraft,
  rawJsonError,
  applyRawJsonDraft,
  copyJson,
}: {
  rawJsonDraft: string;
  setRawJsonDraft: (v: string) => void;
  rawJsonError: string | null;
  applyRawJsonDraft: () => void;
  copyJson: () => void;
}) {
  const errorBadge = useMemo(() => {
    if (!rawJsonError) return null;
    return <span className="badge danger">Invalid</span>;
  }, [rawJsonError]);

  return (
    <div className="panel" style={{ height: "100%" }}>
      <SectionTitle
        title="Raw JSON"
        subtitle="Advanced mode: edit JSON directly (schema-validated on Apply)."
        right={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            {errorBadge}
            <SmallButton onClick={applyRawJsonDraft} title="Parse & apply changes">
              Apply
            </SmallButton>
            <SmallButton onClick={copyJson} title="Copy JSON from current state">
              Copy
            </SmallButton>
          </div>
        }
      />
      <div className="body" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {rawJsonError ? (
          <div className="card" style={{ borderColor: "rgba(255,107,107,0.5)" }}>
            <div style={{ fontSize: 13 }}>
              <strong>Parse error:</strong> {rawJsonError}
            </div>
            <div className="small">Fix the JSON then click Apply.</div>
          </div>
        ) : null}

        <textarea
          value={rawJsonDraft}
          onChange={(e) => setRawJsonDraft(e.target.value)}
          spellCheck={false}
          style={{ minHeight: 420, width: "100%" }}
          aria-label="Raw JSON editor"
        />
      </div>
    </div>
  );
}
