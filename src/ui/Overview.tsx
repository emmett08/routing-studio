import React, { useCallback, useState } from "react";
import type { RoutingFileV1 } from "../routing/types";
import { Help, InlineCode, SectionTitle } from "./components";

export function Overview({
  routing,
  fileName,
  openFile,
}: {
  routing: RoutingFileV1;
  fileName: string;
  openFile: (file: File) => void;
}) {
  const [dragOver, setDragOver] = useState(false);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const f = e.dataTransfer.files?.[0];
      if (!f) return;
      openFile(f);
    },
    [openFile],
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  }, []);

  const onDragLeave = useCallback(() => setDragOver(false), []);

  const providerCount = Object.keys(routing.providers ?? {}).length;
  const modelCount = Object.keys(routing.models ?? {}).length;
  const classCount = Object.keys(routing.classes ?? {}).length;

  return (
    <div className="panel">
      <SectionTitle
        title="Overview"
        subtitle="A guided, local-first editor for your routing JSON."
      />
      <div className="body">
        <div
          className="dropzone"
          style={{
            borderStyle: dragOver ? "solid" : "dashed",
            borderColor: dragOver ? "rgba(94,234,212,0.6)" : undefined,
          }}
          onDrop={onDrop}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          role="group"
          aria-label="Drop a routing file to open"
        >
          <strong>Drag & drop a routing file to open</strong>
          <div className="muted">
            Drop any <InlineCode>*.routing.json</InlineCode> or plain{" "}
            <InlineCode>.json</InlineCode> file here to prepopulate.
          </div>
        </div>

        <div className="hr" />

        <div className="split">
          <div className="card">
            <div className="small">Current file</div>
            <div style={{ fontSize: 14, marginTop: 4 }}>
              <span className="mono">{fileName}</span>
            </div>
            <div className="small" style={{ marginTop: 6 }}>
              Version: <InlineCode>{String(routing.version)}</InlineCode>
            </div>
          </div>

          <div className="card">
            <div className="small">Contents</div>
            <div style={{ marginTop: 6, display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className="pill">Providers: {providerCount}</span>
              <span className="pill">Models: {modelCount}</span>
              <span className="pill">Classes: {classCount}</span>
              <span className="pill">
                Defaults: {routing.defaults?.licensed}/{routing.defaults?.unlicensed}
              </span>
            </div>
          </div>
        </div>

        <div className="hr" />

        <Help>
          <div>
            The UI treats <strong>classes</strong> as the user-configurable “categories”
            (e.g. <InlineCode>frontier</InlineCode>, <InlineCode>cheap</InlineCode>). You can
            rename, add, delete, and attach rules that keep classes discoverable as you add new
            models.
          </div>
        </Help>

        <div className="hr" />

        <div className="small">
          UX notes:
          <ul>
            <li>
              The editor preserves unknown fields in your JSON so you can evolve the schema
              without losing data.
            </li>
            <li>
              “UI config” is stored in <InlineCode>localStorage</InlineCode> by default so it
              won’t break strict consumers of your routing file.
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
