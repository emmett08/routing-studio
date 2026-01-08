import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRoutingEditor } from "./state/useRoutingEditor";
import { Sidebar, type SectionKey } from "./ui/Sidebar";
import { Overview } from "./ui/Overview";
import { IssuesPanel, type GoToRequest } from "./ui/IssuesPanel";
import { JsonPanel } from "./ui/JsonPanel";
import { ToastStack } from "./ui/ToastStack";
import { ProvidersEditor } from "./ui/editors/ProvidersEditor";
import { ModelsEditor } from "./ui/editors/ModelsEditor";
import { ClassesEditor } from "./ui/editors/ClassesEditor";
import { DefaultsEditor } from "./ui/editors/DefaultsEditor";
import { LegacyMapEditor } from "./ui/editors/LegacyMapEditor";
import { UiConfigEditor } from "./ui/editors/UiConfigEditor";
import {
  ExtensionToWebviewMessageSchema,
  type WebviewCommand,
} from "./bridge/protocol";
import { getVsCodeApi } from "./vscode/webviewApi";

export default function App() {
  const editor = useRoutingEditor();
  const [section, setSection] = useState<SectionKey>("overview");
  const [focusReq, setFocusReq] = useState<{ id: number; req: GoToRequest } | null>(null);
  const focusSeq = useRef(0);
  const vscodeApi = useMemo(() => getVsCodeApi(), []);
  const inVscode = vscodeApi !== null;
  const [isInitialised, setIsInitialised] = useState(!inVscode);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isNarrow, setIsNarrow] = useState(() => window.innerWidth < 900);
  const [problemsOpen, setProblemsOpen] = useState(false);

  const editorRef = useRef(editor);
  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  useEffect(() => {
    if (!vscodeApi) return;

    const handler = (event: MessageEvent) => {
      const parsed = ExtensionToWebviewMessageSchema.safeParse(event.data);
      if (!parsed.success) return;

      const msg = parsed.data;
      if (msg.type === "init") {
        editorRef.current.loadFromText(msg.text, msg.fileName, {
          silent: true,
          fileUri: msg.uri ?? null,
          markSaved: true,
        });
        setIsInitialised(true);
        return;
      }
      if (msg.type === "setFileInfo") {
        editorRef.current.setFileName(msg.fileName);
        editorRef.current.setFileUri(msg.uri ?? null);
        setIsInitialised(true);
        return;
      }
      if (msg.type === "setText") {
        editorRef.current.loadFromText(msg.text, editorRef.current.fileName, { silent: true });
        setIsInitialised(true);
        return;
      }
    };

    window.addEventListener("message", handler);
    vscodeApi.postMessage({ type: "ready" });
    return () => window.removeEventListener("message", handler);
  }, [vscodeApi]);

  const sendCommand = useCallback(
    (command: WebviewCommand) => {
      const includeText = command === "save" || command === "export" || command === "validate";
      vscodeApi?.postMessage({
        type: "command",
        command,
        ...(includeText ? { text: editorRef.current.getJsonText() } : {}),
      });
    },
    [vscodeApi],
  );

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;

      if (e.key.toLowerCase() === "s") {
        e.preventDefault();
        if (inVscode) {
          sendCommand("save");
          editorRef.current.markSaved();
        }
        else editor.download();
      }
      if (e.key.toLowerCase() === "o") {
        e.preventDefault();
        if (inVscode) sendCommand("open");
        else fileInputRef.current?.click();
      }
      if (e.key.toLowerCase() === "z") {
        e.preventDefault();
        if (e.shiftKey) editorRef.current.redo();
        else editorRef.current.undo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [inVscode, sendCommand]);

  useEffect(() => {
    const onResize = () => setIsNarrow(window.innerWidth < 900);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    if (!isNarrow) setProblemsOpen(false);
  }, [isNarrow]);

  useEffect(() => {
    if (!problemsOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setProblemsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [problemsOpen]);

  const updateTimer = useRef<number | null>(null);
  useEffect(() => {
    if (!vscodeApi || !isInitialised) return;
    if (updateTimer.current) window.clearTimeout(updateTimer.current);
    updateTimer.current = window.setTimeout(() => {
      vscodeApi.postMessage({ type: "updateText", text: editorRef.current.getJsonText() });
    }, 250);
    return () => {
      if (updateTimer.current) window.clearTimeout(updateTimer.current);
    };
  }, [editor.routing, isInitialised, vscodeApi]);

  const openFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? "");
        editor.loadFromText(text, file.name, { fileUri: null, markSaved: true });
        setSection("overview");
      };
      reader.readAsText(file);
    },
    [editor],
  );

  const onGoTo = useCallback(
    (req: GoToRequest) => {
      focusSeq.current += 1;
      setFocusReq({ id: focusSeq.current, req });
      setSection(req.section);
      if (isNarrow) setProblemsOpen(false);
    },
    [isNarrow],
  );

  const focusId = focusReq?.id;
  const focus = focusReq?.req.focus;

  const main = useMemo(() => {
    switch (section) {
      case "overview":
        return (
          <Overview
            routing={editor.routing}
            fileName={editor.fileName}
            fileUri={editor.fileUri}
            dirty={editor.dirty}
            status={editor.status}
            fileNameEditable={!inVscode}
            setFileName={editor.setFileName}
            onOpen={() => {
              if (inVscode) sendCommand("open");
              else fileInputRef.current?.click();
            }}
            onNew={() => {
              if (inVscode) sendCommand("newFile");
              else editor.newFile();
            }}
            onSave={() => {
              if (inVscode) {
                sendCommand("save");
                editor.markSaved();
              } else {
                editor.download();
              }
            }}
            onExport={inVscode ? () => sendCommand("export") : undefined}
            onValidate={inVscode ? () => sendCommand("validate") : undefined}
            onShowOutput={inVscode ? () => sendCommand("showOutput") : undefined}
            onCopyJson={editor.copyJson}
          />
        );
      case "providers":
        return (
          <ProvidersEditor
            routing={editor.routing}
            updateRouting={editor.updateRouting}
            focusProviderId={focus?.kind === "providers" ? focus.providerId : undefined}
            focusRequestId={focusId}
          />
        );
      case "models":
        return (
          <ModelsEditor
            routing={editor.routing}
            updateRouting={editor.updateRouting}
            uiConfig={editor.uiConfig}
            focusModelId={focus?.kind === "models" ? focus.modelId : undefined}
            focusRequestId={focusId}
          />
        );
      case "classes":
        return (
          <ClassesEditor
            routing={editor.routing}
            updateRouting={editor.updateRouting}
            focusClassKey={focus?.kind === "classes" ? focus.classKey : undefined}
            focusIndex={focus?.kind === "classes" ? focus.index : undefined}
            focusRequestId={focusId}
          />
        );
      case "defaults":
        return (
          <DefaultsEditor
            routing={editor.routing}
            updateRouting={editor.updateRouting}
            focusField={focus?.kind === "defaults" ? focus.field : undefined}
            focusRequestId={focusId}
          />
        );
      case "legacy":
        return (
          <LegacyMapEditor
            routing={editor.routing}
            updateRouting={editor.updateRouting}
            focusKey={focus?.kind === "legacy" ? focus.key : undefined}
            focusRequestId={focusId}
          />
        );
      case "rawJson":
        return (
          <JsonPanel
            currentText={editor.getJsonText()}
            rawJsonDraft={editor.rawJsonDraft}
            setRawJsonDraft={editor.setRawJsonDraft}
            rawJsonError={editor.rawJsonError}
            applyRawJsonDraft={editor.applyRawJsonDraft}
            copyJson={editor.copyJson}
          />
        );
      case "ui":
        return <UiConfigEditor uiConfig={editor.uiConfig} saveUi={editor.saveUi} />;
      default:
        return null;
    }
  }, [
    editor.fileName,
    editor.fileUri,
    editor.dirty,
    editor.routing,
    editor.status,
    editor.uiConfig,
    editor.updateRouting,
    editor.setFileName,
    editor.newFile,
    editor.download,
    editor.copyJson,
    editor.markSaved,
    openFile,
    inVscode,
    sendCommand,
    section,
    focus,
    focusId,
  ]);

  return (
    <div className="app">
      {!inVscode ? (
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
      ) : null}

      <div className="layout">
        <Sidebar section={section} setSection={setSection} routing={editor.routing} />
        <main className="editor" style={{ minHeight: 0 }}>
          {isNarrow ? (
            <div className="editor-top-actions">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setProblemsOpen(true)}
              >
                Problems
              </button>
            </div>
          ) : null}
          {main}
        </main>
        {!isNarrow ? (
          <aside className="problems" style={{ minHeight: 0 }}>
            <IssuesPanel
              issues={editor.issues}
              onGoTo={onGoTo}
              fileName={editor.fileName}
              fileUri={editor.fileUri}
              dirty={editor.dirty}
            />
          </aside>
        ) : null}
      </div>

      {isNarrow && problemsOpen ? (
        <div
          className="problems-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Problems"
          onMouseDown={() => setProblemsOpen(false)}
        >
          <div className="problems-overlay-panel" onMouseDown={(e) => e.stopPropagation()}>
            <div className="overlay-toolbar">
              <button
                type="button"
                className="button button-secondary"
                onClick={() => setProblemsOpen(false)}
              >
                Close
              </button>
            </div>
            <IssuesPanel
              issues={editor.issues}
              onGoTo={onGoTo}
              fileName={editor.fileName}
              fileUri={editor.fileUri}
              dirty={editor.dirty}
            />
          </div>
        </div>
      ) : null}

      <ToastStack toasts={editor.toasts} />
    </div>
  );
}
