import * as vscode from "vscode";
import { ActionsProvider } from "./actionsProvider";
import { RoutingStudioEditorProvider } from "./routingStudioEditorProvider";
import { RoutingStudioLogger } from "./logger";
import { RoutingStudioPanel } from "./routingStudioPanel";
import { createStarterRoutingFile } from "../routing/templates";
import { parseRoutingJsonText } from "../routing/schema";
import { validateRouting } from "../routing/validate";
import type { RoutingFileV1 } from "../routing/types";

function stableStringify(obj: unknown): string {
  return JSON.stringify(obj, null, 2) + "\n";
}

async function pickRoutingStudioTarget(
  editorProvider: RoutingStudioEditorProvider,
): Promise<vscode.Uri | null> {
  const active = editorProvider.getActiveUri();
  if (active) return active;

  const activeText = vscode.window.activeTextEditor?.document.uri;
  if (activeText && activeText.fsPath.endsWith(".routing.json")) return activeText;

  return null;
}

export function activate(context: vscode.ExtensionContext) {
  const logger = new RoutingStudioLogger();
  context.subscriptions.push(logger);

  const editorProvider = new RoutingStudioEditorProvider(context, logger);
  context.subscriptions.push(
    vscode.window.registerCustomEditorProvider(RoutingStudioEditorProvider.viewType, editorProvider, {
      webviewOptions: { retainContextWhenHidden: true },
      supportsMultipleEditorsPerDocument: true,
    }),
  );

  const actionsProvider = new ActionsProvider();
  context.subscriptions.push(
    vscode.window.registerTreeDataProvider("routingStudio.actions", actionsProvider),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("routingStudio.showOutput", () => {
      logger.show(true);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("routingStudio.open", async () => {
      await RoutingStudioPanel.open(context, logger);
    }),
  );

  context.subscriptions.push(
    vscode.workspace.onDidSaveTextDocument((doc) => {
      if (!doc.uri.fsPath.endsWith(".routing.json")) return;
      logger.info("file.save", { uri: doc.uri.toString() });
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("routingStudio.newFile", async () => {
      const folder = vscode.workspace.workspaceFolders?.[0]?.uri;
      const target = await vscode.window.showSaveDialog({
        defaultUri: folder ? vscode.Uri.joinPath(folder, "starter.routing.json") : undefined,
        filters: { JSON: ["json"] },
      });
      if (!target) return;

      const starter = createStarterRoutingFile();
      await vscode.workspace.fs.writeFile(target, Buffer.from(stableStringify(starter), "utf8"));
      logger.info("file.new", { uri: target.toString() });

      await vscode.commands.executeCommand("vscode.openWith", target, RoutingStudioEditorProvider.viewType);
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("routingStudio.validate", async () => {
      const uri = await pickRoutingStudioTarget(editorProvider);
      if (!uri) {
        void vscode.window.showInformationMessage("Routing Studio: No active document to validate.");
        return;
      }

      const doc = await vscode.workspace.openTextDocument(uri);
      const parsed = parseRoutingJsonText(doc.getText());
      if (!parsed.ok) {
        logger.error("validate.schema.failed", { uri: uri.toString(), message: parsed.message });
        void vscode.window.showErrorMessage(`Routing Studio: ${parsed.message}`);
        logger.show(true);
        return;
      }

      const routing = parsed.value as unknown as RoutingFileV1;
      const issues = validateRouting(routing);
      const errors = issues.filter((i) => i.severity === "error").length;
      const warnings = issues.filter((i) => i.severity === "warning").length;
      logger.info("validate.ok", { uri: uri.toString(), errors, warnings, issues });
      logger.show(true);

      void vscode.window.showInformationMessage(
        `Routing Studio: ${errors} error(s), ${warnings} warning(s). See Output → Routing Studio.`,
      );
    }),
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("routingStudio.export", async () => {
      const uri = await pickRoutingStudioTarget(editorProvider);
      if (!uri) {
        void vscode.window.showInformationMessage("Routing Studio: No active document to export.");
        return;
      }

      const doc = await vscode.workspace.openTextDocument(uri);
      const parsed = parseRoutingJsonText(doc.getText());
      if (!parsed.ok) {
        logger.error("export.schema.failed", { uri: uri.toString(), message: parsed.message });
        void vscode.window.showErrorMessage(`Routing Studio: ${parsed.message}`);
        logger.show(true);
        return;
      }

      const folder = vscode.workspace.workspaceFolders?.[0]?.uri;
      const baseName = uri.path.split("/").pop() ?? "routing.routing.json";
      const target = await vscode.window.showSaveDialog({
        defaultUri: folder ? vscode.Uri.joinPath(folder, baseName) : undefined,
        filters: { JSON: ["json"] },
      });
      if (!target) return;

      await vscode.workspace.fs.writeFile(
        target,
        Buffer.from(stableStringify(parsed.value), "utf8"),
      );
      logger.info("file.export", { from: uri.toString(), to: target.toString() });
      void vscode.window.showInformationMessage(`Routing Studio: Exported to ${target.fsPath}`);
    }),
  );
}

export function deactivate() {}
