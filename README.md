# ThemePaint

A pack of 35 handcrafted color themes with a one-click picker in the sidebar.

Click the ThemePaint icon in the Activity Bar, pick a theme, and it's applied. The
themes are normal VS Code color themes, so they show up in the regular theme picker
too (Preferences: Color Theme), and if you uninstall ThemePaint your editor goes
back to its default theme on its own — nothing is left behind.

The sidebar groups themes by category, shows a small color preview for each, and has
a search box.

## Themes

- **Dark** — Cobalt Forge, Onyx One, Vampire, Neon, Frost, Retro Amber, Deep Ocean,
  Tokyo Night, Palenight, Synthwave, Ayu Dark, Ayu Mirage, Material Ocean,
  Catppuccin Mocha, Rosé Pine, Everforest, Kanagawa, Horizon, Oceanic Next, Panda,
  Shades of Purple, GitHub Dark, Andromeda
- **Light** — Clean Light, Solar Day, Catppuccin Latte, GitHub Light,
  Material Lighter, Quiet Light
- **High contrast** — High Contrast Forge
- **Cybersecurity** — Matrix, Amber CRT, Red Team, Blue Team, Neon City

## Using it

- Click the **ThemePaint** icon in the Activity Bar (left edge) to open the picker.
- Click any theme to apply it. The current one is checked.
- **Reset to my previous theme** switches back to whatever theme you had before you
  first used ThemePaint.

You can also run **ThemePaint: Open Theme Picker** from the Command Palette.

## Development

```bash
npm install
npm run watch
```

Press F5 to launch the Extension Development Host. Theme files live in `themes/`
and are contributed in `package.json` under `contributes.themes`. The sidebar UI is
a small webview view (`src/viewProvider.ts` + `media/`).

## License

MIT
