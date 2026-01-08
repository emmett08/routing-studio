import * as vscode from "vscode";
import { basename } from "node:path";
import { WebviewToExtensionMessageSchema } from "../bridge/protocol";
import { RoutingStudioLogger } from "./logger";
import { buildWebviewHtml } from "./webviewHtml";

function fullDocumentRange(document: vscode.TextDocument): vscode.Range {
  const lastLine = document.lineAt(document.lineCount - 1);
  return new vscode.Range(new vscode.Position(0, 0), lastLine.rangeIncludingLineBreak.end);
}

export class RoutingStudioEditorProvider implements vscode.CustomTextEditorProvider {
  static readonly viewType = "routingStudio.editor";

  private activeUri: vscode.Uri | null = null;
  private readonly applyingEdits = new Set<string>();

  constructor(
    private readonly context: vscode.ExtensionContext,
    private readonly logger: RoutingStudioLogger,
  ) {}

  getActiveUri(): vscode.Uri | null {
    return this.activeUri;
  }

  async resolveCustomTextEditor(
    document: vscode.TextDocument,
    webviewPanel: vscode.WebviewPanel,
  ): Promise<void> {
    const distRoot = vscode.Uri.joinPath(this.context.extensionUri, "dist", "webview");
    webviewPanel.webview.options = {
      enableScripts: true,
      localResourceRoots: [distRoot, vscode.Uri.joinPath(this.context.extensionUri, "media")],
    };

    webviewPanel.webview.html = await buildWebviewHtml({
      webview: webviewPanel.webview,
      distRoot,
      logger: this.logger,
    });

    const docKey = document.uri.toString();
    const sendInit = async () => {
      await webviewPanel.webview.postMessage({
        type: "init",
        text: document.getText(),
        fileName: basename(document.uri.fsPath),
        uri: docKey,
      });
      this.logger.info("webview.init", { uri: docKey });
    };

    webviewPanel.onDidChangeViewState(() => {
      if (webviewPanel.active) this.activeUri = document.uri;
    });
    if (webviewPanel.active) this.activeUri = document.uri;

    const onDocChange = vscode.workspace.onDidChangeTextDocument((e) => {
      if (e.document.uri.toString() !== docKey) return;
      if (this.applyingEdits.delete(docKey)) return;
      void webviewPanel.webview.postMessage({ type: "setText", text: e.document.getText() });
    });
    webviewPanel.onDidDispose(() => onDocChange.dispose());

    webviewPanel.webview.onDidReceiveMessage(async (data: unknown) => {
      const parsed = WebviewToExtensionMessageSchema.safeParse(data);
      if (!parsed.success) {
        this.logger.warn("webview.message.invalid", { issues: parsed.error.issues });
        return;
      }

      const msg = parsed.data;
      if (msg.type === "ready") {
        await sendInit();
        return;
      }

      if (msg.type === "log") {
        this.logger.log(msg.level, "webview.log", { message: msg.message, data: msg.data });
        return;
      }

      if (msg.type === "command") {
        const snapshotText = msg.text;

        if (msg.command === "open") {
          const picked = await vscode.window.showOpenDialog({
            canSelectMany: false,
            filters: { JSON: ["json"] },
          });
          if (!picked?.[0]) return;
          await vscode.commands.executeCommand(
            "vscode.openWith",
            picked[0],
            RoutingStudioEditorProvider.viewType,
          );
          return;
        }

        if (msg.command === "newFile") {
          await vscode.commands.executeCommand("routingStudio.newFile");
          return;
        }

        const applySnapshotIfNeeded = async () => {
          if (snapshotText === undefined) return;
          const current = document.getText();
          if (snapshotText === current) return;
          this.applyingEdits.add(docKey);
          const edit = new vscode.WorkspaceEdit();
          edit.replace(document.uri, fullDocumentRange(document), snapshotText);
          const ok = await vscode.workspace.applyEdit(edit);
          if (!ok) this.logger.warn("document.applyEdit.failed", { uri: docKey });
        };

        if (msg.command === "save") {
          await applySnapshotIfNeeded();
          await vscode.commands.executeCommand("workbench.action.files.save");
          return;
        }

        if (msg.command === "export") {
          await applySnapshotIfNeeded();
          await vscode.commands.executeCommand("routingStudio.export");
          return;
        }

        if (msg.command === "validate") {
          await applySnapshotIfNeeded();
          await vscode.commands.executeCommand("routingStudio.validate");
          return;
        }

        await vscode.commands.executeCommand("routingStudio.showOutput");
        return;
      }

      if (msg.type === "updateText") {
        const next = msg.text;
        const current = document.getText();
        if (next === current) return;

        this.applyingEdits.add(docKey);
        const edit = new vscode.WorkspaceEdit();
        edit.replace(document.uri, fullDocumentRange(document), next);
        const ok = await vscode.workspace.applyEdit(edit);
        if (!ok) this.logger.warn("document.applyEdit.failed", { uri: docKey });
        return;
      }
    });
  }

  // Webview HTML is built by shared helper in `webviewHtml.ts`.
}
