import * as vscode from "vscode";
import { COLOR_GROUPS, COLOR_LABELS } from "./colorData";
import { TOKEN_TYPES, SEMANTIC_TYPES } from "./tokenData";
import {
  WorkingTheme,
  emptyTheme,
  buildThemeFile,
  TextMateRule,
} from "./themeModel";
import { SettingsWriter } from "./settingsWriter";
import { ThemeStore } from "./themeStore";
import { listStarters, loadStarter } from "./starters";
import { exportTheme } from "./exporter";
import { evaluateContrast } from "./contrast";
import { SAMPLE_CODE } from "./sample";
import { inspectScopesGuide, semanticTokenAtCursor } from "./tokenInspector";

/** Pairs whose contrast we surface live in the UI. */
const CONTRAST_PAIRS: { label: string; fg: string; bg: string }[] = [
  { label: "Editor text", fg: "editor.foreground", bg: "editor.background" },
  { label: "Comments", fg: "@token:comments", bg: "editor.background" },
  { label: "Strings", fg: "@token:strings", bg: "editor.background" },
  { label: "Keywords", fg: "@token:keywords", bg: "editor.background" },
  { label: "Functions", fg: "@token:functions", bg: "editor.background" },
  { label: "Status bar", fg: "statusBar.foreground", bg: "statusBar.background" },
  { label: "Active tab", fg: "tab.activeForeground", bg: "tab.activeBackground" },
  { label: "Button", fg: "button.foreground", bg: "button.background" },
];

export class ThemeForgePanel {
  public static current: ThemeForgePanel | undefined;
  private static readonly viewType = "themeForge";

  private readonly panel: vscode.WebviewPanel;
  private readonly context: vscode.ExtensionContext;
  private readonly disposables: vscode.Disposable[] = [];

  private readonly writer = new SettingsWriter();
  private readonly store: ThemeStore;
  private theme: WorkingTheme = emptyTheme();
  /** id of the currently-loaded saved theme, if any (for overwrite-on-save). */
  private currentSavedId: string | undefined;
  private seq = 0; // monotonic counter used where a unique value is needed

  public static createOrShow(context: vscode.ExtensionContext) {
    const column = vscode.window.activeTextEditor?.viewColumn;
    if (ThemeForgePanel.current) {
      ThemeForgePanel.current.panel.reveal(column);
      return;
    }
    const panel = vscode.window.createWebviewPanel(
      ThemeForgePanel.viewType,
      "ThemeForge",
      column ?? vscode.ViewColumn.One,
      {
        enableScripts: true,
        retainContextWhenHidden: true,
        localResourceRoots: [vscode.Uri.joinPath(context.extensionUri, "media")],
      }
    );
    ThemeForgePanel.current = new ThemeForgePanel(panel, context);
  }

  private constructor(panel: vscode.WebviewPanel, context: vscode.ExtensionContext) {
    this.panel = panel;
    this.context = context;
    this.store = new ThemeStore(context);

    // Snapshot existing customizations before we touch anything.
    this.writer.takeSnapshot();
    this.seedFromSnapshot();

    this.panel.webview.html = this.getHtml(this.panel.webview);
    this.panel.onDidDispose(() => this.dispose(), null, this.disposables);
    this.panel.webview.onDidReceiveMessage((m) => this.handleMessage(m), null, this.disposables);
  }

  // ---- initial state -------------------------------------------------------

