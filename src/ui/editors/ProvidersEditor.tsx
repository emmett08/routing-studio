import React, { useEffect, useMemo, useRef, useState } from "react";
import type { RoutingFileV1 } from "../../routing/types";
import { InlineAction, ViewHeader } from "../components";

export function ProvidersEditor({
  routing,
  updateRouting,
  focusProviderId,
  focusRequestId,
}: {
  routing: RoutingFileV1;
  updateRouting: (mutate: (draft: RoutingFileV1) => void, opts?: { silent?: boolean }) => void;
  focusProviderId?: string;
  focusRequestId?: number;
}) {
  const [newId, setNewId] = useState("");
  const [adding, setAdding] = useState(false);
  const addInputRef = useRef<HTMLInputElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const providers = useMemo(
    () => Object.entries(routing.providers ?? {}).sort(([a], [b]) => a.localeCompare(b)),
    [routing.providers],
  );

  useEffect(() => {
    if (!focusRequestId) return;
    if (focusProviderId) {
      setAdding(true);
      setNewId(focusProviderId);
      requestAnimationFrame(() => addInputRef.current?.focus());
      return;
    }
    requestAnimationFrame(() => {
      const first = rootRef.current?.querySelector<HTMLInputElement>('input[type="checkbox"]');
      first?.focus();
    });
  }, [focusProviderId, focusRequestId]);

  return (
    <section className="view" aria-label="Providers">
      <ViewHeader title="Providers" subtitle="Enable/disable providers and set weight bias." />

      <div ref={rootRef} className="view-body">
        <div className="add-row">
          {!adding ? (
            <InlineAction
              onClick={() => {
                setAdding(true);
                requestAnimationFrame(() => addInputRef.current?.focus());
              }}
            >
              + Add provider
            </InlineAction>
          ) : (
            <div className="add-inline">
              <input
                ref={addInputRef}
                value={newId}
                onChange={(e) => setNewId(e.target.value)}
                placeholder="provider id (e.g. openai)"
                className="input"
                onKeyDown={(e) => {
                  if (e.key !== "Enter") return;
                  const id = newId.trim();
                  if (!id) return;
                  updateRouting((d) => {
                    d.providers ??= {};
                    if (d.providers[id]) return;
                    d.providers[id] = { enabled: true, weight: 0 };
                  });
                  setNewId("");
                  setAdding(false);
                }}
                aria-label="New provider id"
              />
              <InlineAction
                onClick={() => {
                  setNewId("");
                  setAdding(false);
                }}
              >
                Cancel
              </InlineAction>
            </div>
          )}
        </div>

        <table className="table" aria-label="Providers table">
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
                      updateRouting(
                        (d) => {
                          d.providers[id]!.enabled = e.target.checked;
                        },
                        { silent: true },
                      )
                    }
                    aria-label={`Enabled: ${id}`}
                  />
                </td>
                <td>
                  <input
                    type="number"
                    value={Number(cfg.weight)}
                    step={0.01}
                    onChange={(e) => {
                      const v = Number(e.target.value);
                      updateRouting(
                        (d) => {
                          d.providers[id]!.weight = Number.isFinite(v) ? v : 0;
                        },
                        { silent: true },
                      );
                    }}
                    className="input input-narrow"
                    aria-label={`Weight: ${id}`}
                  />
                </td>
                <td className="cell-actions">
                  <InlineAction
                    onClick={() => {
                      const ok = confirm(
                        `Remove provider '${id}'? References will become warnings.`,
                      );
                      if (!ok) return;
                      updateRouting((d) => {
                        delete d.providers[id];
                      });
                    }}
                  >
                    Remove
                  </InlineAction>
                </td>
              </tr>
            ))}
            {providers.length === 0 ? (
              <tr>
                <td colSpan={4} className="muted">
                  No providers yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
