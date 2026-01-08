import React, { useEffect, useMemo, useRef, useState } from "react";
import type { RoutingFileV1 } from "../../routing/types";
import { InlineAction, OverflowMenu, ViewHeader } from "../components";

function moveItem<T>(arr: T[], from: number, to: number): T[] {
  if (from === to) return arr;
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  if (item === undefined) return arr;
  next.splice(to, 0, item);
  return next;
}

export function ClassesEditor({
  routing,
  updateRouting,
  focusClassKey,
  focusIndex,
  focusRequestId,
}: {
  routing: RoutingFileV1;
  updateRouting: (mutate: (draft: RoutingFileV1) => void, opts?: { silent?: boolean }) => void;
  focusClassKey?: string;
  focusIndex?: number;
  focusRequestId?: number;
}) {
  const classKeys = useMemo(() => Object.keys(routing.classes ?? {}).sort(), [routing.classes]);
  const modelKeys = useMemo(() => Object.keys(routing.models ?? {}).sort(), [routing.models]);

  const [selectedClass, setSelectedClass] = useState<string>(() => classKeys[0] ?? "default");
  const [addingClass, setAddingClass] = useState(false);
  const [newClassKey, setNewClassKey] = useState("");

  const [addingModel, setAddingModel] = useState(false);
  const [newModelId, setNewModelId] = useState("");

  const [dragFrom, setDragFrom] = useState<number | null>(null);
  const [announcement, setAnnouncement] = useState("");

  const classKeyDraftRef = useRef<HTMLInputElement | null>(null);
  const addModelInputRef = useRef<HTMLInputElement | null>(null);
  const addClassInputRef = useRef<HTMLInputElement | null>(null);
  const rowRefs = useRef<Array<HTMLDivElement | null>>([]);
  const lastFocusId = useRef<number | null>(null);

  const clsKey = classKeys.includes(selectedClass) ? selectedClass : classKeys[0] ?? "default";
  const sequence = routing.classes?.[clsKey] ?? [];

  const [classKeyDraft, setClassKeyDraft] = useState(clsKey);
  useEffect(() => setClassKeyDraft(clsKey), [clsKey]);

  const renameClass = (from: string, to: string) => {
    if (routing.classes?.[to]) {
      setAnnouncement(`Class '${to}' already exists.`);
      setClassKeyDraft(from);
      return;
    }
    updateRouting((d) => {
      if (d.classes[to]) return;
      d.classes[to] = d.classes[from] ?? [];
      delete d.classes[from];
      if (d.defaults.licensed === from) d.defaults.licensed = to;
      if (d.defaults.unlicensed === from) d.defaults.unlicensed = to;
      for (const [k, v] of Object.entries(d.legacyPreferenceMap ?? {})) {
        if (v.kind === "class" && v.class === from) (d.legacyPreferenceMap![k] as any).class = to;
      }
    });
    setSelectedClass(to);
  };

  useEffect(() => {
    if (!focusRequestId) return;
    if (lastFocusId.current === focusRequestId) return;
    lastFocusId.current = focusRequestId;

    if (focusClassKey && routing.classes?.[focusClassKey]) {
      setSelectedClass(focusClassKey);
    }

    requestAnimationFrame(() => {
      if (focusIndex !== undefined) rowRefs.current[focusIndex]?.focus();
      else classKeyDraftRef.current?.focus();
    });
  }, [focusClassKey, focusIndex, focusRequestId, routing.classes]);

  return (
    <section className="view" aria-label="Classes">
      <ViewHeader title="Classes" subtitle="Ordered fallback sequences. Order matters." />

      <div className="view-body">
        <div className="hint">Order matters. The first available model is used.</div>

        <div className="split-pane split-pane-classes">
          <section className="pane pane-narrow" aria-label="Class list">
            <div className="list" role="listbox" aria-label="Classes">
              {classKeys.map((k) => {
                const isSel = k === clsKey;
                const count = (routing.classes?.[k] ?? []).length;
                return (
                  <button
                    key={k}
                    type="button"
                    className="list-item"
                    onClick={() => setSelectedClass(k)}
                    aria-current={isSel ? "page" : undefined}
                    role="option"
                    aria-selected={isSel}
                  >
                    <div className="list-item-title">{k}</div>
                    <div className="list-item-meta muted">{`(${count})`}</div>
                  </button>
                );
              })}
              {classKeys.length === 0 ? <div className="muted">No classes yet.</div> : null}
            </div>

            <div className="add-row">
              {!addingClass ? (
                <InlineAction
                  onClick={() => {
                    setAddingClass(true);
                    requestAnimationFrame(() => addClassInputRef.current?.focus());
                  }}
                >
                  + Add class
                </InlineAction>
              ) : (
                <div className="add-inline">
                  <input
                    ref={addClassInputRef}
                    value={newClassKey}
                    onChange={(e) => setNewClassKey(e.target.value)}
                    placeholder="new class key (e.g. frontier)"
                    className="input"
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      const k = newClassKey.trim();
                      if (!k) return;
                      updateRouting((d) => {
                        d.classes ??= {};
                        if (d.classes[k]) return;
                        d.classes[k] = [];
                      });
                      setSelectedClass(k);
                      setNewClassKey("");
                      setAddingClass(false);
                    }}
                    aria-label="New class key"
                  />
                  <InlineAction
                    onClick={() => {
                      setNewClassKey("");
                      setAddingClass(false);
                    }}
                  >
                    Cancel
                  </InlineAction>
                </div>
              )}
            </div>
          </section>

          <section className="pane" aria-label="Class editor">
            <div className="details">
              <div className="row-between">
                <label className="field" style={{ flex: 1 }}>
                  <div className="field-label">Class key</div>
                  <input
                    ref={classKeyDraftRef}
                    value={classKeyDraft}
                    onChange={(e) => setClassKeyDraft(e.target.value)}
                    onBlur={() => {
                      const next = classKeyDraft.trim();
                      if (!next || next === clsKey) {
                        setClassKeyDraft(clsKey);
                        return;
                      }
                      renameClass(clsKey, next);
                    }}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter") return;
                      const next = classKeyDraft.trim();
                      if (!next || next === clsKey) {
                        setClassKeyDraft(clsKey);
                        return;
                      }
                      renameClass(clsKey, next);
                    }}
                    className="input mono"
                    aria-label="Class key"
                  />
                </label>

                <OverflowMenu
                  items={[
                    {
                      label: "Delete class",
                      onSelect: () => {
                        const ok = confirm(
                          `Delete class '${clsKey}'? Defaults/legacy references may need updating.`,
                        );
                        if (!ok) return;
                        updateRouting((d) => {
                          delete d.classes[clsKey];
                        });
                        const next = classKeys.filter((x) => x !== clsKey)[0] ?? "default";
                        setSelectedClass(next);
                      },
                      disabled: classKeys.length === 0,
                    },
                  ]}
                  ariaLabel="Class actions"
                />
              </div>

              <div className="sequence" role="list" aria-label="Model sequence">
                {sequence.map((modelId, idx) => (
                  <div
                    key={`${modelId}-${idx}`}
                    ref={(el) => {
                      rowRefs.current[idx] = el;
                    }}
                    className="sequence-row"
                    role="listitem"
                    tabIndex={0}
                    draggable
                    onDragStart={() => setDragFrom(idx)}
                    onDragOver={(e) => {
                      e.preventDefault();
                    }}
                    onDrop={() => {
                      if (dragFrom === null) return;
                      const from = dragFrom;
                      const to = idx;
                      setDragFrom(null);
                      if (from === to) return;
                      updateRouting((d) => {
                        const seq = d.classes?.[clsKey] ?? [];
                        d.classes[clsKey] = moveItem(seq, from, to);
                      });
                      setAnnouncement(`Moved to position ${to + 1}`);
                      requestAnimationFrame(() => rowRefs.current[to]?.focus());
                    }}
                    onKeyDown={(e) => {
                      if (!e.altKey) return;
                      if (e.key !== "ArrowUp" && e.key !== "ArrowDown") return;
                      e.preventDefault();
                      const dir = e.key === "ArrowUp" ? -1 : 1;
                      const nextIdx = idx + dir;
                      if (nextIdx < 0 || nextIdx >= sequence.length) return;
                      updateRouting((d) => {
                        const seq = d.classes?.[clsKey] ?? [];
                        d.classes[clsKey] = moveItem(seq, idx, nextIdx);
                      });
                      setAnnouncement(`Moved to position ${nextIdx + 1}`);
                      requestAnimationFrame(() => rowRefs.current[nextIdx]?.focus());
                    }}
                  >
                    <span className="drag-handle" aria-hidden="true">
                      ≡
                    </span>
                    <span className="mono">{modelId}</span>
                    <span className="sequence-spacer" />
                    <InlineAction
                      onClick={(e) => {
                        e.stopPropagation();
                        updateRouting((d) => {
                          d.classes[clsKey] = (d.classes?.[clsKey] ?? []).filter((_, i) => i !== idx);
                        });
                        setAnnouncement(`Removed ${modelId}`);
                      }}
                      aria-label={`Remove ${modelId}`}
                    >
                      Remove
                    </InlineAction>
                  </div>
                ))}
                {sequence.length === 0 ? <div className="muted">No models yet.</div> : null}
              </div>

              <div className="add-row">
                {!addingModel ? (
                  <InlineAction
                    onClick={() => {
                      setAddingModel(true);
                      requestAnimationFrame(() => addModelInputRef.current?.focus());
                    }}
                  >
                    + Add model
                  </InlineAction>
                ) : (
                  <div className="add-inline">
                    <input
                      ref={addModelInputRef}
                      list="models-for-class"
                      value={newModelId}
                      onChange={(e) => setNewModelId(e.target.value)}
                      placeholder="model id (searchable)"
                      className="input"
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        const id = newModelId.trim();
                        if (!id) return;
                        updateRouting((d) => {
                          d.classes[clsKey] = [...(d.classes?.[clsKey] ?? []), id];
                        });
                        setAnnouncement(`Added ${id}`);
                        setNewModelId("");
                        setAddingModel(false);
                      }}
                      aria-label="Add model id"
                    />
                    <datalist id="models-for-class">
                      {modelKeys.map((id) => (
                        <option key={id} value={id} />
                      ))}
                    </datalist>
                    <InlineAction
                      onClick={() => {
                        setNewModelId("");
                        setAddingModel(false);
                      }}
                    >
                      Cancel
                    </InlineAction>
                  </div>
                )}
              </div>
            </div>

            <div className="sr-only" aria-live="polite">
              {announcement}
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}
