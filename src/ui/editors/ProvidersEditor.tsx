import React, { useMemo, useState } from "react";
import type { RoutingFileV1 } from "../../routing/types";
import { Help, SectionTitle, SmallButton } from "../components";

export function ProvidersEditor({
  routing,
  updateRouting,
}: {
  routing: RoutingFileV1;
  updateRouting: (mutate: (draft: RoutingFileV1) => void, opts?: { silent?: boolean }) => void;
}) {
  const [newId, setNewId] = useState("");
  const providers = useMemo(
    () => Object.entries(routing.providers ?? {}).sort(([a], [b]) => a.localeCompare(b)),
    [routing.providers],
  );

  return (
    <div className="panel">
      <SectionTitle
        title="Providers"
        subtitle="Enable/disable providers and apply a bias weight."
        right={
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <input
              value={newId}
              onChange={(e) => setNewId(e.target.value)}
              placeholder="provider id (e.g. openai)"
              style={{ width: 220 }}
            />
            <SmallButton
              onClick={() => {
                const id = newId.trim();
                if (!id) return;
                updateRouting((d) => {
                  d.providers ??= {};
                  if (d.providers[id]) return;
                  d.providers[id] = { enabled: true, weight: 0 };
                });
                setNewId("");
              }}
            >
              Add
            </SmallButton>
          </div>
        }
      />
      <div className="body">
        <Help>
          <ul>
            <li>
              <strong>enabled</strong> controls whether this provider can be selected.
            </li>
            <li>
              <strong>weight</strong> is a user-defined bias (you can interpret it however you like).
            </li>
          </ul>
        </Help>

        <div className="hr" />

        <table className="table">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Enabled</th>
              <th>Weight</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {providers.map(([id, cfg]) => (
              <tr key={id}>
                <td className="mono">{id}</td>
                <td>
                  <input
                    type="checkbox"
                    checked={!!cfg.enabled}
                    onChange={(e) =>
                      updateRouting((d) => {
                        d.providers[id]!.enabled = e.target.checked;
                      }, { silent: true })
                    }
                    aria-label={`Enable provider ${id}`}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={Number(cfg.weight)}
                    step={0.01}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      updateRouting((d) => {
                        d.providers[id]!.weight = Number.isFinite(v) ? v : 0;
                      }, { silent: true });
                    }}
                    style={{ width: 120 }}
                    aria-label={`Weight for provider ${id}`}
                  />
                </td>
                <td>
                  <div className="row-actions" style={{ justifyContent: "flex-end" }}>
                    <SmallButton
                      onClick={() => {
                        const ok = confirm(`Remove provider '${id}'? References will become warnings.`);
                        if (!ok) return;
                        updateRouting((d) => {
                          delete d.providers[id];
                        });
                      }}
                    >
                      Remove
                    </SmallButton>
                  </div>
                </td>
              </tr>
            ))}
            {!providers.length ? (
              <tr>
                <td colSpan={4} className="small">
                  No providers yet. Add one above (e.g. <span className="mono">openai</span>).
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
