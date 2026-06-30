import * as vscode from "vscode";

// Cursor-to-token support. TextMate scopes aren't exposed at a position through
// any stable API, but the document's semantic tokens are, so we decode those and
// map the cursor to a semantic type. See DEVELOPMENT.md for the details.

/** Open the built-in TextMate scope inspector. */
export async function inspectScopesGuide(): Promise<string> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return "Open a code file and place the cursor on a token first.";
  }
  try {
    await vscode.commands.executeCommand("editor.action.inspectTMScopes");
    return "Opened the TextMate scope inspector. Copy a scope from it into 'Advanced scopes'.";
  } catch {
    return "Run 'Developer: Inspect Editor Tokens and Scopes' from the Command Palette, then copy the scope.";
  }
}

export interface CursorTokenInfo {
  ok: boolean;
  message: string;
  tokenType?: string;
  modifiers?: string[];
  text?: string;
}

interface SemanticLegend {
  tokenTypes: string[];
  tokenModifiers: string[];
}

/** Decode the document's semantic tokens and find the one under the cursor. */
export async function semanticTokenAtCursor(): Promise<CursorTokenInfo> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    return { ok: false, message: "Open a code file and click on a token first." };
  }
  const uri = editor.document.uri;
  const pos = editor.selection.active;

  const legend = (await vscode.commands.executeCommand(
    "vscode.provideDocumentSemanticTokensLegend",
    uri
  )) as SemanticLegend | undefined;

  const data = (await vscode.commands.executeCommand(
    "vscode.provideDocumentSemanticTokens",
    uri
  )) as vscode.SemanticTokens | undefined;

  if (!legend || !data || !data.data || data.data.length === 0) {
    return {
      ok: false,
      message:
        "No semantic tokens for this file/language. Use 'Inspect scopes' for the TextMate scope instead.",
    };
  }

  // Decode the flat [deltaLine, deltaStart, length, typeIdx, modifiers] groups.
  const arr = data.data;
  let line = 0;
  let char = 0;
  for (let i = 0; i + 5 <= arr.length; i += 5) {
    const deltaLine = arr[i];
    const deltaStart = arr[i + 1];
    const length = arr[i + 2];
    const typeIdx = arr[i + 3];
    const modBits = arr[i + 4];

    if (deltaLine === 0) {
      char += deltaStart;
    } else {
      line += deltaLine;
      char = deltaStart;
    }

    if (line === pos.line && pos.character >= char && pos.character < char + length) {
      const tokenType = legend.tokenTypes[typeIdx] ?? `type#${typeIdx}`;
      const modifiers: string[] = [];
      legend.tokenModifiers.forEach((m, idx) => {
        if (modBits & (1 << idx)) {
          modifiers.push(m);
        }
      });
      const range = new vscode.Range(line, char, line, char + length);
      return {
        ok: true,
        message: `Semantic token: ${tokenType}${modifiers.length ? " [" + modifiers.join(", ") + "]" : ""}`,
        tokenType,
        modifiers,
        text: editor.document.getText(range),
      };
    }
  }

  return {
    ok: false,
    message:
      "No semantic token under the cursor. Try clicking directly on an identifier, or use 'Inspect scopes'.",
  };
}
