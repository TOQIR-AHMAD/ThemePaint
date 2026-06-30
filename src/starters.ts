import * as vscode from "vscode";
import { TOKEN_TYPES } from "./tokenData";
import {
  WorkingTheme,
  TextMateRule,
  emptyTheme,
  canonicalScopeForToken,
  ThemeKind,
} from "./themeModel";

export interface StarterMeta {
  id: string; // filename without extension
  name: string;
  type: string;
  file: string;
}

const STARTER_FILES = [
  "cobalt-forge.json",
  "clean-light.json",
  "high-contrast-forge.json",
];

export async function listStarters(context: vscode.ExtensionContext): Promise<StarterMeta[]> {
  const out: StarterMeta[] = [];
  for (const file of STARTER_FILES) {
    try {
      const json = await readThemeFile(context, file);
      out.push({ id: file.replace(/\.json$/, ""), name: json.name, type: json.type, file });
    } catch {
      // Skip a starter that fails to load rather than breaking the panel.
    }
  }
  return out;
}

export async function loadStarter(
  context: vscode.ExtensionContext,
  id: string
): Promise<WorkingTheme | undefined> {
  const file = STARTER_FILES.find((f) => f.replace(/\.json$/, "") === id);
  if (!file) {
    return undefined;
  }
  const json = await readThemeFile(context, file);
  return parseThemeFile(json);
}

async function readThemeFile(context: vscode.ExtensionContext, file: string): Promise<any> {
  const uri = vscode.Uri.joinPath(context.extensionUri, "themes", file);
  const bytes = await vscode.workspace.fs.readFile(uri);
  return JSON.parse(Buffer.from(bytes).toString("utf8"));
}

/** Stable key for a scope (string or array) so we can compare them. */
function scopeKey(scope: string | string[]): string {
  return Array.isArray(scope) ? scope.join("|") : scope;
}

// scope-key -> first-class token id, built from the canonical scopes.
const SCOPE_TO_TOKEN: Record<string, string> = {};
for (const t of TOKEN_TYPES) {
  const scope = canonicalScopeForToken(t.id);
  if (scope) {
    SCOPE_TO_TOKEN[scopeKey(scope)] = t.id;
  }
}

/**
 * Convert a theme file (the export shape) into an editable WorkingTheme.
 * Recognised scopes populate first-class token controls; the rest become
 * advanced rules so nothing is lost.
 */
export function parseThemeFile(json: any): WorkingTheme {
  const theme = emptyTheme(json.name || "Imported Theme", normalizeKind(json.type));
  theme.colors = { ...(json.colors || {}) };

  const tokenColors: TextMateRule[] = Array.isArray(json.tokenColors) ? json.tokenColors : [];
  for (const rule of tokenColors) {
    if (!rule || !rule.scope || !rule.settings) {
      continue;
    }
    const id = SCOPE_TO_TOKEN[scopeKey(rule.scope)];
    if (id) {
      theme.tokens[id] = {
        foreground: rule.settings.foreground,
        fontStyle: rule.settings.fontStyle,
      };
    } else {
      theme.advancedRules.push({
        name: rule.name,
        scope: rule.scope,
        settings: { ...rule.settings },
      });
    }
  }

  if (json.semanticHighlighting) {
    theme.semanticEnabled = true;
  }
  if (json.semanticTokenColors && typeof json.semanticTokenColors === "object") {
    for (const [id, val] of Object.entries<any>(json.semanticTokenColors)) {
      if (typeof val === "string") {
        theme.semantic[id] = { foreground: val };
      } else if (val && typeof val === "object") {
        theme.semantic[id] = {
          foreground: val.foreground,
          bold: !!val.bold,
          italic: !!val.italic,
        };
      }
    }
  }

  return theme;
}

function normalizeKind(type: any): ThemeKind {
  if (type === "light") {
    return "light";
  }
  if (type === "hc-black" || type === "hc" || type === "hcBlack") {
    return "hc-black";
  }
  return "dark";
}