  /** Pre-fill the working theme from the user's existing customizations. */
  private seedFromSnapshot() {
    const snap = this.writer.getSnapshot();
    if (!snap) {
      return;
    }
    // Workbench colors: keep only flat colorId -> "#hex" string entries.
    if (snap.workbench && typeof snap.workbench === "object") {
      for (const [k, v] of Object.entries(snap.workbench)) {
        if (typeof v === "string" && !k.startsWith("[")) {
          this.theme.colors[k] = v;
        }
      }
    }
    // Token customizations.
    if (snap.tokens && typeof snap.tokens === "object") {
      for (const t of TOKEN_TYPES) {
        if (t.key && snap.tokens[t.key]) {
          const val = snap.tokens[t.key];
          if (typeof val === "string") {
            this.theme.tokens[t.id] = { foreground: val };
          } else if (val && typeof val === "object") {
            this.theme.tokens[t.id] = { foreground: val.foreground, fontStyle: val.fontStyle };
          }
        }
      }
      if (Array.isArray(snap.tokens.textMateRules)) {
        this.theme.advancedRules.push(...snap.tokens.textMateRules);
      }
    }
    // Semantic.
    if (snap.semantic && typeof snap.semantic === "object") {
      this.theme.semanticEnabled = !!snap.semantic.enabled;
      const rules = snap.semantic.rules || {};
      for (const [id, val] of Object.entries<any>(rules)) {
        if (typeof val === "string") {
          this.theme.semantic[id] = { foreground: val };
        } else if (val && typeof val === "object") {
          this.theme.semantic[id] = {
            foreground: val.foreground,
            bold: !!val.bold,
            italic: !!val.italic,
          };
        }
      }
    }
  }

  private async sendInit() {
    const starters = await listStarters(this.context);
    this.panel.webview.postMessage({
      type: "init",
      data: {
        colorGroups: COLOR_GROUPS,
        tokenTypes: TOKEN_TYPES,
        semanticTypes: SEMANTIC_TYPES,
        starters,
        savedThemes: this.store.list(),
        theme: this.theme,
        target: this.targetString(),
        json: this.themeJson(),
        contrast: this.contrastResults(),
      },
    });
  }

  // ---- message handling ----------------------------------------------------

  private async handleMessage(msg: any): Promise<void> {
    try {
      switch (msg?.type) {
        case "ready":
          await this.sendInit();
          break;

        case "setColor":
          if (typeof msg.id === "string" && typeof msg.value === "string") {
            this.theme.colors[msg.id] = msg.value;
            await this.applyAndSync();
          }
          break;

        case "resetColor":
          delete this.theme.colors[msg.id];
          await this.applyAndSync();
          break;

        case "setToken": {
          const cur = this.theme.tokens[msg.id] || {};
          if (msg.foreground !== undefined) {
            cur.foreground = msg.foreground || undefined;
          }
          if (msg.fontStyle !== undefined) {
            cur.fontStyle = msg.fontStyle;
          }
          this.theme.tokens[msg.id] = cur;
          await this.applyAndSync();
          break;
        }

        case "resetToken":
          delete this.theme.tokens[msg.id];
          await this.applyAndSync();
          break;

        case "addAdvancedRule": {
          const rule: TextMateRule = {
            scope: String(msg.scope || "").trim(),
            settings: {},
          };
          if (msg.foreground) {
            rule.settings.foreground = msg.foreground;
          }
          if (msg.fontStyle) {
            rule.settings.fontStyle = msg.fontStyle;
          }
          if (rule.scope) {
            this.theme.advancedRules.push(rule);
            await this.applyAndSync(true);
          }
          break;
        }

        case "removeAdvancedRule":
          if (typeof msg.index === "number") {
            this.theme.advancedRules.splice(msg.index, 1);
            await this.applyAndSync(true);
          }
          break;

        case "setSemanticEnabled":
          this.theme.semanticEnabled = !!msg.enabled;
          await this.applyAndSync();
          break;

        case "setSemantic": {
          const cur = this.theme.semantic[msg.id] || {};
          if (msg.foreground !== undefined) {
            cur.foreground = msg.foreground || undefined;
          }
          if (msg.bold !== undefined) {
            cur.bold = !!msg.bold;
          }
          if (msg.italic !== undefined) {
            cur.italic = !!msg.italic;
          }
          this.theme.semantic[msg.id] = cur;
          await this.applyAndSync();
          break;
        }

        case "resetSemantic":
          delete this.theme.semantic[msg.id];
          await this.applyAndSync();
          break;

        case "setMeta":
          if (typeof msg.name === "string") {
            this.theme.name = msg.name;
          }
          if (msg.kind === "dark" || msg.kind === "light" || msg.kind === "hc-black") {
            this.theme.type = msg.kind;
          }
          await this.sync();
          break;

        case "setTarget":
          this.writer.setTarget(
            msg.target === "workspace"
              ? vscode.ConfigurationTarget.Workspace
              : vscode.ConfigurationTarget.Global
          );
          await this.applyAndSync();
          break;

        case "loadStarter":
          await this.doLoadStarter(msg.id, !!msg.fork);
          break;

        case "revert":
          await this.doRevert();
          break;

        case "saveTheme":
          await this.doSave();
          break;

        case "saveToFile":
          await this.doSaveToFile();
          break;

        case "loadSaved":
          await this.doLoadSaved(msg.id);
          break;

        case "renameSaved":
          await this.store.rename(msg.id, msg.name, ++this.seq + Date.now());
          this.pushSavedThemes();
          break;

        case "duplicateSaved":
          await this.store.duplicate(msg.id, ++this.seq + Date.now());
          this.pushSavedThemes();
          break;

        case "deleteSaved":
          await this.store.delete(msg.id);
          if (this.currentSavedId === msg.id) {
            this.currentSavedId = undefined;
          }
          this.pushSavedThemes();
          break;

        case "export":
          await this.doExport();
          break;

        case "openSample":
          await this.openSample();
          break;

        case "inspectScopes":
          await this.runInspectScopes();
          break;

        case "pickFromCursor":
          await this.runPickFromCursor();
          break;

        default:
          console.warn("[ThemeForge] Unhandled message:", msg);
      }
    } catch (err: any) {
      this.status("error", err?.message ?? String(err));
    }
  }

