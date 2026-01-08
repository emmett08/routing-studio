import React, { useMemo, useState } from "react";
import type { RoutingUiConfig } from "../../routing/types";
import { defaultUiConfig } from "../../routing/uiDefaults";
import { InlineCode, InlineAction, ViewHeader } from "../components";

function stableStringify(obj: unknown): string {
  return JSON.stringify(obj, null, 2);
}

export function UiConfigEditor({
  uiConfig,
  saveUi,
}: {
  uiConfig: RoutingUiConfig;
  saveUi: (cfg: RoutingUiConfig, opts?: { silent?: boolean }) => void;
}) {
  const [draft, setDraft] = useState<string>(() => stableStringify(uiConfig));
  const [err, setErr] = useState<string | null>(null);

  const metricDefs = uiConfig.metricDefinitions ?? [];
  const classMetaEntries = useMemo(
    () => Object.entries(uiConfig.classMeta ?? {}).sort(([a], [b]) => a.localeCompare(b)),
    [uiConfig.classMeta],
  );

  const setAndPersist = (next: RoutingUiConfig, opts?: { silent?: boolean }) => {
    saveUi(next, opts);
    setDraft(stableStringify(next));
  };

  return (
    <section className="view" aria-label="UI semantics">
      <ViewHeader
        title="UI semantics"
        subtitle="Advanced. UI only (stored locally). Not exported."
        actions={
          <button
            type="button"
            className="button button-secondary"
            onClick={() => setAndPersist(defaultUiConfig, { silent: false })}
          >
            Reset
          </button>
        }
      />

      <div className="view-body">
        <div className="hint">
          UI semantics are stored locally in <InlineCode>localStorage</InlineCode>. They do not
          change your routing JSON output.
        </div>

        <div className="section-title">Metrics</div>
        <table className="table" aria-label="Metric labels">
          <thead>
            <tr>
              <th>Key</th>
              <th>Label</th>
              <th>Step</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {metricDefs.map((m) => (
              <tr key={m.key}>
                <td className="mono">{m.key}</td>
                <td>
                  <input
                    value={m.label}
                    onChange={(e) => {
                      const next = {
                        ...uiConfig,
                        metricDefinitions: uiConfig.metricDefinitions.map((x) =>
                          x.key === m.key ? { ...x, label: e.target.value } : x,
                        ),
                      };
                      setAndPersist(next);
                    }}
                    className="input"
                    aria-label={`Metric label: ${m.key}`}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    step={0.01}
                    min={0.001}
                    value={m.step}
                    onChange={(e) => {
                      const step = Math.max(0.001, Number(e.target.value) || 0.05);
                      const next = {
                        ...uiConfig,
                        metricDefinitions: uiConfig.metricDefinitions.map((x) =>
                          x.key === m.key ? { ...x, step } : x,
                        ),
                      };
                      setAndPersist(next);
                    }}
                    className="input input-narrow"
                    aria-label={`Metric step: ${m.key}`}
                  />
                </td>
                <td>
                  <input
                    value={m.description ?? ""}
                    onChange={(e) => {
                      const next = {
                        ...uiConfig,
                        metricDefinitions: uiConfig.metricDefinitions.map((x) =>
                          x.key === m.key ? { ...x, description: e.target.value } : x,
                        ),
                      };
                      setAndPersist(next);
                    }}
                    className="input"
                    aria-label={`Metric description: ${m.key}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="section-title">Class labels</div>
        <table className="table" aria-label="Class labels">
          <thead>
            <tr>
              <th>Class</th>
              <th>Label</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {classMetaEntries.map(([k, meta]) => (
              <tr key={k}>
                <td className="mono">{k}</td>
                <td>
                  <input
                    value={meta.label ?? ""}
                    onChange={(e) => {
                      const next = {
                        ...uiConfig,
                        classMeta: {
                          ...uiConfig.classMeta,
                          [k]: { ...meta, key: k, label: e.target.value },
                        },
                      };
                      setAndPersist(next);
                    }}
                    className="input"
                    aria-label={`Class label: ${k}`}
                  />
                </td>
                <td>
                  <input
                    value={meta.description ?? ""}
                    onChange={(e) => {
                      const next = {
                        ...uiConfig,
                        classMeta: {
                          ...uiConfig.classMeta,
                          [k]: { ...meta, key: k, description: e.target.value },
                        },
                      };
                      setAndPersist(next);
                    }}
                    className="input"
                    aria-label={`Class description: ${k}`}
                  />
                </td>
              </tr>
            ))}
            {classMetaEntries.length === 0 ? (
              <tr>
                <td colSpan={3} className="muted">
                  No class labels yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>

        <details className="details-block">
          <summary>Import / export</summary>
          <div className="details-block-body">
            {err ? <div className="callout callout-error">{err}</div> : null}
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              spellCheck={false}
              className="textarea"
              aria-label="UI semantics JSON"
            />
            <div className="row-actions">
              <InlineAction
                onClick={() => {
                  try {
                    const parsed = JSON.parse(draft) as RoutingUiConfig;
                    if (!parsed.metricDefinitions || !parsed.classMeta) {
                      throw new Error("Missing metricDefinitions or classMeta");
                    }
                    setAndPersist(parsed, { silent: false });
                    setErr(null);
                  } catch (e) {
                    setErr(e instanceof Error ? e.message : String(e));
                  }
                }}
              >
                Apply
              </InlineAction>
            </div>
          </div>
        </details>
      </div>
    </section>
  );
}

