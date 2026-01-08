import React, { useMemo, useState } from "react";
import type { ClassRule, RoutingFileV1, RoutingUiConfig } from "../../routing/types";
import { suggestModelsForClass } from "../../routing/validate";
import { Help, InlineCode, SectionTitle, SmallButton } from "../components";

function parseModelIds(text: string): string[] {
  return text
    .split(/[,\n]/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

function uniq<T>(arr: T[]): T[] {
  return Array.from(new Set(arr));
}

export function ClassesEditor({
  routing,
  updateRouting,
  uiConfig,
  saveUi,
}: {
  routing: RoutingFileV1;
  updateRouting: (mutate: (draft: RoutingFileV1) => void, opts?: { silent?: boolean }) => void;
  uiConfig: RoutingUiConfig;
  saveUi: (cfg: RoutingUiConfig, opts?: { silent?: boolean }) => void;
}) {
  const classKeys = useMemo(() => Object.keys(routing.classes ?? {}).sort(), [routing.classes]);
  const modelKeys = useMemo(() => Object.keys(routing.models ?? {}).sort(), [routing.models]);

  const [selectedClass, setSelectedClass] = useState<string>(classKeys[0] ?? "default");
  const [newClassKey, setNewClassKey] = useState("");
  const [addModelText, setAddModelText] = useState("");
  const [quickAdd, setQuickAdd] = useState("");

  const clsKey = classKeys.includes(selectedClass) ? selectedClass : classKeys[0] ?? "default";
  const sequence = routing.classes?.[clsKey] ?? [];

  const meta = uiConfig.classMeta?.[clsKey] ?? { key: clsKey, label: clsKey, rules: [] };
  const rules = (meta.rules ?? []) as ClassRule[];

  const availableTags = useMemo(() => {
    const tags = new Set<string>();
    for (const m of Object.values(routing.models ?? {})) {
      for (const t of m.tags ?? []) tags.add(t);
    }
    return Array.from(tags).sort();
  }, [routing.models]);

  const metricKeys = useMemo(() => uiConfig.metricDefinitions.map((d) => d.key), [uiConfig.metricDefinitions]);

  const suggestions = useMemo(() => {
    if (!rules.length) return [];
    return suggestModelsForClass(routing, rules).slice(0, 50);
  }, [routing, rules]);

  const hasSuggestions = suggestions.length > 0;

  const ensureMeta = (key: string) => {
    if (uiConfig.classMeta?.[key]) return;
    saveUi({
      ...uiConfig,
      classMeta: {
        ...uiConfig.classMeta,
        [key]: { key, label: key, description: "", icon: "🏷️", rules: [] },
      },
    });
  };

  return (
    <div className="panel">
      <SectionTitle
        title="Classes"
        subtitle="Classes are configurable categories (frontier, fast, cheap, …)."
      />
      <div className="body">
        <Help>
          <div>
            A <strong>class</strong> is an ordered fallback list of models. You can define any class
            names you like, and describe what they mean (label, icon, rules) in <em>UI config</em>.
          </div>
        </Help>

        <div className="hr" />

        <div className="split">
          <div className="card" style={{ minHeight: 520 }}>
            <div className="small">Class list</div>

            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <input
                value={newClassKey}
                onChange={(e) => setNewClassKey(e.target.value)}
                placeholder="new class key (e.g. frontier)"
                style={{ width: "100%" }}
              />
              <SmallButton
                onClick={() => {
                  const k = newClassKey.trim();
                  if (!k) return;
                  updateRouting((d) => {
                    d.classes ??= {};
                    if (d.classes[k]) return;
                    d.classes[k] = [];
                  });
                  ensureMeta(k);
                  setSelectedClass(k);
                  setNewClassKey("");
                }}
              >
                Add
              </SmallButton>
            </div>

            <div className="hr" />

            <div className="list" style={{ maxHeight: 440, overflow: "auto" }}>
              {classKeys.map((k) => {
                const isSel = k === clsKey;
                const label = uiConfig.classMeta?.[k]?.label ?? k;
                const icon = uiConfig.classMeta?.[k]?.icon ?? "🏷️";
                return (
                  <button
                    key={k}
                    onClick={() => setSelectedClass(k)}
                    aria-current={isSel ? "page" : undefined}
                    style={{ justifyContent: "flex-start", gap: 10 }}
                  >
                    <span aria-hidden="true">{icon}</span>
                    <span style={{ textTransform: "none" }}>{label}</span>
                    <span style={{ flex: 1 }} />
                    <span className="pill">{(routing.classes?.[k] ?? []).length}</span>
                  </button>
                );
              })}
              {!classKeys.length ? <div className="small">No classes yet.</div> : null}
            </div>

            <div className="hr" />

            <div className="small">
              Class key: <InlineCode>{clsKey}</InlineCode>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
              <SmallButton
                onClick={() => {
                  const nextKey = prompt("Rename class key:", clsKey);
                  const k = (nextKey ?? "").trim();
                  if (!k || k === clsKey) return;
                  updateRouting((d) => {
                    if (d.classes[k]) return;
                    d.classes[k] = d.classes[clsKey] ?? [];
                    delete d.classes[clsKey];

                    if (d.defaults.licensed === clsKey) d.defaults.licensed = k;
                    if (d.defaults.unlicensed === clsKey) d.defaults.unlicensed = k;

                    for (const [lk, lv] of Object.entries(d.legacyPreferenceMap ?? {})) {
                      if (lv.kind === "class" && lv.class === clsKey) {
                        (d.legacyPreferenceMap![lk] as any).class = k;
                      }
                    }
                  });

                  // rename UI meta
                  const nextMeta = { ...(uiConfig.classMeta ?? {}) };
                  const oldMeta = nextMeta[clsKey];
                  delete nextMeta[clsKey];
                  nextMeta[k] = {
                    ...(oldMeta ?? { label: k, icon: "🏷️", rules: [] }),
                    key: k,
                  };
                  saveUi({ ...uiConfig, classMeta: nextMeta });

                  setSelectedClass(k);
                }}
              >
                Rename
              </SmallButton>

              <SmallButton
                onClick={() => {
                  const ok = confirm(
                    `Delete class '${clsKey}'? Defaults/legacy references may need updating.`,
                  );
                  if (!ok) return;
                  updateRouting((d) => {
                    delete d.classes[clsKey];
                  });
                  setSelectedClass(classKeys.filter((x) => x !== clsKey)[0] ?? "default");
                }}
              >
                Delete
              </SmallButton>
            </div>
          </div>

          <div className="card" style={{ minHeight: 520 }}>
            <div className="small">Class editor</div>

            <div className="hr" />

            <div className="list">
              <div className="card">
                <div className="small">Meaning (UI only)</div>
                <div className="small" style={{ marginTop: 6 }}>
                  These fields do <strong>not</strong> change the routing JSON unless you choose to
                  store metadata in it. They’re saved locally for your team’s shared understanding.
                </div>

                <div className="hr" />

                <div className="split">
                  <label className="card">
                    <div className="small">Label</div>
                    <input
                      value={meta.label ?? ""}
                      onChange={(e) => {
                        const next = e.target.value;
                        saveUi({
                          ...uiConfig,
                          classMeta: {
                            ...uiConfig.classMeta,
                            [clsKey]: { ...meta, key: clsKey, label: next },
                          },
                        });
                      }}
                      style={{ width: "100%", marginTop: 8 }}
                    />
                  </label>

                  <label className="card">
                    <div className="small">Icon</div>
                    <input
                      value={meta.icon ?? ""}
                      onChange={(e) => {
                        const next = e.target.value;
                        saveUi({
                          ...uiConfig,
                          classMeta: {
                            ...uiConfig.classMeta,
                            [clsKey]: { ...meta, key: clsKey, icon: next },
                          },
                        });
                      }}
                      style={{ width: "100%", marginTop: 8 }}
                      placeholder="e.g. 🚀"
                    />
                  </label>
                </div>

                <label className="card">
                  <div className="small">Description</div>
                  <input
                    value={meta.description ?? ""}
                    onChange={(e) => {
                      const next = e.target.value;
                      saveUi({
                        ...uiConfig,
                        classMeta: {
                          ...uiConfig.classMeta,
                          [clsKey]: { ...meta, key: clsKey, description: next },
                        },
                      });
                    }}
                    style={{ width: "100%", marginTop: 8 }}
                    placeholder="What does this class mean for your organisation?"
                  />
                </label>

                <div className="hr" />

                <div className="small">
                  Optional rules for discoverability (used to suggest models when new ones are added).
                </div>

                <div className="hr" />

                <div className="list">
                  {(rules ?? []).map((r, idx) => (
                    <div key={idx} className="card">
                      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                        <select
                          value={r.type}
                          onChange={(e) => {
                            const nextType = e.target.value as any;
                            const nextRule: ClassRule =
                              nextType === "tag"
                                ? { type: "tag", tag: availableTags[0] ?? "" }
                                : { type: "metric", metric: metricKeys[0] ?? "reasoning", op: ">=", value: 0.8 };
                            const nextRules = rules.slice();
                            nextRules[idx] = nextRule;
                            saveUi({
                              ...uiConfig,
                              classMeta: { ...uiConfig.classMeta, [clsKey]: { ...meta, key: clsKey, rules: nextRules } },
                            });
                          }}
                        >
                          <option value="tag">tag</option>
                          <option value="metric">metric</option>
                        </select>

                        {r.type === "tag" ? (
                          <select
                            value={r.tag}
                            onChange={(e) => {
                              const nextRules = rules.slice();
                              nextRules[idx] = { type: "tag", tag: e.target.value };
                              saveUi({
                                ...uiConfig,
                                classMeta: { ...uiConfig.classMeta, [clsKey]: { ...meta, key: clsKey, rules: nextRules } },
                              });
                            }}
                          >
                            {availableTags.map((t) => (
                              <option key={t} value={t}>
                                {t}
                              </option>
                            ))}
                            {!availableTags.length ? <option value="">(no tags yet)</option> : null}
                          </select>
                        ) : (
                          <>
                            <select
                              value={r.metric}
                              onChange={(e) => {
                                const nextRules = rules.slice();
                                nextRules[idx] = { ...r, metric: e.target.value };
                                saveUi({
                                  ...uiConfig,
                                  classMeta: { ...uiConfig.classMeta, [clsKey]: { ...meta, key: clsKey, rules: nextRules } },
                                });
                              }}
                            >
                              {metricKeys.map((k) => (
                                <option key={k} value={k}>
                                  {k}
                                </option>
                              ))}
                            </select>
                            <select
                              value={r.op}
                              onChange={(e) => {
                                const nextRules = rules.slice();
                                nextRules[idx] = { ...r, op: e.target.value as any };
                                saveUi({
                                  ...uiConfig,
                                  classMeta: { ...uiConfig.classMeta, [clsKey]: { ...meta, key: clsKey, rules: nextRules } },
                                });
                              }}
                            >
                              <option value=">=">&ge;</option>
                              <option value=">">&gt;</option>
                              <option value="<=">&le;</option>
                              <option value="<">&lt;</option>
                            </select>
                            <input
                              type="number"
                              step={0.05}
                              min={0}
                              max={1}
                              value={r.value}
                              onChange={(e) => {
                                const nextRules = rules.slice();
                                nextRules[idx] = { ...r, value: Number(e.target.value) };
                                saveUi({
                                  ...uiConfig,
                                  classMeta: { ...uiConfig.classMeta, [clsKey]: { ...meta, key: clsKey, rules: nextRules } },
                                });
                              }}
                              style={{ width: 90 }}
                            />
                          </>
                        )}

                        <span style={{ flex: 1 }} />

                        <SmallButton
                          onClick={() => {
                            const nextRules = rules.slice();
                            nextRules.splice(idx, 1);
                            saveUi({
                              ...uiConfig,
                              classMeta: { ...uiConfig.classMeta, [clsKey]: { ...meta, key: clsKey, rules: nextRules } },
                            });
                          }}
                        >
                          Remove rule
                        </SmallButton>
                      </div>
                    </div>
                  ))}

                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    <SmallButton
                      onClick={() => {
                        const nextRules = [...(rules ?? []), { type: "tag", tag: availableTags[0] ?? "" } as ClassRule];
                        saveUi({
                          ...uiConfig,
                          classMeta: { ...uiConfig.classMeta, [clsKey]: { ...meta, key: clsKey, rules: nextRules } },
                        });
                      }}
                    >
                      + Tag rule
                    </SmallButton>
                    <SmallButton
                      onClick={() => {
                        const nextRules = [
                          ...(rules ?? []),
                          { type: "metric", metric: metricKeys[0] ?? "reasoning", op: ">=", value: 0.8 } as ClassRule,
                        ];
                        saveUi({
                          ...uiConfig,
                          classMeta: { ...uiConfig.classMeta, [clsKey]: { ...meta, key: clsKey, rules: nextRules } },
                        });
                      }}
                    >
                      + Metric rule
                    </SmallButton>
                  </div>

                  {hasSuggestions ? (
                    <div className="card" style={{ borderColor: "rgba(94,234,212,0.35)" }}>
                      <div className="small">Suggested models (top {suggestions.length})</div>
                      <div className="small" style={{ marginTop: 6 }}>
                        Based on rules above. Use this to keep your class discoverable as you add new
                        models.
                      </div>

                      <div className="hr" />

                      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                        <SmallButton
                          onClick={() => {
                            updateRouting((d) => {
                              d.classes[clsKey] = suggestions;
                            });
                          }}
                        >
                          Replace sequence
                        </SmallButton>
                        <SmallButton
                          onClick={() => {
                            updateRouting((d) => {
                              const cur = d.classes[clsKey] ?? [];
                              const merged = uniq([...cur, ...suggestions]);
                              d.classes[clsKey] = merged;
                            });
                          }}
                        >
                          Append missing
                        </SmallButton>
                      </div>

                      <div className="hr" />

                      <div className="codebox" style={{ maxHeight: 140 }}>
                        {suggestions.join("\n")}
                      </div>
                    </div>
                  ) : (
                    <div className="small">
                      No suggestions yet. Add tags/metrics to models (and rules above) to enable
                      discoverable suggestions.
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="small">Sequence (routing JSON)</div>
                <div className="small" style={{ marginTop: 6 }}>
                  Ordered fallback list. First match wins. Use <InlineCode>Up/Down</InlineCode> to
                  control priority.
                </div>

                <div className="hr" />

                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <input
                    list="class-models"
                    value={quickAdd}
                    onChange={(e) => setQuickAdd(e.target.value)}
                    placeholder="Add model…"
                    style={{ width: 280 }}
                  />
                  <datalist id="class-models">
                    {modelKeys.map((m) => (
                      <option key={m} value={m} />
                    ))}
                  </datalist>

                  <SmallButton
                    onClick={() => {
                      const id = quickAdd.trim();
                      if (!id) return;
                      updateRouting((d) => {
                        const cur = d.classes[clsKey] ?? [];
                        if (!cur.includes(id)) cur.push(id);
                        d.classes[clsKey] = cur;
                      });
                      setQuickAdd("");
                    }}
                  >
                    Add
                  </SmallButton>

                  <SmallButton
                    onClick={() => {
                      const txt = prompt("Paste model ids (comma/newline separated):", "");
                      if (!txt) return;
                      const ids = parseModelIds(txt);
                      if (!ids.length) return;
                      updateRouting((d) => {
                        const cur = d.classes[clsKey] ?? [];
                        d.classes[clsKey] = uniq([...cur, ...ids]);
                      });
                    }}
                  >
                    Paste…
                  </SmallButton>
                </div>

                <div className="hr" />

                <table className="table">
                  <thead>
                    <tr>
                      <th style={{ width: 80 }}>Order</th>
                      <th>Model</th>
                      <th style={{ width: 220 }}>Tags</th>
                      <th style={{ width: 220 }}>Scores</th>
                      <th style={{ width: 140 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {sequence.map((id, idx) => {
                      const info = routing.models?.[id];
                      const tags = (info?.tags ?? []).slice(0, 4);
                      return (
                        <tr key={`${id}-${idx}`}>
                          <td className="small">#{idx + 1}</td>
                          <td className="mono">{id}</td>
                          <td className="small">{tags.join(", ") || "—"}</td>
                          <td className="small">
                            {info
                              ? `R ${info.reasoning.toFixed(2)} · S ${info.latency.toFixed(2)} · C ${info.cost.toFixed(2)}`
                              : "—"}
                          </td>
                          <td>
                            <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                              <SmallButton
                                onClick={() => {
                                  if (idx === 0) return;
                                  updateRouting((d) => {
                                    const arr = d.classes[clsKey] ?? [];
                                    [arr[idx - 1], arr[idx]] = [arr[idx], arr[idx - 1]];
                                  }, { silent: true });
                                }}
                                disabled={idx === 0}
                              >
                                Up
                              </SmallButton>

                              <SmallButton
                                onClick={() => {
                                  if (idx === sequence.length - 1) return;
                                  updateRouting((d) => {
                                    const arr = d.classes[clsKey] ?? [];
                                    [arr[idx], arr[idx + 1]] = [arr[idx + 1], arr[idx]];
                                  }, { silent: true });
                                }}
                                disabled={idx === sequence.length - 1}
                              >
                                Down
                              </SmallButton>

                              <SmallButton
                                onClick={() => {
                                  updateRouting((d) => {
                                    const arr = d.classes[clsKey] ?? [];
                                    arr.splice(idx, 1);
                                  }, { silent: true });
                                }}
                              >
                                Remove
                              </SmallButton>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {!sequence.length ? (
                      <tr>
                        <td colSpan={5} className="small">
                          Empty. Add models above or use rule suggestions.
                        </td>
                      </tr>
                    ) : null}
                  </tbody>
                </table>

                <div className="hr" />

                <div className="small">
                  Advanced: you can also add a model id that is not in <InlineCode>models</InlineCode>{" "}
                  — routing will still work, but validation will warn that metadata is missing.
                </div>

                <div className="hr" />

                <div>
                  <div className="small">Quick add (multi-line)</div>
                  <textarea
                    value={addModelText}
                    onChange={(e) => setAddModelText(e.target.value)}
                    placeholder={"openai:gpt-4o-mini\nopenai:gpt-5.1"}
                    style={{ width: "100%", minHeight: 90, marginTop: 8 }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 8, gap: 8 }}>
                    <SmallButton
                      onClick={() => {
                        const ids = parseModelIds(addModelText);
                        if (!ids.length) return;
                        updateRouting((d) => {
                          const cur = d.classes[clsKey] ?? [];
                          d.classes[clsKey] = uniq([...cur, ...ids]);
                        });
                        setAddModelText("");
                      }}
                    >
                      Add all
                    </SmallButton>
                    <SmallButton
                      onClick={() => setAddModelText("")}
                      title="Clear"
                    >
                      Clear
                    </SmallButton>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hr" />

        <div className="small">
          Your “frontier/cheap/fast” categories are just class keys. Rename them freely — the meaning
          lives in your UI config, documentation, or consumer logic.
        </div>
      </div>
    </div>
  );
}
