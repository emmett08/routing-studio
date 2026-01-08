import React from "react";
import type { RoutingFileV1 } from "../routing/types";

export type SectionKey =
  | "overview"
  | "providers"
  | "models"
  | "classes"
  | "defaults"
  | "legacy"
  | "ui";

export function Sidebar({
  section,
  setSection,
  routing,
}: {
  section: SectionKey;
  setSection: (s: SectionKey) => void;
  routing: RoutingFileV1;
}) {
  const counts = {
    providers: Object.keys(routing.providers ?? {}).length,
    models: Object.keys(routing.models ?? {}).length,
    classes: Object.keys(routing.classes ?? {}).length,
    legacy: Object.keys(routing.legacyPreferenceMap ?? {}).length,
  };

  const item = (key: SectionKey, label: string, right?: React.ReactNode) => (
    <button
      key={key}
      onClick={() => setSection(key)}
      aria-current={section === key ? "page" : undefined}
    >
      <span>{label}</span>
      <span className="pill">{right}</span>
    </button>
  );

  return (
    <div className="panel">
      <header>
        <h3>Navigation</h3>
        <span className="muted">Edit sections</span>
      </header>
      <div className="body">
        <div className="nav" role="navigation" aria-label="Routing file sections">
          {item("overview", "Overview")}
          {item("providers", "Providers", counts.providers)}
          {item("models", "Models", counts.models)}
          {item("classes", "Classes", counts.classes)}
          {item("defaults", "Defaults")}
          {item("legacy", "Legacy map", counts.legacy)}
          {item("ui", "UI config")}
        </div>

        <div className="hr" />

        <div className="small">
          Tips:
          <ul>
            <li>
              <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>O</kbd> open
            </li>
            <li>
              <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>S</kbd> download
            </li>
            <li>
              <kbd>Ctrl</kbd>/<kbd>Cmd</kbd>+<kbd>Z</kbd> undo
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
