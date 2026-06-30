import * as vscode from "vscode";

interface ThemeContribution {
  label: string;
  uiTheme: string;
  path: string;
}

const ORIGINAL_KEY = "themePaint.originalTheme";

/**
 * The ThemePaint sidebar: a simple picker for the bundled color themes.
 *
 * Themes are real VS Code color themes (contributed via package.json), so
 * applying one just sets `workbench.colorTheme`. VS Code paints it natively, and
 * if the extension is uninstalled the themes disappear and VS Code falls back to
 * its default theme on its own — nothing is left behind in the user's colors.
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

  private themes(): ThemeContribution[] {
    const contributed = this.context.extension.packageJSON?.contributes?.themes;
    return Array.isArray(contributed) ? contributed : [];
  }

  private currentTheme(): string | undefined {
    return vscode.workspace.getConfiguration("workbench").get<string>("colorTheme");
  }

  private async onMessage(msg: any, webview: vscode.Webview): Promise<void> {
    switch (msg?.type) {
      case "ready":
        webview.postMessage({
          type: "init",
          themes: this.themes().map((t) => ({ label: t.label, uiTheme: t.uiTheme })),
          current: this.currentTheme(),
        });
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
    // Remember the theme the user had before ThemePaint first changed it.
    if (this.context.globalState.get(ORIGINAL_KEY) === undefined) {
      await this.context.globalState.update(ORIGINAL_KEY, this.currentTheme() ?? null);
    }
    await cfg.update("workbench.colorTheme", label, vscode.ConfigurationTarget.Global);
  }

  private async reset(): Promise<void> {
    const cfg = vscode.workspace.getConfiguration();
    const original = this.context.globalState.get<string | null>(ORIGINAL_KEY);
    await cfg.update(
      "workbench.colorTheme",
      original === null ? undefined : original,
      vscode.ConfigurationTarget.Global
    );
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
      `style-src ${webview.cspSource}`,
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

function getNonce(): string {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
