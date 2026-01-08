import React, { useMemo, useState } from "react";
import type { RoutingFileV1 } from "../../routing/types";
import { Help, SectionTitle, SmallButton } from "../components";

export function LegacyMapEditor({
  routing,
  updateRouting,
}: {
  routing: RoutingFileV1;
  updateRouting: (mutate: (draft: RoutingFileV1) => void, opts?: { silent?: boolean }) => void;
}) {
  const [newKey, setNewKey] = useState("");
  const [newKind, setNewKind] = useState<"class" | "explicit">("class");
  const [newTarget, setNewTarget] = useState("");

  const classKeys = useMemo(() => Object.keys(routing.classes ?? {}).sort(), [routing.classes]);
  const modelKeys = useMemo(() => Object.keys(routing.models ?? {}).sort(), [routing.models]);

  const entries = useMemo(
    () =>
      Object.entries(routing.legacyPreferenceMap ?? {}).sort(([a], [b]) => a.localeCompare(b)),
    [routing.legacyPreferenceMap],
  );

  return (
    <div className="panel">
      <SectionTitle
        title="Legacy preference map"
        subtitle="Map old/alias preference strings to a class or explicit model."
      />
      <div className="body">
        <Help>
          Useful when your callers send older preference names. For example: map “gpt5” → an explicit
          model, or “sonnet4.5” → a class like “frontier”.
        </Help>

        <div className="hr" />

        <div className="card">
          <div className="small">Add mapping</div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 8 }}>
            <input
              value={newKey}
              onChange={(e) => setNewKey(e.target.value)}
              placeholder='legacy key (e.g. "gpt5")'
              style={{ width: 220 }}
            />
            <select value={newKind} onChange={(e) => setNewKind(e.target.value as any)}>
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
                  style={{ width: 220 }}
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
                  style={{ width: 260 }}
                />
                <datalist id="legacy-models">
                  {modelKeys.map((k) => (
                    <option key={k} value={k} />
                  ))}
                </datalist>
              </>
            )}

            <SmallButton
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
              Add
            </SmallButton>
          </div>
        </div>

        <div className="hr" />

        <table className="table">
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
                  >
                    <option value="class">class</option>
                    <option value="explicit">explicit</option>
                  </select>
                </td>
                <td>
                  {v.kind === "class" ? (
                    <input
                      list="legacy-classes"
                      value={v.class}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateRouting((d) => {
                          const cur = d.legacyPreferenceMap?.[k];
                          if (!cur || cur.kind !== "class") return;
                          cur.class = val;
                        }, { silent: true });
                      }}
                      style={{ width: 260 }}
                    />
                  ) : (
                    <input
                      list="legacy-models"
                      value={v.model}
                      onChange={(e) => {
                        const val = e.target.value;
                        updateRouting((d) => {
                          const cur = d.legacyPreferenceMap?.[k];
                          if (!cur || cur.kind !== "explicit") return;
                          cur.model = val;
                        }, { silent: true });
                      }}
                      style={{ width: 320 }}
                    />
                  )}
                </td>
                <td>
                  <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                    <SmallButton
                      onClick={() => {
                        const ok = confirm(`Remove legacy mapping '${k}'?`);
                        if (!ok) return;
                        updateRouting((d) => {
                          delete d.legacyPreferenceMap?.[k];
                        });
                      }}
                    >
                      Remove
                    </SmallButton>
                  </div>
                </td>
              </tr>
            ))}
            {!entries.length ? (
              <tr>
                <td colSpan={4} className="small">
                  No legacy mappings yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