  // ---- actions -------------------------------------------------------------

  private async applyAndSync(structural = false) {
    await this.writer.applyTheme(this.theme);
    if (structural) {
      this.sendLoadTheme();
    } else {
      await this.sync();
    }
  }

  private async sync() {
    this.panel.webview.postMessage({
      type: "sync",
      json: this.themeJson(),
      contrast: this.contrastResults(),
      name: this.theme.name,
      kind: this.theme.type,
    });
  }

  private sendLoadTheme() {
    this.panel.webview.postMessage({
      type: "loadTheme",
      theme: this.theme,
      json: this.themeJson(),
      contrast: this.contrastResults(),
      target: this.targetString(),
    });
  }

  private pushSavedThemes() {
    this.panel.webview.postMessage({
      type: "savedThemesUpdated",
      savedThemes: this.store.list(),
    });
  }

  private async doLoadStarter(id: string, fork: boolean) {
    const loaded = await loadStarter(this.context, id);
    if (!loaded) {
      this.status("error", `Starter "${id}" not found.`);
      return;
    }
    this.theme = loaded;
    if (fork) {
      this.theme.name = `${loaded.name} (Fork)`;
      this.currentSavedId = undefined; // a fork is a brand-new theme
    } else {
      this.currentSavedId = undefined;
    }
    await this.writer.applyTheme(this.theme);
    this.sendLoadTheme();
    this.status("info", fork ? `Forked "${loaded.name}".` : `Loaded "${loaded.name}".`);
  }

  private async doRevert() {
    await this.writer.revert();
    // Reset working theme to the snapshot contents.
    this.theme = emptyTheme(this.theme.name, this.theme.type);
    this.seedFromSnapshot();
    this.sendLoadTheme();
    this.status("info", "Reverted to your original customizations.");
  }

  private async doSave() {
    const now = ++this.seq + Date.now();
    const rec = await this.store.save(this.theme, now, this.currentSavedId);
    this.currentSavedId = rec.id;
    this.pushSavedThemes();
    this.status("info", `Saved "${this.theme.name}".`);
  }

  private async doSaveToFile() {
    const uri = await vscode.window.showSaveDialog({
      saveLabel: "Save Theme JSON",
      filters: { "Theme JSON": ["json"] },
      defaultUri: vscode.Uri.file(`${slugFile(this.theme.name)}-color-theme.json`),
    });
    if (!uri) {
      return;
    }
    const text = JSON.stringify(buildThemeFile(this.theme), null, 2) + "\n";
    await vscode.workspace.fs.writeFile(uri, Buffer.from(text, "utf8"));
    this.status("info", `Wrote ${uri.fsPath}`);
  }

