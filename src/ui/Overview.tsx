import React, { useMemo } from "react";
import type { RoutingFileV1 } from "../routing/types";
import { InlineCode, OverflowMenu, ViewHeader } from "./components";

export function Overview({
  routing,
  fileName,
  fileUri,
  dirty,
  status,
  fileNameEditable,
  setFileName,
  onOpen,
  onNew,
  onSave,
  onExport,
  onValidate,
  onShowOutput,
  onCopyJson,
}: {
  routing: RoutingFileV1;
  fileName: string;
  fileUri?: string | null;
  dirty: boolean;
  status: { errors: number; warnings: number };
  fileNameEditable: boolean;
  setFileName: (v: string) => void;
  onOpen: () => void;
  onNew: () => void;
  onSave: () => void;
  onExport?: () => void;
  onValidate?: () => void;
  onShowOutput?: () => void;
  onCopyJson: () => void;
}) {
  const providerCount = useMemo(() => Object.keys(routing.providers ?? {}).length, [routing.providers]);
  const modelCount = useMemo(() => Object.keys(routing.models ?? {}).length, [routing.models]);
  const classCount = useMemo(() => Object.keys(routing.classes ?? {}).length, [routing.classes]);

  const validationSummary =
    status.errors > 0
      ? `${status.errors} error${status.errors === 1 ? "" : "s"}`
      : status.warnings > 0
        ? `${status.warnings} warning${status.warnings === 1 ? "" : "s"}`
        : "0 issues";

  return (
    <section className="view" aria-label="Overview">
      <ViewHeader
        title="Overview"
        subtitle="File lifecycle and status summary."
        actions={
          <>
            <button type="button" className="button button-primary" onClick={onOpen}>
              Open file…
            </button>
            <OverflowMenu
              items={[
                { label: "New", onSelect: onNew },
                { label: "Save", onSelect: onSave },
                ...(onExport ? [{ label: "Export…", onSelect: onExport }] : []),
                ...(onValidate ? [{ label: "Validate", onSelect: onValidate }] : []),
                { label: "Copy JSON", onSelect: onCopyJson },
                ...(onShowOutput ? [{ label: "Show output", onSelect: onShowOutput }] : []),
              ]}
            />
          </>
        }
      />

      <div className="view-body">
        <div className="kv-grid" role="list" aria-label="File status">
          <div className="kv-row" role="listitem">
            <div className="kv-key">File</div>
            <div className="kv-value">
              {fileNameEditable ? (
                <input
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  className="input"
                  aria-label="File name"
                />
              ) : (
                <span className="mono">{fileName}</span>
              )}
              {fileUri === null ? (
                <span className="dirty-indicator">• Not saved yet</span>
              ) : dirty ? (
                <span className="dirty-indicator">• Unsaved changes</span>
              ) : null}
              {fileUri ? <div className="muted mono">{fileUri}</div> : null}
            </div>
          </div>

          <div className="kv-row" role="listitem">
            <div className="kv-key">Validation</div>
            <div className="kv-value">{validationSummary}</div>
          </div>

          <div className="kv-row" role="listitem">
            <div className="kv-key">Contents</div>
            <div className="kv-value">
              Providers: {providerCount} • Models: {modelCount} • Classes: {classCount}
            </div>
          </div>

          <div className="kv-row" role="listitem">
            <div className="kv-key">Defaults</div>
            <div className="kv-value">
              {routing.defaults?.licensed}/{routing.defaults?.unlicensed}
            </div>
          </div>

          <div className="kv-row" role="listitem">
            <div className="kv-key">Version</div>
            <div className="kv-value">
              <InlineCode>{String(routing.version)}</InlineCode>
            </div>
          </div>
        </div>

        <div className="hint">
          Routing JSON is the output artefact. The editor updates it deterministically and preserves unknown fields.
        </div>
      </div>
    </section>
  );
}
