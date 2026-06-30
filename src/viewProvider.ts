import * as vscode from "vscode";
import { ThemePaintController } from "./controller";

/**
 * Hosts the ThemePaint UI inside the sidebar (Activity Bar) view. VS Code calls
 * resolveWebviewView when the view first becomes visible; we attach a controller
 * to its webview. retainContextWhenHidden keeps the working state alive while the
 * view is collapsed so the snapshot/revert contract still holds.
 */
export class ThemePaintViewProvider implements vscode.WebviewViewProvider {
  public static readonly viewId = "themePaint.view";

  private controller: ThemePaintController | undefined;

  constructor(private readonly context: vscode.ExtensionContext) {}

  resolveWebviewView(webviewView: vscode.WebviewView): void {
    this.controller = new ThemePaintController(webviewView.webview, this.context);
    webviewView.onDidDispose(() => {
      this.controller?.dispose();
      this.controller = undefined;
    });
  }
}
