import React from "react";
import type { RoutingFileV1 } from "../routing/types";

export type SectionKey =
  | "overview"
  | "providers"
  | "models"
  | "classes"
  | "defaults"
  | "legacy"
  | "rawJson"
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
  const hasAdvanced =
    Object.keys(routing.legacyPreferenceMap ?? {}).length > 0 ||
    Object.keys(routing.providers ?? {}).length > 0 ||
    Object.keys(routing.models ?? {}).length > 0;

  const item = (key: SectionKey, label: string) => (
    <button
      key={key}
      className="nav-item"
      onClick={() => setSection(key)}
      aria-current={section === key ? "page" : undefined}
      type="button"
    >
      {label}
    </button>
  );

  return (
    <nav className="nav" aria-label="Routing Studio navigation">
      <div className="nav-group" aria-label="Primary">
        {item("overview", "Overview")}
        {item("providers", "Providers")}
        {item("models", "Models")}
        {item("classes", "Classes")}
        {item("defaults", "Defaults")}
      </div>

      <details className="nav-advanced">
        <summary className="nav-summary">Advanced</summary>
        <div className="nav-group" aria-label="Advanced">
          {item("legacy", "Legacy map")}
          {item("rawJson", "Raw JSON")}
          {item("ui", "UI semantics")}
        </div>
      </details>

      {!hasAdvanced ? (
        <div className="nav-hint">
          Advanced contains raw JSON and legacy tooling.
        </div>
      ) : null}
    </nav>
  );
}
