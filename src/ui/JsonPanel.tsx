import React, { useMemo, useState } from "react";
import { parseRoutingJsonText } from "../routing/schema";
import { InlineAction, ViewHeader } from "./components";

export function JsonPanel({
  currentText,
  rawJsonDraft,
  setRawJsonDraft,
  rawJsonError,
  applyRawJsonDraft,
  copyJson,
}: {
  currentText: string;
  rawJsonDraft: string;
  setRawJsonDraft: (v: string) => void;
  rawJsonError: string | null;
  applyRawJsonDraft: () => void;
  copyJson: () => void;
}) {
  const [editEnabled, setEditEnabled] = useState(false);

  const draftError = useMemo(() => {
    if (!editEnabled) return null;
    const parsed = parseRoutingJsonText(rawJsonDraft);
    return parsed.ok ? null : parsed.message;
  }, [editEnabled, rawJsonDraft]);

  return (
    <section className="view" aria-label="Raw JSON">
      <ViewHeader
        title="Raw JSON"
        subtitle="Advanced. Read-only by default."
        actions={
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="button button-secondary" onClick={copyJson}>
              Copy JSON
            </button>
          </div>
        }
      />

      <div className="view-body">
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={editEnabled}
            onChange={(e) => {
              const next = e.target.checked;
              setEditEnabled(next);
              if (!next) setRawJsonDraft(currentText);
              if (next) setRawJsonDraft(currentText);
            }}
          />
          <span>Edit raw JSON</span>
          <span className="muted">I understand this may break validation.</span>
        </label>

        {!editEnabled ? (
          <pre className="code-block" aria-label="Raw JSON preview">
            {currentText}
          </pre>
        ) : (
          <div className="rawjson-edit">
            <div className="callout callout-warn">
              Editing raw JSON bypasses guided safeguards. Apply will validate schema and reload the editor state.
            </div>

            {rawJsonError ? (
              <div className="callout callout-error">Parse error: {rawJsonError}</div>
            ) : null}
            {draftError ? <div className="callout callout-error">{draftError}</div> : null}

            <textarea
              value={rawJsonDraft}
              onChange={(e) => setRawJsonDraft(e.target.value)}
              spellCheck={false}
              className="textarea"
              aria-label="Raw JSON editor"
            />

            <div className="row-actions">
              <InlineAction
                onClick={() => {
                  setEditEnabled(false);
                  setRawJsonDraft(currentText);
                }}
              >
                Discard
              </InlineAction>

              <button
                type="button"
                className="button button-primary"
                onClick={applyRawJsonDraft}
                disabled={draftError !== null}
                title={draftError ? "Fix JSON errors first" : undefined}
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
