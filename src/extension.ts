import * as vscode from "vscode";
import { ThemeForgePanel } from "./panel";

export function activate(context: vscode.ExtensionContext) {
  context.subscriptions.push(
    vscode.commands.registerCommand("themeForge.open", () => {
      ThemeForgePanel.createOrShow(context);
    })
  );
}

export function deactivate() {
  // Nothing to clean up: the panel disposes itself via onDidDispose.
}
