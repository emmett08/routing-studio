import React, { useEffect, useMemo, useRef, useState } from "react";
import type { ModelInfo, RoutingFileV1, RoutingUiConfig } from "../../routing/types";
import { InlineAction, InlineCode, ViewHeader } from "../components";

function clamp(x: number, min: number, max: number) {
  return Math.max(min, Math.min(max, x));
}

function providerOf(modelId: string): string | null {
  const idx = modelId.indexOf(":");
  if (idx <= 0) return null;
  return modelId.slice(0, idx);
}

function parseTags(text: string): string[] {
  return text
    .split(/[,\n]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function createDefaultModel(): ModelInfo {
  return {
    reasoning: 0.5,
    latency: 0.5,
    cost: 0.5,
    contextTokens: 128000,
    tools: true,
    vision: true,
    tags: [],
  };
}

export function ModelsEditor({
  routing,
  updateRouting,
  uiConfig,
  focusModelId,
  focusRequestId,
}: {
  routing: RoutingFileV1;
  updateRouting: (mutate: (draft: RoutingFileV1) => void, opts?: { silent?: boolean }) => void;
  uiConfig: RoutingUiConfig;
  focusModelId?: string;
  focusRequestId?: number;
}) {
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<string | null>(null);
  const [newId, setNewId] = useState("");
  const [adding, setAdding] = useState(false);

  const addInputRef = useRef<HTMLInputElement | null>(null);
  const idInputRef = useRef<HTMLInputElement | null>(null);

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

  useEffect(() => {
    if (!focusRequestId || !focusModelId) return;

    if (routing.models?.[focusModelId]) {
      setSelected(focusModelId);
      setAdding(false);
      requestAnimationFrame(() => idInputRef.current?.focus());
      return;
    }

    setAdding(true);
    setNewId(focusModelId);
    requestAnimationFrame(() => addInputRef.current?.focus());
  }, [focusModelId, focusRequestId, routing.models]);

  return (
    <section className="view" aria-label="Models">
      <ViewHeader title="Models" subtitle="Model registry for scoring, tags, and validation." />

      <div className="view-body">
        <div className="add-row">
          {!adding ? (
            <InlineAction
              onClick={() => {
                setAdding(true);
                requestAnimationFrame(() => addInputRef.current?.focus());
              }}
            >
              + Add model
            </InlineAction>
          ) : (
            <div className="add-inline">
              <input
                ref={addInputRef}
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                placeholder="new model id (provider:model)"
                className="input"
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  const id = newId.trim();
                  if (!id) return;
                  updateRouting((d) => {
                    d.models ??= {};
                    if (d.models[id]) return;
                    d.models[id] = createDefaultModel();
                  });
                  setSelected(id);
                  setNewId("");
                  setAdding(false);
                }}
                aria-label="New model id"
              />
              <InlineAction
                onClick={() => {
                  setAdding(false);
                  setNewId("");
                }}
              >
                Cancel
              </InlineAction>
            </div>
          )}
        </div>

        <div className="hint">
          Model ids are typically <InlineCode>provider:model</InlineCode> (e.g.{" "}
          <InlineCode>openai:gpt-5.1</InlineCode>). Classes reference these ids.
        </div>

        <div className="split-pane">
          <section className="pane" aria-label="Model list">
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search models / tags…"
              className="input"
              aria-label="Search models"
            />

            <div className="list" role="listbox" aria-label="Models">
              {filtered.map((id) => {
                const m = routing.models[id];
                const isSel = id === currentId;
                const provider = providerOf(id) ?? "";
                const caps = [
                  m.tools ? "tools" : null,
                  m.vision ? "vision" : null,
                ].filter(Boolean).join(", ");
                const ctx = Number.isFinite(Number(m.contextTokens))
                  ? `${Math.round(Number(m.contextTokens) / 1000)}k`
                  : "";
                const right = [caps, ctx].filter(Boolean).join(" • ");
                return (
                  <button
                    key={id}
                    type="button"
                    className="list-item"
                    onClick={() => setSelected(id)}
                    aria-current={isSel ? "page" : undefined}
                    role="option"
                    aria-selected={isSel}
                  >
                    <div className="list-item-title">
                      <span className="mono">{id}</span>
                      {provider ? <span className="muted">({provider})</span> : null}
                    </div>
                    {right ? <div className="list-item-meta muted">{right}</div> : null}
                  </button>
                );
              })}
              {filtered.length === 0 ? <div className="muted">No matches.</div> : null}
            </div>
          </section>

          <section className="pane" aria-label="Model details">
            {!currentId || !current ? (
              <div className="empty-state">Select a model to edit.</div>
            ) : (
              <div className="details">
                <label className="field">
                  <div className="field-label">Model id</div>
                  <input
                    ref={idInputRef}
                    value={currentId}
                    onChange={(e) => {
                      const nextId = e.target.value.trim();
                      if (!nextId || nextId === currentId) return;
                      updateRouting((d) => {
                        if (d.models[nextId]) return;
                        d.models[nextId] = d.models[currentId]!;
                        delete d.models[currentId];
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
                    className="input mono"
                    aria-label="Model id"
                  />
                </label>

                <details className="details-block">
                  <summary>Metrics</summary>
                  <div className="details-block-body">
                    {metricDefs.map((def) => {
                      const key = def.key as keyof typeof current;
                      const valRaw = Number((current as any)[key]);
                      const val = Number.isFinite(valRaw) ? valRaw : 0;
                      return (
                        <div key={def.key} className="metric-row">
                          <div className="metric-text">
                            <div className="field-label">{def.label}</div>
                            {def.description ? <div className="muted">{def.description}</div> : null}
                          </div>
                          <div className="metric-controls">
                            <input
                              type="number"
                              step={def.step}
                              min={def.min}
                              max={def.max}
                              value={val}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                updateRouting(
                                  (d) => {
                                    (d.models[currentId] as any)[def.key] = clamp(
                                      Number.isFinite(v) ? v : 0,
                                      def.min,
                                      def.max,
                                    );
                                  },
                                  { silent: true },
                                );
                              }}
                              className="input input-narrow"
                              aria-label={`${def.label} value`}
                            />
                            <input
                              type="range"
                              min={def.min}
                              max={def.max}
                              step={def.step}
                              value={val}
                              onChange={(e) => {
                                const v = Number(e.target.value);
                                updateRouting(
                                  (d) => {
                                    (d.models[currentId] as any)[def.key] = clamp(
                                      Number.isFinite(v) ? v : 0,
                                      def.min,
                                      def.max,
                                    );
                                  },
                                  { silent: true },
                                );
                              }}
                              aria-label={`${def.label} slider`}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </details>

                <div className="form-grid">
                  <label className="field">
                    <div className="field-label">Context tokens</div>
                    <input
                      type="number"
                      min={0}
                      step={1000}
                      value={Number(current.contextTokens)}
                      onChange={(e) => {
                        const v = Math.max(0, Math.trunc(Number(e.target.value) || 0));
                        updateRouting(
                          (d) => {
                            d.models[currentId]!.contextTokens = v;
                          },
                          { silent: true },
                        );
                      }}
                      className="input"
                    />
                  </label>

                  <div className="field">
                    <div className="field-label">Capabilities</div>
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={!!current.tools}
                        onChange={(e) =>
                          updateRouting(
                            (d) => {
                              d.models[currentId]!.tools = e.target.checked;
                            },
                            { silent: true },
                          )
                        }
                      />
                      <span>Tools</span>
                    </label>
                    <label className="checkbox-row">
                      <input
                        type="checkbox"
                        checked={!!current.vision}
                        onChange={(e) =>
                          updateRouting(
                            (d) => {
                              d.models[currentId]!.vision = e.target.checked;
                            },
                            { silent: true },
                          )
                        }
                      />
                      <span>Vision</span>
                    </label>
                  </div>
                </div>

                <label className="field">
                  <div className="field-label">Tags</div>
                  <input
                    value={(current.tags ?? []).join(", ")}
                    onChange={(e) => {
                      const tags = Array.from(new Set(parseTags(e.target.value)));
                      updateRouting(
                        (d) => {
                          d.models[currentId]!.tags = tags;
                        },
                        { silent: true },
                      );
                    }}
                    placeholder="tools, vision, frontier, fast, cheap"
                    className="input"
                    aria-label="Tags"
                  />
                </label>

                <div className="row-actions">
                  <InlineAction
                    onClick={() => {
                      const ok = confirm(
                        `Delete model '${currentId}'? References in classes will remain, but become warnings.`,
                      );
                      if (!ok) return;
                      updateRouting((d) => {
                        delete d.models[currentId];
                      });
                      setSelected(null);
                    }}
                  >
                    Delete model
                  </InlineAction>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
    </section>
  );
}
