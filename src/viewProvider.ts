import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

interface ThemeContribution {
  label: string;
  uiTheme: string;
  path: string;
}

interface ThemeCard {
  label: string;
  category: string;
  bg: string;
  fg: string;
  accent: string;
  dots: string[];
}

const ORIGINAL_KEY = "themePaint.originalTheme";

/**
 * The ThemePaint sidebar: a polished picker for the bundled color themes.
 *
 * Themes are real VS Code color themes (contributed via package.json), so
 * applying one sets `workbench.colorTheme` and VS Code paints it natively.
 * Uninstalling the extension removes the themes and VS Code reverts to its
 * default. We also clear any leftover color customizations on apply/reset, since
 * those override a theme's colors (and earlier versions of this extension wrote
 * them).
 */
export class ThemePaintViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = "themePaint.view";

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(view: vscode.WebviewView): void {
    const webview = view.webview;
    webview.options = {
      enableScripts: true,
      localResourceRoots: [vscode.Uri.joinPath(this.context.extensionUri, "media")],
    };
    webview.html = this.getHtml(webview);
    webview.onDidReceiveMessage((m) => this.onMessage(m, webview));
  }

  private contributions(): ThemeContribution[] {
    const c = this.context.extension.packageJSON?.contributes?.themes;
    return Array.isArray(c) ? c : [];
  }

  private currentTheme(): string | undefined {
    return vscode.workspace.getConfiguration("workbench").get<string>("colorTheme");
  }

  /** Build the card data (with preview colors) for every contributed theme. */
  private cards(): ThemeCard[] {
    const out: ThemeCard[] = [];
    for (const t of this.contributions()) {
      let colors: Record<string, string> = {};
      let tokens: any[] = [];
      try {
        const file = path.join(this.context.extensionPath, t.path);
        const json = JSON.parse(fs.readFileSync(file, "utf8"));
        colors = json.colors || {};
        tokens = Array.isArray(json.tokenColors) ? json.tokenColors : [];
      } catch {
        // Use whatever we have; preview just shows fewer colors.
      }
      const tok = (match: string) => {
        for (const r of tokens) {
          const scope = Array.isArray(r.scope) ? r.scope.join(" ") : r.scope || "";
          if (scope.split(/\s+/).includes(match) || scope.includes(match)) {
            return r.settings?.foreground;
          }
        }
        return undefined;
      };
      out.push({
        label: t.label,
        category: categoryOf(t),
        bg: colors["editor.background"] || "#808080",
        fg: colors["editor.foreground"] || "#cccccc",
        accent: colors["button.background"] || colors["activityBarBadge.background"] || "#888888",
        dots: [
          tok("keyword") || "#888",
          tok("string") || "#888",
          tok("entity.name.function") || "#888",
        ],
      });
    }
    return out;
  }

  private async onMessage(msg: any, webview: vscode.Webview): Promise<void> {
    switch (msg?.type) {
      case "ready":
        webview.postMessage({ type: "init", themes: this.cards(), current: this.currentTheme() });
        break;
      case "apply":
        await this.apply(String(msg.label));
        webview.postMessage({ type: "current", current: this.currentTheme() });
        break;
      case "reset":
        await this.reset();
        webview.postMessage({ type: "current", current: this.currentTheme() });
        break;
    }
  }

  private async apply(label: string): Promise<void> {
    const cfg = vscode.workspace.getConfiguration();
    if (this.context.globalState.get(ORIGINAL_KEY) === undefined) {
      await this.context.globalState.update(ORIGINAL_KEY, this.currentTheme() ?? null);
    }
    await this.clearCustomizations(cfg);
    await cfg.update("workbench.colorTheme", label, vscode.ConfigurationTarget.Global);
  }

  private async reset(): Promise<void> {
    const cfg = vscode.workspace.getConfiguration();
    await this.clearCustomizations(cfg);
    const original = this.context.globalState.get<string | null>(ORIGINAL_KEY);
    await cfg.update(
      "workbench.colorTheme",
      original === null || original === undefined ? undefined : original,
      vscode.ConfigurationTarget.Global
    );
  }

  /** Remove color overrides that would mask the theme (incl. legacy ones). */
  private async clearCustomizations(cfg: vscode.WorkspaceConfiguration): Promise<void> {
    for (const key of [
      "workbench.colorCustomizations",
      "editor.tokenColorCustomizations",
      "editor.semanticTokenColorCustomizations",
    ]) {
      await cfg.update(key, undefined, vscode.ConfigurationTarget.Global);
    }
  }

  private getHtml(webview: vscode.Webview): string {
    const nonce = getNonce();
    const stylesUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "main.css")
    );
    const scriptUri = webview.asWebviewUri(
      vscode.Uri.joinPath(this.context.extensionUri, "media", "main.js")
    );
    const csp = [
      `default-src 'none'`,
      `style-src ${webview.cspSource} 'unsafe-inline'`,
      `script-src 'nonce-${nonce}'`,
    ].join("; ");

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="${stylesUri}" rel="stylesheet" />
  <title>ThemePaint</title>
</head>
<body>
  <div id="app"></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }
}

function categoryOf(t: ThemeContribution): string {
  if (/^Cyber:/.test(t.label)) {
    return "Cybersecurity";
  }
  if (t.uiTheme === "vs") {
    return "Light";
  }
  if (t.uiTheme === "hc-black" || t.uiTheme === "hc-light") {
    return "High Contrast";
  }
  return "Dark";
}

function getNonce(): string {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
