import * as vscode from "vscode";
import {
  WorkingTheme,
  buildTokenColorCustomizations,
  buildSemanticCustomizations,
} from "./themeModel";

const KEY_WORKBENCH = "workbench.colorCustomizations";
const KEY_TOKENS = "editor.tokenColorCustomizations";
const KEY_SEMANTIC = "editor.semanticTokenColorCustomizations";

export interface Snapshot {
  workbench: any;
  tokens: any;
  semantic: any;
  target: vscode.ConfigurationTarget;
}

/**
 * Owns all writes to VS Code configuration and the safety snapshot/restore.
 *
 * Live preview works by writing the assembled customization objects directly
 * to settings, which VS Code repaints instantly with no reload.
 */
export class SettingsWriter {
  private snapshot: Snapshot | undefined;
  private target: vscode.ConfigurationTarget = vscode.ConfigurationTarget.Global;

  /** Capture existing customizations so Revert can restore them exactly. */
  public takeSnapshot(): Snapshot {
    const cfg = vscode.workspace.getConfiguration();
    // inspect() lets us read the value at the exact target scope.
    const snap: Snapshot = {
      workbench: this.readScoped(cfg, KEY_WORKBENCH),
      tokens: this.readScoped(cfg, KEY_TOKENS),
      semantic: this.readScoped(cfg, KEY_SEMANTIC),
      target: this.target,
    };
    this.snapshot = snap;
    return snap;
  }

  public getSnapshot(): Snapshot | undefined {
    return this.snapshot;
  }

  public getTarget(): vscode.ConfigurationTarget {
    return this.target;
  }

  /** Switch between Global and Workspace. Re-snapshots at the new scope. */
  public setTarget(target: vscode.ConfigurationTarget) {
    this.target = target;
    this.takeSnapshot();
  }

  private readScoped(cfg: vscode.WorkspaceConfiguration, key: string): any {
    const info = cfg.inspect(key);
    if (!info) {
      return undefined;
    }
    return this.target === vscode.ConfigurationTarget.Workspace
      ? info.workspaceValue
      : info.globalValue;
  }

  /** Write the whole working theme to settings for live preview. */
  public async applyTheme(theme: WorkingTheme): Promise<void> {
    const cfg = vscode.workspace.getConfiguration();
    await cfg.update(
      KEY_WORKBENCH,
      Object.keys(theme.colors).length ? theme.colors : undefined,
      this.target
    );

    const tokens = buildTokenColorCustomizations(theme);
    await cfg.update(KEY_TOKENS, hasContent(tokens) ? tokens : undefined, this.target);

    if (theme.semanticEnabled || Object.keys(theme.semantic).length) {
      const semantic = buildSemanticCustomizations(theme);
      await cfg.update(KEY_SEMANTIC, semantic, this.target);
    } else {
      await cfg.update(KEY_SEMANTIC, undefined, this.target);
    }
  }

  /** Write only the workbench colors (used for the fast single-color path). */
  public async applyWorkbenchColors(colors: Record<string, string>): Promise<void> {
    const cfg = vscode.workspace.getConfiguration();
    await cfg.update(
      KEY_WORKBENCH,
      Object.keys(colors).length ? colors : undefined,
      this.target
    );
  }

  /** Restore the captured snapshot exactly, undoing all preview writes. */
  public async revert(): Promise<void> {
    if (!this.snapshot) {
      return;
    }
    const cfg = vscode.workspace.getConfiguration();
    const t = this.snapshot.target;
    await cfg.update(KEY_WORKBENCH, this.snapshot.workbench, t);
    await cfg.update(KEY_TOKENS, this.snapshot.tokens, t);
    await cfg.update(KEY_SEMANTIC, this.snapshot.semantic, t);
  }
}

function hasContent(obj: any): boolean {
  return obj && typeof obj === "object" && Object.keys(obj).length > 0;
}