  private async doLoadSaved(id: string) {
    const rec = this.store.get(id);
    if (!rec) {
      this.status("error", "Saved theme not found.");
      return;
    }
    this.theme = JSON.parse(JSON.stringify(rec.theme));
    this.currentSavedId = id;
    await this.writer.applyTheme(this.theme);
    this.sendLoadTheme();
    this.status("info", `Loaded "${this.theme.name}".`);
  }

  private async doExport() {
    const folder = await vscode.window.showOpenDialog({
      canSelectFolders: true,
      canSelectFiles: false,
      openLabel: "Export theme package here",
    });
    if (!folder || !folder[0]) {
      return;
    }
    const target = vscode.Uri.joinPath(folder[0], slugFile(this.theme.name) + "-theme");
    this.status("info", "Building theme package…");
    const result = await exportTheme(target, this.theme, this.context.extension.packageJSON.version || "0.0.1");
    this.panel.webview.postMessage({ type: "exportResult", result });

    const actions = ["Open Folder"];
    const choice = await vscode.window.showInformationMessage(
      `Theme exported to ${result.folder}. ${result.vsceMessage}`,
      ...actions
    );
    if (choice === "Open Folder") {
      await vscode.commands.executeCommand("revealFileInOS", vscode.Uri.file(result.folder));
    }
  }

  private async openSample() {
    const doc = await vscode.workspace.openTextDocument({
      content: SAMPLE_CODE,
      language: "typescript",
    });
    await vscode.window.showTextDocument(doc, {
      viewColumn: vscode.ViewColumn.Beside,
      preview: true,
      preserveFocus: true,
    });
  }

  private async runInspectScopes() {
    const text = await inspectScopesGuide();
    this.status("info", text);
  }

  private async runPickFromCursor() {
    const info = await semanticTokenAtCursor();
    this.panel.webview.postMessage({ type: "cursorToken", info });
  }

  // ---- helpers -------------------------------------------------------------

  private targetString(): "global" | "workspace" {
    return this.writer.getTarget() === vscode.ConfigurationTarget.Workspace
      ? "workspace"
      : "global";
  }

  private themeJson(): string {
    return JSON.stringify(buildThemeFile(this.theme), null, 2);
  }

  private contrastResults() {
    const colorOf = (ref: string): string | undefined => {
      if (ref.startsWith("@token:")) {
        const id = ref.slice("@token:".length);
        return this.theme.tokens[id]?.foreground;
      }
      return this.theme.colors[ref];
    };
    const out: any[] = [];
    for (const pair of CONTRAST_PAIRS) {
      const fg = colorOf(pair.fg);
      const bg = colorOf(pair.bg);
      if (!fg || !bg) {
        continue;
      }
      const res = evaluateContrast(fg, bg);
      if (res) {
        out.push({ label: pair.label, ratio: res.ratio, aaNormal: res.aaNormal, aaLarge: res.aaLarge });
      }
    }
    return out;
  }

  private status(level: "info" | "warn" | "error", text: string) {
    this.panel.webview.postMessage({ type: "status", level, text });
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
      `img-src ${webview.cspSource} data:`,
      `font-src ${webview.cspSource}`,
    ].join("; ");

    void COLOR_LABELS; // referenced by data sent to webview

    return /* html */ `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta http-equiv="Content-Security-Policy" content="${csp}" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link href="${stylesUri}" rel="stylesheet" />
  <title>ThemeForge</title>
</head>
<body>
  <div id="tf-app"><p class="tf-placeholder">Loading ThemeForge…</p></div>
  <script nonce="${nonce}" src="${scriptUri}"></script>
</body>
</html>`;
  }

  public dispose() {
    ThemeForgePanel.current = undefined;
    this.panel.dispose();
    while (this.disposables.length) {
      this.disposables.pop()?.dispose();
    }
  }
}

function slugFile(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "theme"
  );
}

function getNonce(): string {
  let text = "";
  const possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (let i = 0; i < 32; i++) {
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  }
  return text;
}
