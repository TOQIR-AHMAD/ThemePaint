import * as vscode from "vscode";
import { ThemePaintController } from "./controller";

/**
 * Optional wide editor-panel host for ThemePaint. The sidebar view is the main
 * experience; this exists for users who prefer the full-width layout.
 */
export class ThemePaintPanel {
  public static current: ThemePaintPanel | undefined;
  private static readonly viewType = "themePaint.panel";

  private readonly panel: vscode.WebviewPanel;
  private controller: ThemePaintController;

  public static createOrShow(context: vscode.ExtensionContext) {
    const column = vscode.window.activeTextEditor?.viewColumn;
    if (ThemePaintPanel.current) {
      ThemePaintPanel.current.panel.reveal(column);
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      ThemePaintPanel.viewType,
      "ThemePaint",
      column ?? vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, "media")],
      }
    );
    ThemePaintPanel.current = new ThemePaintPanel(panel, context);
  }

  private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    this.panel = panel;
    this.controller = new ThemePaintController(panel.webview, context);
    this.panel.onDidDispose(() => this.dispose());
  }

  public dispose() {
    ThemePaintPanel.current = undefined;
    this.controller.dispose();
    this.panel.dispose();
  }
}
