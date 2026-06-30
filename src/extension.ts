import * as vscode from "vscode";
import { ThemePaintPanel } from "./panel";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("themePaint.open", () => {
      ThemePaintPanel.createOrShow(context);
    })
  );
}

export function deactivate() {
  // Nothing to clean up: the panel disposes itself via onDidDispose.
}
