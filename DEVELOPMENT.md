# Development notes

## Build

```bash
npm install
npm run watch       # esbuild watch
npm run compile     # one-off bundle
npm run typecheck   # tsc --noEmit
npm run build       # production bundle
```

F5 launches the Extension Development Host.

## How it works

ThemePaint ships its themes as real VS Code color themes, listed in `package.json`
under `contributes.themes` and stored as JSON in `themes/`. Applying a theme just
sets `workbench.colorTheme` (User scope), which VS Code paints natively. Because the
themes are normal contributions, uninstalling the extension removes them and VS Code
reverts to its default theme — no leftover color settings.

The sidebar is a webview view (`src/viewProvider.ts`, UI in `media/main.js` + `main.css`)
that lists the contributed themes and posts `apply` / `reset` messages back to the
extension host. "Reset" restores the theme the user had before ThemePaint first
changed it (remembered in `globalState`).

## Adding a theme

1. Add a `<name>.json` color-theme file to `themes/`.
2. Add an entry to `contributes.themes` in `package.json` (label, uiTheme, path).

The starter palettes were generated from a small template; see the git history if you
want to regenerate them.

## Note on earlier versions

Versions before 0.1.0 worked by writing `workbench.colorCustomizations` for a live
"theme creator" UI. That approach layered colors on top of the active theme and could
leave customizations in the user's settings. The current version drops that entirely
in favor of native theme contributions.
