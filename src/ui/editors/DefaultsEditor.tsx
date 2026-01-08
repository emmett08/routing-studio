import React, { useMemo } from "react";
import type { RoutingFileV1 } from "../../routing/types";
import { Help, InlineCode, SectionTitle } from "../components";

export function DefaultsEditor({
  routing,
  updateRouting,
}: {
  routing: RoutingFileV1;
  updateRouting: (mutate: (draft: RoutingFileV1) => void, opts?: { silent?: boolean }) => void;
}) {
  const classKeys = useMemo(() => Object.keys(routing.classes ?? {}).sort(), [routing.classes]);

  return (
    <div className="panel">
      <SectionTitle
        title="Defaults"
        subtitle="What class to route to when the caller doesn't specify."
      />
      <div className="body">
        <Help>
          Defaults point at a <strong>class key</strong>. If you rename/delete classes, come back and
          update <InlineCode>defaults</InlineCode>.
        </Help>

        <div className="hr" />

        <div className="split">
          <div className="card">
            <div className="small">Licensed</div>
            <select
              value={routing.defaults.licensed}
              onChange={(e) =>
                updateRouting((d) => {
                  d.defaults.licensed = e.target.value;
                })
              }
              style={{ marginTop: 8, width: "100%" }}
              aria-label="Licensed default class"
            >
              {classKeys.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
              {!classKeys.includes(routing.defaults.licensed) ? (
                <option value={routing.defaults.licensed}>{routing.defaults.licensed} (missing)</option>
              ) : null}
            </select>
          </div>

          <div className="card">
            <div className="small">Unlicensed</div>
            <select
              value={routing.defaults.unlicensed}
              onChange={(e) =>
                updateRouting((d) => {
                  d.defaults.unlicensed = e.target.value;
                })
              }
              style={{ marginTop: 8, width: "100%" }}
              aria-label="Unlicensed default class"
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
          </div>
        </div>

        <div className="hr" />

        <div className="small">
          Common pattern: set <InlineCode>licensed</InlineCode> to a higher-capability class and{" "}
          <InlineCode>unlicensed</InlineCode> to a cheaper class.
        </div>
      </div>
    </div>
  );
}
