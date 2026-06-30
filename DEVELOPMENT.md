# Development notes

## Build

```bash
npm install
npm run watch       # esbuild watch, use this during dev
npm run compile     # one-off bundle
npm run typecheck   # tsc --noEmit
npm run build       # minified production bundle
```

F5 launches the Extension Development Host. The host code in `src/` is bundled to
`dist/extension.js` by esbuild; the webview in `media/` ships as plain files loaded
through `webview.asWebviewUri`.

## Snapshot / revert

When the panel opens, `SettingsWriter.takeSnapshot()` records the current
`workbench.colorCustomizations`, `editor.tokenColorCustomizations` and
`editor.semanticTokenColorCustomizations` at whichever target scope is active. The
working theme is seeded from those values, so anything you'd already customized shows
up and isn't dropped. Live preview overwrites the settings as you edit; Revert writes
the snapshot back as-is.

Per-theme scoped customizations (the `"[Theme Name]": { ... }` form) survive
snapshot/revert but aren't shown as editable rows. Writes are kept flat/global for now.

## Click-to-target

The goal was to click syntax in real code and recolor just that token. What's actually
reachable from an extension:

- TextMate scope at a position: there's no stable public API for it. The only
  first-party access is the `editor.action.inspectTMScopes` command, which opens a
  hover; the data isn't returned to extensions.
- Semantic tokens: the built-in `vscode.provideDocumentSemanticTokensLegend` and
  `vscode.provideDocumentSemanticTokens` commands return the legend and the encoded
  token array. We decode the `[Δline, Δstart, length, typeIdx, modifiers]` groups and
  find the token covering the cursor, which gives us the semantic type.

So the implemented version (`tokenInspector.ts`) maps the cursor to a semantic token
type and offers to jump to it in the Semantic tab. For grammars without a semantic
provider it falls back to opening the scope inspector and pointing you at the Advanced
scopes box. Plain text and some config formats won't return tokens; the UI says so.

A fuller version could bundle `vscode-textmate` + `vscode-oniguruma` with the theme
grammars and resolve scopes directly, but that's heavy and wasn't worth it here.

## Messaging

Webview to host: `ready`, `setColor`/`resetColor`, `setToken`/`resetToken`,
`addAdvancedRule`/`removeAdvancedRule`, `setSemanticEnabled`/`setSemantic`/`resetSemantic`,
`setMeta`, `setTarget`, `loadStarter`, `revert`, `saveTheme`, `saveToFile`, `loadSaved`,
`renameSaved`, `duplicateSaved`, `deleteSaved`, `export`, `openSample`, `inspectScopes`,
`pickFromCursor`.

Host to webview: `init`, `loadTheme` (full re-render), `sync` (JSON + contrast only),
`savedThemesUpdated`, `exportResult`, `cursorToken`, `status`.

## Notes

- Choosing the Workspace target with no folder open will fail the write; it shows up as
  an error toast.
- The curated color list is a subset. The "Add any color ID" box covers the rest, just
  without a friendly label.
- `vsce package` can be slow or unavailable offline, so the command is always printed.
