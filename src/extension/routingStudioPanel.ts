import * as vscode from "vscode";
import { basename } from "node:path";
import { WebviewToExtensionMessageSchema } from "../bridge/protocol";
import { parseRoutingJsonText } from "../routing/schema";
import { createStarterRoutingFile } from "../routing/templates";
import type { RoutingFileV1 } from "../routing/types";
import { validateRouting } from "../routing/validate";
import { RoutingStudioLogger } from "./logger";
import { buildWebviewHtml } from "./webviewHtml";

function stableStringify(obj: unknown): string {
  return JSON.stringify(obj, null, 2) + "\n";
}

function starterText(): string {
  return stableStringify(createStarterRoutingFile());
}

export class RoutingStudioPanel implements vscode.Disposable {
  static current: RoutingStudioPanel | undefined;

  private readonly panel: vscode.WebviewPanel;
  private readonly disposables: vscode.Disposable[] = [];
  private readonly distRoot: vscode.Uri;

  private uri: vscode.Uri | null = null;
  private fileName = "starter.routing.json";
  private text = starterText();
  private ready = false;

  static async open(context: vscode.ExtensionContext, logger: RoutingStudioLogger): Promise<void> {
    if (RoutingStudioPanel.current) {
      RoutingStudioPanel.current.panel.reveal(vscode.ViewColumn.One);
      return;
    }

    const panel = vscode.window.createWebviewPanel(
      "routingStudio.panel",
      "Routing Studio",
      vscode.ViewColumn.One,
      {
        enableScripts: true,
        localResourceRoots: [
          vscode.Uri.joinPath(context.extensionUri, "dist", "webview"),
          vscode.Uri.joinPath(context.extensionUri, "media"),
        ],
      },
    );

    const inst = new RoutingStudioPanel(panel, context, logger);
    RoutingStudioPanel.current = inst;
    await inst.init();
  }

  private constructor(
    panel: vscode.WebviewPanel,
    private readonly context: vscode.ExtensionContext,
    private readonly logger: RoutingStudioLogger,
  ) {
    this.panel = panel;
    this.distRoot = vscode.Uri.joinPath(this.context.extensionUri, "dist", "webview");

    this.panel.onDidDispose(
      () => {
        this.dispose();
      },
      null,
      this.disposables,
    );

    this.updateTitle();
  }

  dispose() {
    RoutingStudioPanel.current = undefined;
    while (this.disposables.length) {
      try {
        this.disposables.pop()?.dispose();
      } catch {
        // ignore
      }
    }
  }

  private updateTitle() {
    this.panel.title = this.uri ? `Routing Studio — ${this.fileName}` : "Routing Studio";
  }

  private async init(): Promise<void> {
    this.panel.webview.html = await buildWebviewHtml({
      webview: this.panel.webview,
      distRoot: this.distRoot,
      logger: this.logger,
    });

    this.panel.webview.onDidReceiveMessage(
      (data: unknown) => void this.handleMessage(data),
      null,
      this.disposables,
    );
  }

  private async post(message: unknown) {
    if (!this.ready) return;
    await this.panel.webview.postMessage(message);
  }

  private async sendInit() {
    await this.post({
      type: "init",
      text: this.text,
      fileName: this.fileName,
      uri: this.uri?.toString(),
    });
  }

  private async handleMessage(data: unknown): Promise<void> {
    const parsed = WebviewToExtensionMessageSchema.safeParse(data);
    if (!parsed.success) {
      this.logger.warn("webview.message.invalid", { issues: parsed.error.issues });
      return;
    }

    const msg = parsed.data;

    if (msg.type === "ready") {
      this.ready = true;
      await this.sendInit();
      this.logger.info("panel.ready");
      return;
    }

    if (msg.type === "log") {
      this.logger.log(msg.level, "webview.log", { message: msg.message, data: msg.data });
      return;
    }

    if (msg.type === "updateText") {
      this.text = msg.text;
      return;
    }

    if (msg.type === "command") {
      if (msg.text !== undefined) this.text = msg.text;

      if (msg.command === "open") {
        await this.openFileIntoPanel();
        return;
      }
      if (msg.command === "newFile") {
        this.resetToStarter();
        return;
      }
      if (msg.command === "save") {
        await this.saveToCurrentOrPick();
        return;
      }
      if (msg.command === "export") {
        await this.exportToPick();
        return;
      }
      if (msg.command === "validate") {
        await this.validateCurrent();
        return;
      }
      if (msg.command === "showOutput") {
        this.logger.show(true);
        return;
      }
    }
  }

  private async openFileIntoPanel(): Promise<void> {
    const picked = await vscode.window.showOpenDialog({
      canSelectMany: false,
      filters: { JSON: ["json"] },
    });
    if (!picked?.[0]) return;

    const bytes = await vscode.workspace.fs.readFile(picked[0]);
    const text = Buffer.from(bytes).toString("utf8");
    this.uri = picked[0];
    this.fileName = basename(picked[0].fsPath);
    this.text = text;
    this.updateTitle();

    await this.sendInit();
    this.logger.info("panel.file.open", { uri: picked[0].toString() });
  }

  private resetToStarter() {
    this.uri = null;
    this.fileName = "starter.routing.json";
    this.text = starterText();
    this.updateTitle();
    void this.sendInit();
    this.logger.info("panel.new");
  }

  private async saveToCurrentOrPick(): Promise<void> {
    const folder = vscode.workspace.workspaceFolders?.[0]?.uri;

    if (!this.uri) {
      const target = await vscode.window.showSaveDialog({
        defaultUri: folder ? vscode.Uri.joinPath(folder, this.fileName) : undefined,
        filters: { JSON: ["json"] },
      });
      if (!target) return;
      this.uri = target;
      this.fileName = basename(target.fsPath);
      this.updateTitle();
      await this.post({ type: "setFileInfo", fileName: this.fileName, uri: this.uri.toString() });
    }

    await vscode.workspace.fs.writeFile(this.uri, Buffer.from(this.text, "utf8"));
    this.logger.info("panel.file.save", { uri: this.uri.toString() });
    void vscode.window.showInformationMessage(`Routing Studio: Saved ${this.fileName}`);
  }

  private async exportToPick(): Promise<void> {
    const folder = vscode.workspace.workspaceFolders?.[0]?.uri;
    const target = await vscode.window.showSaveDialog({
      defaultUri: folder ? vscode.Uri.joinPath(folder, this.fileName) : undefined,
      filters: { JSON: ["json"] },
    });
    if (!target) return;

    await vscode.workspace.fs.writeFile(target, Buffer.from(this.text, "utf8"));
    this.logger.info("panel.file.export", { to: target.toString() });
    void vscode.window.showInformationMessage(`Routing Studio: Exported to ${target.fsPath}`);
  }

  private async validateCurrent(): Promise<void> {
    const parsed = parseRoutingJsonText(this.text);
    if (!parsed.ok) {
      this.logger.error("panel.validate.schema.failed", { message: parsed.message });
      this.logger.show(true);
      void vscode.window.showErrorMessage(`Routing Studio: ${parsed.message}`);
      return;
    }

    const routing = parsed.value as unknown as RoutingFileV1;
    const issues = validateRouting(routing);
    const errors = issues.filter((i) => i.severity === "error").length;
    const warnings = issues.filter((i) => i.severity === "warning").length;
    this.logger.info("panel.validate.ok", { errors, warnings, issues });
    this.logger.show(true);

    void vscode.window.showInformationMessage(
      `Routing Studio: ${errors} error(s), ${warnings} warning(s). See Output → Routing Studio.`,
    );
  }
}
