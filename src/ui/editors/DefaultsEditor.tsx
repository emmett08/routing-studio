import React, { useEffect, useMemo, useRef } from "react";
import type { RoutingFileV1 } from "../../routing/types";
import { InlineCode, ViewHeader } from "../components";

export function DefaultsEditor({
  routing,
  updateRouting,
  focusField,
  focusRequestId,
}: {
  routing: RoutingFileV1;
  updateRouting: (mutate: (draft: RoutingFileV1) => void, opts?: { silent?: boolean }) => void;
  focusField?: "licensed" | "unlicensed";
  focusRequestId?: number;
}) {
  const classKeys = useMemo(() => Object.keys(routing.classes ?? {}).sort(), [routing.classes]);
  const licensedRef = useRef<HTMLSelectElement | null>(null);
  const unlicensedRef = useRef<HTMLSelectElement | null>(null);

  useEffect(() => {
    if (!focusRequestId || !focusField) return;
    if (focusField === "licensed") licensedRef.current?.focus();
    else unlicensedRef.current?.focus();
  }, [focusField, focusRequestId]);

  return (
    <section className="view" aria-label="Defaults">
      <ViewHeader title="Defaults" subtitle="Choose defaults when callers don’t specify." />

      <div className="view-body">
        <div className="hint">
          These must reference an existing class key in <InlineCode>classes</InlineCode>.
        </div>

        <div className="form-grid">
          <label className="field">
            <div className="field-label">Licensed default class</div>
            <select
              ref={licensedRef}
              value={routing.defaults.licensed}
              onChange={(e) =>
                updateRouting((d) => {
                  d.defaults.licensed = e.target.value;
                })
              }
              className="input"
            >
              {classKeys.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
              {!classKeys.includes(routing.defaults.licensed) ? (
                <option value={routing.defaults.licensed}>
                  {routing.defaults.licensed} (missing)
                </option>
              ) : null}
            </select>
          </label>

          <label className="field">
            <div className="field-label">Unlicensed default class</div>
            <select
              ref={unlicensedRef}
              value={routing.defaults.unlicensed}
              onChange={(e) =>
                updateRouting((d) => {
                  d.defaults.unlicensed = e.target.value;
                })
              }
              className="input"
            >
              {classKeys.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
              {!classKeys.includes(routing.defaults.unlicensed) ? (
                <option value={routing.defaults.unlicensed}>
                  {routing.defaults.unlicensed} (missing)
                </option>
              ) : null}
            </select>
          </label>
        </div>
      </div>
    </section>
  );
}
