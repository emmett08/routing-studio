import React, { useMemo, useState } from "react";
import type { RoutingUiConfig } from "../../routing/types";
import { defaultUiConfig } from "../../routing/uiDefaults";
import { Help, InlineCode, SectionTitle, SmallButton } from "../components";

export function UiConfigEditor({
  uiConfig,
  saveUi,
}: {
  uiConfig: RoutingUiConfig;
  saveUi: (cfg: RoutingUiConfig, opts?: { silent?: boolean }) => void;
}) {
  const [draft, setDraft] = useState<string>(() => JSON.stringify(uiConfig, null, 2));
  const [err, setErr] = useState<string | null>(null);

  const metricDefs = uiConfig.metricDefinitions ?? [];

  const classMetaEntries = useMemo(
    () => Object.entries(uiConfig.classMeta ?? {}).sort(([a], [b]) => a.localeCompare(b)),
    [uiConfig.classMeta],
  );

  return (
    <div className="panel">
      <SectionTitle
        title="UI configuration"
        subtitle="Local-only configuration for naming & meaning (keeps categories configurable)."
      />
      <div className="body">
        <Help>
          <div>
            This configuration is stored in <InlineCode>localStorage</InlineCode> by default. It lets
            different teams define what “Frontier”, “Cost”, “Fast”, etc mean <em>without</em> forcing
            those semantics into the routing file.
          </div>
        </Help>

        <div className="hr" />

        <div className="split">
          <div className="card" style={{ minHeight: 420 }}>
            <div className="small">Metric labels (shown in UI)</div>
            <div className="hr" />

            <div className="list">
              {metricDefs.map((m) => (
                <div key={m.key} className="card">
                  <div className="small">Key: <InlineCode>{m.key}</InlineCode></div>
                  <div className="split" style={{ marginTop: 8 }}>
                    <label className="card">
                      <div className="small">Label</div>
                      <input
                        value={m.label}
                        onChange={(e) => {
                          const next = e.target.value;
                          saveUi({
                            ...uiConfig,
                            metricDefinitions: uiConfig.metricDefinitions.map((x) =>
                              x.key === m.key ? { ...x, label: next } : x,
                            ),
                          });
                          setDraft(JSON.stringify({ ...uiConfig, metricDefinitions: uiConfig.metricDefinitions.map((x) => x.key === m.key ? { ...x, label: next } : x)}, null, 2));
                        }}
                        style={{ width: "100%", marginTop: 8 }}
                      />
                    </label>
                    <label className="card">
                      <div className="small">Step</div>
                      <input
                        type="number"
                        step={0.01}
                        min={0.001}
                        value={m.step}
                        onChange={(e) => {
                          const step = Math.max(0.001, Number(e.target.value) || 0.05);
                          saveUi({
                            ...uiConfig,
                            metricDefinitions: uiConfig.metricDefinitions.map((x) =>
                              x.key === m.key ? { ...x, step } : x,
                            ),
                          });
                          setDraft(JSON.stringify({ ...uiConfig, metricDefinitions: uiConfig.metricDefinitions.map((x) => x.key === m.key ? { ...x, step } : x)}, null, 2));
                        }}
                        style={{ width: "100%", marginTop: 8 }}
                      />
                    </label>
                  </div>

                  <label className="card">
                    <div className="small">Description</div>
                    <input
                      value={m.description ?? ""}
                      onChange={(e) => {
                        const description = e.target.value;
                        saveUi({
                          ...uiConfig,
                          metricDefinitions: uiConfig.metricDefinitions.map((x) =>
                            x.key === m.key ? { ...x, description } : x,
                          ),
                        });
                        setDraft(JSON.stringify({ ...uiConfig, metricDefinitions: uiConfig.metricDefinitions.map((x) => x.key === m.key ? { ...x, description } : x)}, null, 2));
                      }}
                      style={{ width: "100%", marginTop: 8 }}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="card" style={{ minHeight: 420 }}>
            <div className="small">Class labels (UI only)</div>
            <div className="hr" />

            <div className="list" style={{ maxHeight: 500, overflow: "auto" }}>
              {classMetaEntries.map(([k, meta]) => (
                <div key={k} className="card">
                  <div className="small">
                    Key: <InlineCode>{k}</InlineCode>
                  </div>
                  <div className="split" style={{ marginTop: 8 }}>
                    <label className="card">
                      <div className="small">Label</div>
                      <input
                        value={meta.label ?? ""}
                        onChange={(e) => {
                          const label = e.target.value;
                          saveUi({
                            ...uiConfig,
                            classMeta: {
                              ...uiConfig.classMeta,
                              [k]: { ...meta, key: k, label },
                            },
                          });
                          setDraft(JSON.stringify({ ...uiConfig, classMeta: { ...uiConfig.classMeta, [k]: { ...meta, key: k, label }}}, null, 2));
                        }}
                        style={{ width: "100%", marginTop: 8 }}
                      />
                    </label>
                    <label className="card">
                      <div className="small">Icon</div>
                      <input
                        value={meta.icon ?? ""}
                        onChange={(e) => {
                          const icon = e.target.value;
                          saveUi({
                            ...uiConfig,
                            classMeta: {
                              ...uiConfig.classMeta,
                              [k]: { ...meta, key: k, icon },
                            },
                          });
                          setDraft(JSON.stringify({ ...uiConfig, classMeta: { ...uiConfig.classMeta, [k]: { ...meta, key: k, icon }}}, null, 2));
                        }}
                        style={{ width: "100%", marginTop: 8 }}
                      />
                    </label>
                  </div>
                </div>
              ))}

              {!classMetaEntries.length ? (
                <div className="small">No class metadata yet. Add classes first.</div>
              ) : null}
            </div>
          </div>
        </div>

        <div className="hr" />

        <div className="card">
          <div className="small">Advanced: import/export UI config</div>
          <div className="small" style={{ marginTop: 6 }}>
            You can share this config with your team (e.g. via git) without changing your routing file.
          </div>

          <div className="hr" />

          {err ? (
            <div className="card" style={{ borderColor: "rgba(255,107,107,0.5)" }}>
              <div style={{ fontSize: 13 }}>
                <strong>Invalid JSON:</strong> {err}
              </div>
            </div>
          ) : null}

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            spellCheck={false}
            style={{ width: "100%", minHeight: 240 }}
          />

          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 10 }}>
            <SmallButton
              onClick={() => {
                try {
                  const parsed = JSON.parse(draft) as RoutingUiConfig;
                  if (!parsed.metricDefinitions || !parsed.classMeta) {
                    throw new Error("Missing metricDefinitions or classMeta");
                  }
                  saveUi(parsed, { silent: false });
                  setErr(null);
                } catch (e) {
                  setErr(e instanceof Error ? e.message : String(e));
                }
              }}
            >
              Apply
            </SmallButton>
            <SmallButton
              onClick={() => {
                saveUi(defaultUiConfig, { silent: false });
                setDraft(JSON.stringify(defaultUiConfig, null, 2));
                setErr(null);
              }}
              title="Reset UI config to defaults"
            >
              Reset
            </SmallButton>
          </div>
        </div>
      </div>
    </div>
  );
}
