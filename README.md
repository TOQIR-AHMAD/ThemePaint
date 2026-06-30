# ThemeForge

Build a VS Code color theme by picking colors instead of editing JSON. It covers
both the workbench UI and code syntax, and writes your changes straight to settings
so the editor updates as you go.

Comes with three starter themes you can use directly or fork as a starting point.
Save your work, export it as an installable theme, and revert if you don't like it.

## Running it

```bash
npm install
npm run watch
```

Press F5 to launch the Extension Development Host, then run **ThemeForge: Open Theme
Creator** from the Command Palette.

A quick tour:

- Change a UI color or a syntax color and watch the editor repaint.
- In the Syntax tab, click "Open sample code" to get a snippet to preview against.
- Pick a starter from the dropdown, hit Fork, tweak it, and Save.
- Export to a folder to get an installable theme package.
- Revert puts your original colors back.

## The tabs

- **UI Colors** — about 80 of the most common workbench colors, grouped and
  searchable. "Show advanced" adds a box to set any other color ID by name.
- **Syntax** — foreground and font style for comments, strings, numbers, keywords,
  functions, variables, types, operators and classes, plus an area for raw
  `{ scope, foreground, fontStyle }` rules.
- **Semantic** — `editor.semanticTokenColorCustomizations` for the common semantic
  token types.
- **My Themes** — themes you've saved (load, rename, duplicate, delete).
- **JSON** — the theme file as it'll be exported, with a copy button.
- **Click-to-target** — identify the semantic token under your cursor, or open the
  built-in TextMate scope inspector.

The contrast bar at the top shows WCAG ratios for a few key foreground/background
pairs and flags ones that don't meet AA.

## User vs Workspace

"Apply to" controls where customizations go — User (global, the default) or
Workspace. Workspace needs an open folder. Revert restores whichever you picked.

## Exporting

Export writes a folder with a `package.json`, the theme JSON under `themes/`, and a
README. If `@vscode/vsce` is installed it runs `vsce package` for you; otherwise it
prints the command. From there:

```bash
cd <name>-theme
vsce package
code --install-extension <name>-<version>.vsix
```

Publishing to the Marketplace needs a publisher and a PAT — see the
[VS Code publishing docs](https://code.visualstudio.com/api/working-with-extensions/publishing-extension).

## How it works

VS Code applies these three settings live, with no reload:

- `workbench.colorCustomizations` for the UI
- `editor.tokenColorCustomizations` for TextMate syntax colors
- `editor.semanticTokenColorCustomizations` for semantic colors

The webview only sends messages; the extension host does all the writing. When the
panel opens it snapshots your existing customizations so Revert can restore them
exactly. 8-digit `#RRGGBBAA` hex works everywhere.

## Layout

```
src/
  extension.ts        activation + command
  panel.ts            webview + messaging; the only place that writes settings
  colorData.ts        the curated workbench color list
  tokenData.ts        token and semantic type definitions
  themeModel.ts       working state + builders for the settings objects
  settingsWriter.ts   snapshot / apply / revert
  themeStore.ts       saved themes (globalState)
  starters.ts         load and parse the bundled starters
  exporter.ts         write the package, run vsce
  contrast.ts         WCAG contrast math
  tokenInspector.ts   semantic token at cursor
  sample.ts           sample snippet
media/                webview (main.js, main.css)
themes/               the three starters
```

## License

MIT
# ThemePaint
