import { useCallback, useMemo, useRef, useState } from "react";
import type { RoutingFileV1, RoutingUiConfig, ValidationIssue } from "../routing/types";
import { parseRoutingJsonText } from "../routing/schema";
import { validateRouting } from "../routing/validate";
import { createStarterRoutingFile } from "../routing/templates";
import { loadUiConfig, saveUiConfig } from "../routing/uiDefaults";
import { useHistory } from "./useHistory";

export type Toast = { kind: "info" | "success" | "warning" | "error"; message: string };

function stableStringify(obj: unknown): string {
  return JSON.stringify(obj, null, 2) + "\n";
}

export function useRoutingEditor() {
  const history = useHistory<RoutingFileV1>(createStarterRoutingFile());
  const [fileName, setFileName] = useState<string>("starter.routing.json");
  const [fileUri, setFileUri] = useState<string | null>(null);
  const [rawJsonDraft, setRawJsonDraft] = useState<string>(() => stableStringify(history.value));
  const [rawJsonError, setRawJsonError] = useState<string | null>(null);
  const [baselineText, setBaselineText] = useState<string>(() => stableStringify(history.value));

  const [uiConfig, setUiConfig] = useState<RoutingUiConfig>(() => loadUiConfig());

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastTimer = useRef<number | null>(null);

  const issues: ValidationIssue[] = useMemo(() => validateRouting(history.value), [history.value]);

  const status = useMemo(() => {
    const errors = issues.filter((i) => i.severity === "error").length;
    const warnings = issues.filter((i) => i.severity === "warning").length;
    return { errors, warnings };
  }, [issues]);

  const pushToast = useCallback((t: Toast) => {
    setToasts((prev) => [...prev, t].slice(-3));
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setToasts([]), 3200);
  }, []);

  const syncRawFromState = useCallback((next: RoutingFileV1) => {
    setRawJsonDraft(stableStringify(next));
    setRawJsonError(null);
  }, []);

  const currentText = useMemo(() => stableStringify(history.value), [history.value]);
  const dirty = useMemo(() => currentText !== baselineText, [baselineText, currentText]);
  const markSaved = useCallback(() => setBaselineText(currentText), [currentText]);

  const setRouting = useCallback(
    (next: RoutingFileV1, opts?: { silent?: boolean }) => {
      history.set(next);
      syncRawFromState(next);
      if (!opts?.silent) pushToast({ kind: "success", message: "Updated." });
    },
    [history, pushToast, syncRawFromState],
  );

  const updateRouting = useCallback(
    (mutate: (draft: RoutingFileV1) => void, opts?: { silent?: boolean }) => {
      // structuredClone gives us a deep copy with good browser support.
      const next = structuredClone(history.value) as RoutingFileV1;
      mutate(next);
      setRouting(next, opts);
    },
    [history.value, setRouting],
  );

  const newFile = useCallback(() => {
    const next = createStarterRoutingFile();
    history.reset(next);
    setFileName("starter.routing.json");
    setFileUri(null);
    syncRawFromState(next);
    setBaselineText(stableStringify(next));
    pushToast({ kind: "success", message: "Started a new routing file." });
  }, [history, pushToast, syncRawFromState]);

  const loadFromText = useCallback(
    (
      text: string,
      name?: string,
      opts?: { silent?: boolean; fileUri?: string | null; markSaved?: boolean },
    ) => {
      setFileName(name ?? "routing.json");
      if (opts?.fileUri !== undefined) setFileUri(opts.fileUri);
      const parsed = parseRoutingJsonText(text);
      if (!parsed.ok) {
        setRawJsonDraft(text);
        setRawJsonError(parsed.message);
        if (!opts?.silent) pushToast({ kind: "error", message: parsed.message });
        return;
      }
      const next = parsed.value as unknown as RoutingFileV1;
      history.reset(next);
      syncRawFromState(next);
      if (opts?.markSaved) setBaselineText(stableStringify(next));
      if (!opts?.silent) {
        pushToast({ kind: "success", message: `Loaded ${name ?? "routing.json"}.` });
      }
    },
    [history, pushToast, syncRawFromState],
  );

  const applyRawJsonDraft = useCallback(() => {
    loadFromText(rawJsonDraft, fileName);
  }, [fileName, loadFromText, rawJsonDraft]);

  const download = useCallback(() => {
    const blob = new Blob([stableStringify(history.value)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName || "routing.json";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
    setBaselineText(stableStringify(history.value));
    pushToast({ kind: "success", message: "Downloaded." });
  }, [fileName, history.value, pushToast]);

  const copyJson = useCallback(async () => {
    await navigator.clipboard.writeText(stableStringify(history.value));
    pushToast({ kind: "success", message: "Copied JSON to clipboard." });
  }, [history.value, pushToast]);

  const saveUi = useCallback(
    (next: RoutingUiConfig, opts?: { silent?: boolean }) => {
      setUiConfig(next);
      saveUiConfig(next);
      if (opts?.silent === false) {
        pushToast({ kind: "success", message: "Saved UI configuration (local only)." });
      }
    },
    [pushToast],
  );

  return {
    routing: history.value,
    getJsonText: () => currentText,
    fileName,
    setFileName,
    fileUri,
    setFileUri,
    dirty,
    markSaved,
    updateRouting,
    setRouting,
    newFile,
    loadFromText,
    rawJsonDraft,
    setRawJsonDraft,
    rawJsonError,
    applyRawJsonDraft,
    issues,
    status,
    canUndo: history.canUndo,
    canRedo: history.canRedo,
    undo: history.undo,
    redo: history.redo,
    download,
    copyJson,
    uiConfig,
    saveUi,
    toasts,
  };
}
