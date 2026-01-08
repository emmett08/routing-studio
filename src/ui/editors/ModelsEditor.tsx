import React, { useMemo, useState } from "react";
import type { RoutingFileV1, RoutingUiConfig } from "../../routing/types";
import { Help, InlineCode, SectionTitle, SmallButton } from "../components";

function clamp(x: number, min: number, max: number) {
  return Math.max(min, Math.min(max, x));
}

function parseTags(text: string): string[] {
  return text
    .split(/[,\n]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function ModelsEditor({
  routing,
  updateRouting,
  uiConfig,
}: {
  routing: RoutingFileV1;
  updateRouting: (mutate: (draft: RoutingFileV1) => void, opts?: { silent?: boolean }) => void;
  uiConfig: RoutingUiConfig;
}) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [newId, setNewId] = useState("");

  const allIds = useMemo(() => Object.keys(routing.models ?? {}).sort(), [routing.models]);

  const filtered = useMemo(() => {
    if (!q.trim()) return allIds;
    const qq = q.toLowerCase();
    return allIds.filter((id) => {
      const m = routing.models[id];
      const tags = (m?.tags ?? []).join(" ").toLowerCase();
      return id.toLowerCase().includes(qq) || tags.includes(qq);
    });
  }, [allIds, q, routing.models]);

  const currentId = selected && routing.models[selected] ? selected : filtered[0] ?? null;
  const current = currentId ? routing.models[currentId] : null;

  const metricDefs = uiConfig.metricDefinitions ?? [];

  return (
    <div className="panel">
      <SectionTitle
        title="Models"
        subtitle="Model registry used for scoring, tags, and discoverable class suggestions."
        right={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              placeholder="new model id (provider:model)"
              style={{ width: 280 }}
            />
            <SmallButton
              onClick={() => {
                const id = newId.trim();
                if (!id) return;
                updateRouting((d) => {
                  d.models ??= {};
                  if (d.models[id]) return;
                  d.models[id] = {
                    reasoning: 0.5,
                    latency: 0.5,
                    cost: 0.5,
                    contextTokens: 128000,
                    tools: true,
                    vision: true,
                    tags: [],
                  };
                });
                setSelected(id);
                setNewId("");
              }}
            >
              Add model
            </SmallButton>
          </div>
        }
      />
      <div className="body">
        <Help>
          <div>
            A model id is typically <InlineCode>provider:model</InlineCode> (e.g.{" "}
            <InlineCode>openai:gpt-5.1</InlineCode>). Classes refer to these ids.
          </div>
        </Help>

        <div className="hr" />

        <div className="split">
          <div className="card" style={{ minHeight: 420 }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search models / tags…"
                style={{ width: "100%" }}
              />
            </div>

            <div className="hr" />

            <div className="list" style={{ maxHeight: 430, overflow: "auto" }}>
              {filtered.map((id) => {
                const m = routing.models[id];
                const isSel = id === currentId;
                return (
                  <button
                    key={id}
                    onClick={() => setSelected(id)}
                    aria-current={isSel ? "page" : undefined}
                    style={{ justifyContent: "flex-start", gap: 10 }}
                  >
                    <span className="mono" style={{ fontSize: 12 }}>
                      {id}
                    </span>
                    <span style={{ flex: 1 }} />
                    <span className="pill">{(m.tags ?? []).length} tags</span>
                  </button>
                );
              })}
              {!filtered.length ? <div className="small">No matches.</div> : null}
            </div>
          </div>

          <div className="card" style={{ minHeight: 420 }}>
            {!currentId || !current ? (
              <div className="small">Select a model to edit.</div>
            ) : (
              <div className="list">
                <div>
                  <div className="small">Model id</div>
                  <input
                    value={currentId}
                    onChange={(e) => {
                      const nextId = e.target.value.trim();
                      if (!nextId) return;
                      if (nextId === currentId) return;
                      updateRouting((d) => {
                        if (d.models[nextId]) return;
                        d.models[nextId] = d.models[currentId]!;
                        delete d.models[currentId];
                        // Update references in classes and legacy map
                        for (const cls of Object.keys(d.classes ?? {})) {
                          d.classes[cls] = (d.classes[cls] ?? []).map((x) => (x === currentId ? nextId : x));
                        }
                        for (const [k, v] of Object.entries(d.legacyPreferenceMap ?? {})) {
                          if (v.kind === "explicit" && v.model === currentId) {
                            (d.legacyPreferenceMap![k] as any).model = nextId;
                          }
                        }
                      });
                      setSelected(nextId);
                    }}
                    className="mono"
                    style={{ width: "100%" }}
                  />
                </div>

                <div className="hr" />

                {metricDefs.map((def) => {
                  const key = def.key as keyof typeof current;
                  const valRaw = Number((current as any)[key]);
                  const val = Number.isFinite(valRaw) ? valRaw : 0;
                  return (
                    <div key={def.key}>
                      <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
                        <div>
                          <div className="small">{def.label}</div>
                          {def.description ? <div className="small">{def.description}</div> : null}
                        </div>
                        <input
                          type="number"
                          step={def.step}
                          min={def.min}
                          max={def.max}
                          value={val}
                          onChange={(e) => {
                            const v = Number(e.target.value);
                            updateRouting((d) => {
                              (d.models[currentId] as any)[def.key] = clamp(Number.isFinite(v) ? v : 0, def.min, def.max);
                            }, { silent: true });
                          }}
                          style={{ width: 110 }}
                        />
                      </div>

                      <input
                        type="range"
                        min={def.min}
                        max={def.max}
                        step={def.step}
                        value={val}
                        onChange={(e) => {
                          const v = Number(e.target.value);
                          updateRouting((d) => {
                            (d.models[currentId] as any)[def.key] = clamp(Number.isFinite(v) ? v : 0, def.min, def.max);
                          }, { silent: true });
                        }}
                        style={{ width: "100%", marginTop: 6 }}
                        aria-label={`${def.label} slider for ${currentId}`}
                      />
                    </div>
                  );
                })}

                <div className="hr" />

                <div className="split">
                  <label className="card">
                    <div className="small">Context tokens</div>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={Number(current.contextTokens)}
                      onChange={(e) => {
                        const v = Math.max(0, Math.trunc(Number(e.target.value) || 0));
                        updateRouting((d) => {
                          d.models[currentId]!.contextTokens = v;
                        }, { silent: true });
                      }}
                      style={{ width: "100%", marginTop: 8 }}
                    />
                  </label>

                  <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <input
                        type="checkbox"
                        checked={!!current.tools}
                        onChange={(e) =>
                          updateRouting((d) => {
                            d.models[currentId]!.tools = e.target.checked;
                          }, { silent: true })
                        }
                      />
                      <span>Tools</span>
                    </label>

                    <label style={{ display: "flex", gap: 10, alignItems: "center" }}>
                      <input
                        type="checkbox"
                        checked={!!current.vision}
                        onChange={(e) =>
                          updateRouting((d) => {
                            d.models[currentId]!.vision = e.target.checked;
                          }, { silent: true })
                        }
                      />
                      <span>Vision</span>
                    </label>
                  </div>
                </div>

                <div>
                  <div className="small">Tags</div>
                  <input
                    value={(current.tags ?? []).join(", ")}
                    onChange={(e) => {
                      const tags = Array.from(new Set(parseTags(e.target.value)));
                      updateRouting((d) => {
                        d.models[currentId]!.tags = tags;
                      }, { silent: true });
                    }}
                    placeholder="tools, vision, frontier, fast, cheap…"
                    style={{ width: "100%", marginTop: 8 }}
                  />
                  <div className="small" style={{ marginTop: 6 }}>
                    Tip: class suggestions can be driven by tags.
                  </div>
                </div>

                <div className="hr" />

                <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                  <SmallButton
                    onClick={() => {
                      const ok = confirm(`Delete model '${currentId}'? References in classes will remain, but become warnings.`);
                      if (!ok) return;
                      updateRouting((d) => {
                        delete d.models[currentId];
                      });
                      setSelected(null);
                    }}
                  >
                    Delete model
                  </SmallButton>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
