/**
 * Token (syntax) definitions for the Syntax tab, plus semantic token types.
 *
 * Two kinds of first-class TextMate token controls:
 *  - `key`   : maps to a built-in convenience key of editor.tokenColorCustomizations
 *              (comments, strings, numbers, keywords, types, functions, variables).
 *              These accept { foreground, fontStyle }.
 *  - `scope` : has no convenience key, so it is written as a textMateRules entry
 *              with these standard scopes.
 */

export interface TokenTypeDef {
  /** Stable id used in messaging and as the textMateRules tag for scope-based types. */
  id: string;
  label: string;
  /** Built-in convenience key, if one exists. */
  key?: string;
  /** Standard TextMate scope(s) used when there is no convenience key. */
  scope?: string;
}

export const TOKEN_TYPES: TokenTypeDef[] = [
  { id: "comments", label: "Comments", key: "comments" },
  { id: "strings", label: "Strings", key: "strings" },
  { id: "numbers", label: "Numbers", key: "numbers" },
  { id: "keywords", label: "Keywords", key: "keywords" },
  { id: "functions", label: "Functions", key: "functions" },
  { id: "variables", label: "Variables", key: "variables" },
  { id: "types", label: "Types", key: "types" },
  { id: "operators", label: "Operators", scope: "keyword.operator" },
  { id: "classes", label: "Classes", scope: "entity.name.type.class" },
];

export const FONT_STYLES = ["bold", "italic", "underline"] as const;
export type FontStyleFlag = (typeof FONT_STYLES)[number];

/** Common semantic token types for the Semantic tab. */
export interface SemanticTypeDef {
  id: string;
  label: string;
}

export const SEMANTIC_TYPES: SemanticTypeDef[] = [
  { id: "variable", label: "Variable" },
  { id: "parameter", label: "Parameter" },
  { id: "property", label: "Property" },
  { id: "function", label: "Function" },
  { id: "method", label: "Method" },
  { id: "class", label: "Class" },
  { id: "interface", label: "Interface" },
  { id: "enum", label: "Enum" },
  { id: "type", label: "Type" },
  { id: "namespace", label: "Namespace" },
];
