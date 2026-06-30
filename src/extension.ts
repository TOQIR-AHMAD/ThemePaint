import * as vscode from "vscode";
import { ThemePaintPanel } from "./panel";
import { ThemePaintViewProvider } from "./viewProvider";

export function activate(context: vscode.ExtensionContext) {
  // The sidebar view is the primary UI; it renders in the Activity Bar container.
  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ThemePaintViewProvider.viewId,
      new ThemePaintViewProvider(context),
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  // "Open Theme Creator" focuses the sidebar view.
  context.subscriptions.push(
    vscode.commands.registerCommand("themePaint.open", () => {
      vscode.commands.executeCommand("themePaint.view.focus");
    })
  );

  // Optional: open the full-width editor panel instead of the sidebar.
  context.subscriptions.push(
    vscode.commands.registerCommand("themePaint.openPanel", () => {
      ThemePaintPanel.createOrShow(context);
    })
  );
}

export function deactivate() {
  // Controllers dispose themselves via their view/panel onDidDispose.
}
