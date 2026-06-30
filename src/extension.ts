import * as vscode from "vscode";
import { ThemePaintViewProvider } from "./viewProvider";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ThemePaintViewProvider.viewId,
      new ThemePaintViewProvider(context),
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand("themePaint.open", () => {
      vscode.commands.executeCommand("themePaint.view.focus");
    })
  );
}

export function deactivate() {
  // Nothing to clean up — themes are native contributions.
}
