import { TOKEN_TYPES } from "./tokenData";

/** A raw TextMate rule as stored in editor.tokenColorCustomizations.textMateRules. */
export interface TextMateRule {
  name?: string;
  scope: string | string[];
  settings: { foreground?: string; fontStyle?: string };
}

/** Per-token-type setting in the working model. */
export interface TokenSetting {
  foreground?: string;
  /** Space-separated fontStyle string, e.g. "bold italic". Empty string clears. */
  fontStyle?: string;
}

export interface SemanticSetting {
  foreground?: string;
  fontStyle?: string;
  bold?: boolean;
  italic?: boolean;
}

export type ThemeKind = "dark" | "light" | "hc-black";

/**
 * The full editable theme state held by the extension host.
 * This is the single source of truth; the webview is a view over it.
 */
export interface WorkingTheme {
  name: string;
  type: ThemeKind;
  /** workbench.colorCustomizations: colorId -> hex */
  colors: Record<string, string>;
  /** First-class token settings keyed by TOKEN_TYPES id. */
  tokens: Record<string, TokenSetting>;
  /** User-added advanced TextMate rules. */
  advancedRules: TextMateRule[];
  semanticEnabled: boolean;
  /** semantic token type id -> setting */
  semantic: Record<string, SemanticSetting>;
}

export function emptyTheme(name = "My Theme", type: ThemeKind = "dark"): WorkingTheme {
  return {
    name,
    type,
    colors: {},
    tokens: {},
    advancedRules: [],
    semanticEnabled: false,
    semantic: {},
  };
}

const TOKEN_BY_ID = Object.fromEntries(TOKEN_TYPES.map((t) => [t.id, t]));

/** Build the value for `editor.tokenColorCustomizations`. */
export function buildTokenColorCustomizations(theme: WorkingTheme): any {
  const out: any = {};
  const textMateRules: TextMateRule[] = [];

  for (const [id, setting] of Object.entries(theme.tokens)) {
    if (!setting || (!setting.foreground && !setting.fontStyle)) {
      continue;
    }
    const def = TOKEN_BY_ID[id];
    if (!def) {
      continue;
    }
    const settings: { foreground?: string; fontStyle?: string } = {};
    if (setting.foreground) {
      settings.foreground = setting.foreground;
    }
    if (setting.fontStyle !== undefined) {
      settings.fontStyle = setting.fontStyle; // may be "" to explicitly clear styles
    }

    if (def.key) {
      out[def.key] = settings;
    } else if (def.scope) {
      textMateRules.push({ name: `ThemeForge ${def.label}`, scope: def.scope, settings });
    }
  }

  // Advanced rules go last so they can override the first-class scope rules.
  for (const rule of theme.advancedRules) {
    if (rule.scope && rule.settings && (rule.settings.foreground || rule.settings.fontStyle)) {
      textMateRules.push(rule);
    }
  }

  if (textMateRules.length) {
    out.textMateRules = textMateRules;
  }
  return out;
}

/** Build the value for `editor.semanticTokenColorCustomizations`. */
export function buildSemanticCustomizations(theme: WorkingTheme): any {
  const rules: Record<string, any> = {};
  for (const [id, s] of Object.entries(theme.semantic)) {
    if (!s) {
      continue;
    }
    const entry: any = {};
    if (s.foreground) {
      entry.foreground = s.foreground;
    }
    if (s.bold) {
      entry.bold = true;
    }
    if (s.italic) {
      entry.italic = true;
    }
    if (Object.keys(entry).length) {
      rules[id] = entry;
    }
  }
  return { enabled: theme.semanticEnabled, rules };
}

/** Produce the final exportable theme file object. */
export function buildThemeFile(theme: WorkingTheme): any {
  const tokenCustom = buildTokenColorCustomizations(theme);
  const tokenColors: TextMateRule[] = [];

  // Convert convenience keys + scope rules into a tokenColors array for the file.
  for (const [id, setting] of Object.entries(theme.tokens)) {
    if (!setting || (!setting.foreground && !setting.fontStyle)) {
      continue;
    }
    const def = TOKEN_BY_ID[id];
    if (!def) {
      continue;
    }
    const settings: { foreground?: string; fontStyle?: string } = {};
    if (setting.foreground) {
      settings.foreground = setting.foreground;
    }
    if (setting.fontStyle) {
      settings.fontStyle = setting.fontStyle;
    }
    const scope = def.scope ?? defaultScopeForKey(def.key!);
    tokenColors.push({ name: `ThemeForge ${def.label}`, scope, settings });
  }
  for (const rule of theme.advancedRules) {
    if (rule.scope && rule.settings && (rule.settings.foreground || rule.settings.fontStyle)) {
      tokenColors.push(rule);
    }
  }

  const file: any = {
    name: theme.name,
    type: theme.type,
    colors: { ...theme.colors },
    tokenColors,
  };

  if (theme.semanticEnabled) {
    file.semanticHighlighting = true;
    const semantic = buildSemanticCustomizations(theme);
    if (Object.keys(semantic.rules).length) {
      file.semanticTokenColors = semantic.rules;
    }
  }

  // Keep the (unused by VS Code in tokenCustom form) for power-user reference.
  void tokenCustom;
  return file;
}

/** The canonical scope(s) a first-class token id writes to in an exported file. */
export function canonicalScopeForToken(id: string): string | string[] | undefined {
  const def = TOKEN_BY_ID[id];
  if (!def) {
    return undefined;
  }
  return def.scope ?? defaultScopeForKey(def.key!);
}

/** Map a convenience key to standard scopes for the exported file. */
function defaultScopeForKey(key: string): string | string[] {
  switch (key) {
    case "comments":
      return "comment";
    case "strings":
      return "string";
    case "numbers":
      return "constant.numeric";
    case "keywords":
      return "keyword";
    case "functions":
      return ["entity.name.function", "support.function"];
    case "variables":
      return ["variable", "meta.definition.variable.name"];
    case "types":
      return ["entity.name.type", "support.type", "support.class"];
    default:
      return key;
  }
}
