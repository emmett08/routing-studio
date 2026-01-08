import React, { useEffect, useMemo, useRef, useState } from "react";
import type { RoutingFileV1 } from "../../routing/types";
import { InlineAction, ViewHeader } from "../components";

export function LegacyMapEditor({
  routing,
  updateRouting,
  focusKey,
  focusRequestId,
}: {
  routing: RoutingFileV1;
  updateRouting: (mutate: (draft: RoutingFileV1) => void, opts?: { silent?: boolean }) => void;
  focusKey?: string;
  focusRequestId?: number;
}) {
  const [newKey, setNewKey] = useState("");
  const [newKind, setNewKind] = useState<"class" | "explicit">("class");
  const [newTarget, setNewTarget] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);

  const classKeys = useMemo(() => Object.keys(routing.classes ?? {}).sort(), [routing.classes]);
  const modelKeys = useMemo(() => Object.keys(routing.models ?? {}).sort(), [routing.models]);

  const entries = useMemo(
    () =>
      Object.entries(routing.legacyPreferenceMap ?? {}).sort(([a], [b]) => a.localeCompare(b)),
    [routing.legacyPreferenceMap],
  );

  useEffect(() => {
    if (!focusRequestId || !focusKey) return;
    const el = rootRef.current?.querySelector<HTMLInputElement>(
      `input[data-legacy-key="${CSS.escape(focusKey)}"]`,
    );
    el?.focus();
  }, [focusKey, focusRequestId]);

  return (
    <section className="view" aria-label="Legacy map">
      <ViewHeader title="Legacy map" subtitle="Advanced. Map legacy preference strings to a class or explicit model." />

      <div ref={rootRef} className="view-body">
        <div className="add-row">
          <InlineAction
            onClick={() => {
              const k = newKey.trim();
              const t = newTarget.trim();
              if (!k || !t) return;
              updateRouting((d) => {
                d.legacyPreferenceMap ??= {};
                d.legacyPreferenceMap[k] =
                  newKind === "class" ? { kind: "class", class: t } : { kind: "explicit", model: t };
              });
              setNewKey("");
              setNewTarget("");
            }}
          >
            + Add mapping
          </InlineAction>
        </div>

        <div className="form-row">
          <input
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            placeholder='legacy key (e.g. "gpt5")'
            className="input"
          />
          <select value={newKind} onChange={(e) => setNewKind(e.target.value as any)} className="input">
            <option value="class">class</option>
            <option value="explicit">explicit model</option>
          </select>

          {newKind === "class" ? (
            <>
              <input
                list="legacy-classes"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                placeholder="class key"
                className="input"
              />
              <datalist id="legacy-classes">
                {classKeys.map((k) => (
                  <option key={k} value={k} />
                ))}
              </datalist>
            </>
          ) : (
            <>
              <input
                list="legacy-models"
                value={newTarget}
                onChange={(e) => setNewTarget(e.target.value)}
                placeholder="model id (provider:model)"
                className="input"
              />
              <datalist id="legacy-models">
                {modelKeys.map((k) => (
                  <option key={k} value={k} />
                ))}
              </datalist>
            </>
          )}
        </div>

        <table className="table" aria-label="Legacy map table">
          <thead>
            <tr>
              <th>Legacy key</th>
              <th>Kind</th>
              <th>Target</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {entries.map(([k, v]) => (
              <tr key={k}>
                <td className="mono">{k}</td>
                <td>
                  <select
                    value={v.kind}
                    onChange={(e) => {
                      const nextKind = e.target.value as "class" | "explicit";
                      updateRouting((d) => {
                        const current = d.legacyPreferenceMap?.[k];
                        if (!current) return;
                        if (nextKind === current.kind) return;
                        d.legacyPreferenceMap![k] =
                          nextKind === "class"
                            ? { kind: "class", class: classKeys[0] ?? "default" }
                            : { kind: "explicit", model: modelKeys[0] ?? "" };
                      });
                    }}
                    className="input"
                    aria-label={`Kind: ${k}`}
                  >
                    <option value="class">class</option>
                    <option value="explicit">explicit</option>
                  </select>
                </td>
                <td>
                  {v.kind === "class" ? (
                    <input
                      data-legacy-key={k}
                      list="legacy-classes"
                      value={v.class}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateRouting(
                          (d) => {
                            const cur = d.legacyPreferenceMap?.[k];
                            if (!cur || cur.kind !== "class") return;
                            cur.class = val;
                          },
                          { silent: true },
                        );
                      }}
                      className="input"
                      aria-label={`Target class: ${k}`}
                    />
                  ) : (
                    <input
                      data-legacy-key={k}
                      list="legacy-models"
                      value={v.model}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateRouting(
                          (d) => {
                            const cur = d.legacyPreferenceMap?.[k];
                            if (!cur || cur.kind !== "explicit") return;
                            cur.model = val;
                          },
                          { silent: true },
                        );
                      }}
                      className="input"
                      aria-label={`Target model: ${k}`}
                    />
                  )}
                </td>
                <td className="cell-actions">
                  <InlineAction
                    onClick={() => {
                      const ok = confirm(`Remove legacy mapping '${k}'?`);
                      if (!ok) return;
                      updateRouting((d) => {
                        delete d.legacyPreferenceMap?.[k];
                      });
                    }}
                  >
                    Remove
                  </InlineAction>
                </td>
              </tr>
            ))}
            {entries.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  No legacy mappings yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
