import * as vscode from "vscode";

type LogLevel = "info" | "warn" | "error";

export class RoutingStudioLogger implements vscode.Disposable {
  private readonly channel: vscode.OutputChannel;

  constructor() {
    this.channel = vscode.window.createOutputChannel("Routing Studio");
  }

  dispose() {
    this.channel.dispose();
  }

  show(preserveFocus = false) {
    this.channel.show(preserveFocus);
  }

  log(level: LogLevel, event: string, data?: unknown) {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      level,
      event,
      ...(data === undefined ? {} : { data }),
    });
    this.channel.appendLine(line);
  }

  info(event: string, data?: unknown) {
    this.log("info", event, data);
  }

  warn(event: string, data?: unknown) {
    this.log("warn", event, data);
  }

  error(event: string, data?: unknown) {
    this.log("error", event, data);
  }
}

