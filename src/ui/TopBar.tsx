import React, { useEffect, useRef } from "react";
import type { ValidationIssue } from "../routing/types";
import { Badge, SmallButton } from "./components";

export function TopBar({
  fileName,
  setFileName,
  status,
  issues,
  canUndo,
  canRedo,
  undo,
  redo,
  newFile,
  openFile,
  download,
  copyJson,
}: {
  fileName: string;
  setFileName: (v: string) => void;
  status: { errors: number; warnings: number };
  issues: ValidationIssue[];
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;
  newFile: () => void;
  openFile: (file: File) => void;
  download: () => void;
  copyJson: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        download();
      }
      if (e.key.toLowerCase() === "o") {
        e.preventDefault();
        fileInputRef.current?.click();
      }
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [download, redo, undo]);

  const badge =
    status.errors > 0 ? (
      <Badge kind="danger">
        {status.errors} error{status.errors === 1 ? "" : "s"}
      </Badge>
    ) : status.warnings > 0 ? (
      <Badge kind="warn">
        {status.warnings} warning{status.warnings === 1 ? "" : "s"}
      </Badge>
    ) : (
      <Badge kind="ok">Valid</Badge>
    );

  return (
    <div className="topbar">
      <strong style={{ letterSpacing: 0.2 }}>Routing Studio</strong>
      <span className="badge">Local-first</span>

      <div className="spacer" />

      <label className="badge" style={{ gap: 10 }}>
        <span className="muted">File</span>
        <input
          value={fileName}
          onChange={(e) => setFileName(e.target.value)}
          style={{ width: 260 }}
          aria-label="File name"
        />
      </label>

      {badge}

      <div className="spacer" />

      <SmallButton onClick={newFile} title="New (resets to starter)">
        New
      </SmallButton>

      <SmallButton
        onClick={() => fileInputRef.current?.click()}
        title="Open (Ctrl/Cmd+O)"
      >
        Open
      </SmallButton>

      <input
        ref={fileInputRef}
        type="file"
        accept=".json,.routing.json,application/json"
        style={{ display: "none" }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (!f) return;
          openFile(f);
          e.currentTarget.value = "";
        }}
      />

      <SmallButton onClick={download} title="Download (Ctrl/Cmd+S)">
        Download
      </SmallButton>

      <SmallButton onClick={copyJson} title="Copy JSON">
        Copy
      </SmallButton>

      <SmallButton onClick={undo} disabled={!canUndo} title="Undo (Ctrl/Cmd+Z)">
        Undo
      </SmallButton>
      <SmallButton
        onClick={redo}
        disabled={!canRedo}
        title="Redo (Ctrl/Cmd+Shift+Z)"
      >
        Redo
      </SmallButton>

      <span className="badge">{issues.length} issue(s)</span>
    </div>
  );
}
