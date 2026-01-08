import * as vscode from "vscode";
import type { RoutingStudioLogger } from "./logger";

function getNonce(): string {
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let out = "";
  for (let i = 0; i < 32; i++) out += possible.charAt(Math.floor(Math.random() * possible.length));
  return out;
}

function normaliseWebAssetPath(p: string): string {
  return p.replace(/^[./]+/, "");
}

export async function buildWebviewHtml({
  webview,
  distRoot,
  logger,
}: {
  webview: vscode.Webview;
  distRoot: vscode.Uri;
  logger: RoutingStudioLogger;
}): Promise<string> {
  const nonce = getNonce();

  let html: string;
  try {
    const indexUri = vscode.Uri.joinPath(distRoot, "index.html");
    html = Buffer.from(await vscode.workspace.fs.readFile(indexUri)).toString("utf8");
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    logger.error("webview.assets.missing", { message: msg });
    return `<!doctype html><html><body><h2>Routing Studio</h2><p>Webview assets not found. Run <code>npm run build:webview</code>.</p></body></html>`;
  }

  const csp = [
    "default-src 'none'",
    `img-src ${webview.cspSource} data:`,
    `font-src ${webview.cspSource} data:`,
    `style-src ${webview.cspSource} 'unsafe-inline'`,
    `script-src 'nonce-${nonce}'`,
  ].join("; ");

  html = html.replace(
    /<head>/i,
    `<head>\n<meta http-equiv="Content-Security-Policy" content="${csp}">`,
  );

  html = html.replace(
    /<script\b(?![^>]*\bnonce=)/gi,
    `<script nonce="${nonce}"`,
  );

  const rewriteAttr = (attr: "src" | "href") => {
    const re = new RegExp(`${attr}="([^"]+)"`, "g");
    html = html.replace(re, (_m, rawPath: string) => {
      if (/^(https?:|data:|#)/.test(rawPath)) return `${attr}="${rawPath}"`;
      const normalised = normaliseWebAssetPath(rawPath);
      const onDisk = vscode.Uri.joinPath(distRoot, normalised);
      const uri = webview.asWebviewUri(onDisk);
      return `${attr}="${uri.toString()}"`;
    });
  };
  rewriteAttr("href");
  rewriteAttr("src");

  return html;
}

