import React, { useCallback, useMemo, useState } from "react";
import { useRoutingEditor } from "./state/useRoutingEditor";
import { TopBar } from "./ui/TopBar";
import { Sidebar, type SectionKey } from "./ui/Sidebar";
import { Overview } from "./ui/Overview";
import { IssuesPanel } from "./ui/IssuesPanel";
import { JsonPanel } from "./ui/JsonPanel";
import { ToastStack } from "./ui/ToastStack";
import { ProvidersEditor } from "./ui/editors/ProvidersEditor";
import { ModelsEditor } from "./ui/editors/ModelsEditor";
import { ClassesEditor } from "./ui/editors/ClassesEditor";
import { DefaultsEditor } from "./ui/editors/DefaultsEditor";
import { LegacyMapEditor } from "./ui/editors/LegacyMapEditor";
import { UiConfigEditor } from "./ui/editors/UiConfigEditor";

export default function App() {
  const editor = useRoutingEditor();
  const [section, setSection] = useState<SectionKey>("overview");
  const [rightTab, setRightTab] = useState<"validation" | "json">("validation");

  const openFile = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = () => {
        const text = String(reader.result ?? "");
        editor.loadFromText(text, file.name);
        setSection("overview");
      };
      reader.readAsText(file);
    },
    [editor],
  );

  const main = useMemo(() => {
    switch (section) {
      case "overview":
        return <Overview routing={editor.routing} fileName={editor.fileName} openFile={openFile} />;
      case "providers":
        return <ProvidersEditor routing={editor.routing} updateRouting={editor.updateRouting} />;
      case "models":
        return (
          <ModelsEditor
            routing={editor.routing}
            updateRouting={editor.updateRouting}
            uiConfig={editor.uiConfig}
          />
        );
      case "classes":
        return (
          <ClassesEditor
            routing={editor.routing}
            updateRouting={editor.updateRouting}
            uiConfig={editor.uiConfig}
            saveUi={editor.saveUi}
          />
        );
      case "defaults":
        return <DefaultsEditor routing={editor.routing} updateRouting={editor.updateRouting} />;
      case "legacy":
        return <LegacyMapEditor routing={editor.routing} updateRouting={editor.updateRouting} />;
      case "ui":
        return <UiConfigEditor uiConfig={editor.uiConfig} saveUi={editor.saveUi} />;
      default:
        return null;
    }
  }, [
    editor.fileName,
    editor.routing,
    editor.uiConfig,
    editor.updateRouting,
    editor.saveUi,
    openFile,
    section,
  ]);

  return (
    <div className="app">
      <TopBar
        fileName={editor.fileName}
        setFileName={editor.setFileName}
        status={editor.status}
        issues={editor.issues}
        canUndo={editor.canUndo}
        canRedo={editor.canRedo}
        undo={editor.undo}
        redo={editor.redo}
        newFile={editor.newFile}
        openFile={openFile}
        download={editor.download}
        copyJson={editor.copyJson}
      />

      <div className="shell">
        <Sidebar section={section} setSection={setSection} routing={editor.routing} />

        <div style={{ minHeight: 0 }}>{main}</div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, minHeight: 0 }}>
          <div className="panel">
            <header>
              <h3>Side panel</h3>
              <span className="muted">Switch views</span>
              <div style={{ flex: 1 }} />
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  onClick={() => setRightTab("validation")}
                  aria-current={rightTab === "validation" ? "page" : undefined}
                >
                  Validation
                </button>
                <button
                  onClick={() => setRightTab("json")}
                  aria-current={rightTab === "json" ? "page" : undefined}
                >
                  Raw JSON
                </button>
              </div>
            </header>
            <div className="body">
              <div className="small">
                Validation highlights integrity issues (missing models/classes/providers). Raw JSON is
                for advanced edits.
              </div>
            </div>
          </div>

          <div style={{ flex: 1, minHeight: 0 }}>
            {rightTab === "validation" ? (
              <IssuesPanel issues={editor.issues} />
            ) : (
              <JsonPanel
                rawJsonDraft={editor.rawJsonDraft}
                setRawJsonDraft={editor.setRawJsonDraft}
                rawJsonError={editor.rawJsonError}
                applyRawJsonDraft={editor.applyRawJsonDraft}
                copyJson={editor.copyJson}
              />
            )}
          </div>
        </div>      </div>

      <ToastStack toasts={editor.toasts} />
    </div>
  );
}
