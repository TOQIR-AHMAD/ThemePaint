// Theme generator for ThemePaint.
//
// Each theme is defined as a compact palette and expanded into a full VS Code
// color theme (UI chrome + a varied, readable syntax palette with a distinct
// color per token type). This keeps 100 themes consistent and easy to tweak —
// edit a palette here and re-run `npm run themes`.
//
// Palette tuple (positional):
//   [ name, type, bg, fg, accent, comment, kw, str, fn, num, ty, var, op, prop ]
//
// 20 categories × 5 themes = 100 themes. Theme labels are "Category: Name"; the
// sidebar derives the group from the prefix and strips it for display.

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const THEMES_DIR = path.join(ROOT, "themes");

// ---------------------------------------------------------------------------
// Palettes
// ---------------------------------------------------------------------------

const N = (name, type, bg, fg, accent, comment, kw, str, fn, num, ty, vr, op, prop) => ({
  name, type, bg, fg, accent, comment, kw, str, fn, num, ty, var: vr, op, prop,
});

// prettier-ignore
const CATEGORIES = {
  Dark: [
    N("Andromeda", "dark", "#23262e", "#d5ced9", "#00e8c6", "#6c6783", "#c74ded", "#96e072", "#ffe66d", "#f39c12", "#7cb7ff", "#d5ced9", "#00e8c6", "#ee5d43"),
    N("Onyx One", "dark", "#1e1e1e", "#abb2bf", "#61afef", "#5c6370", "#c678dd", "#98c379", "#61afef", "#d19a66", "#e5c07b", "#e06c75", "#56b6c2", "#e06c75"),
    N("Carbon", "dark", "#161616", "#dde1e6", "#78a9ff", "#6f6f6f", "#ff7eb6", "#42be65", "#82cfff", "#3ddbd9", "#ee5396", "#dde1e6", "#33b1ff", "#08bdba"),
    N("Obsidian", "dark", "#22282e", "#cdd3de", "#5db4d6", "#5e6b78", "#9d7cd8", "#7bc275", "#5db4d6", "#e6a45e", "#e0b15c", "#cdd3de", "#67c5c5", "#df6f6f"),
    N("Eclipse", "dark", "#1a1c23", "#c5c8d6", "#a78bfa", "#5a5f73", "#f06595", "#74c7a8", "#7aa2f7", "#f59e0b", "#22d3ee", "#c5c8d6", "#a78bfa", "#fb7185"),
  ],
  Light: [
    N("Clean", "light", "#fafafa", "#383a42", "#4078f2", "#a0a1a7", "#a626a4", "#50a14f", "#4078f2", "#986801", "#c18401", "#383a42", "#0184bc", "#e45649"),
    N("Paper", "light", "#f5f2eb", "#3b3b3b", "#d2691e", "#a39e93", "#a3324a", "#618a3f", "#b5651d", "#9a6700", "#8a6d1f", "#3b3b3b", "#1f8a8a", "#b5651d"),
    N("Daylight", "light", "#ffffff", "#2e3440", "#2563eb", "#9aa0ab", "#7c3aed", "#16a34a", "#2563eb", "#c2410c", "#b45309", "#2e3440", "#0891b2", "#dc2626"),
    N("Linen", "light", "#faf4ed", "#575279", "#907aa9", "#9893a5", "#286983", "#56949f", "#d7827e", "#ea9d34", "#907aa9", "#575279", "#286983", "#b4637a"),
    N("Porcelain", "light", "#f6f8fa", "#24292f", "#0969da", "#6e7781", "#cf222e", "#0a3069", "#8250df", "#0550ae", "#953800", "#24292f", "#0969da", "#116329"),
  ],
  Ocean: [
    N("Deep Sea", "dark", "#0f111a", "#8f93a2", "#84ffff", "#464b5d", "#c792ea", "#c3e88d", "#82aaff", "#f78c6c", "#ffcb6b", "#8f93a2", "#89ddff", "#f07178"),
    N("Tidewater", "dark", "#13242b", "#cbe3e7", "#5fb3b3", "#5a7a82", "#6699cc", "#99c794", "#5fb3b3", "#f99157", "#fac863", "#cbe3e7", "#5fb3b3", "#ec5f67"),
    N("Abyss", "dark", "#0b1a2b", "#a7c0d0", "#3aa6ff", "#41576b", "#56b6ff", "#5fd3a2", "#74c0ff", "#f0a35e", "#5ad1d1", "#a7c0d0", "#3aa6ff", "#ff7a93"),
    N("Lagoon", "dark", "#0d2b2b", "#b6e0d8", "#2ee6c8", "#4f7a74", "#4dd0e1", "#7be0a0", "#2ee6c8", "#ffb74d", "#9ad8ff", "#b6e0d8", "#2ee6c8", "#ff8a80"),
    N("Marine", "dark", "#0a1929", "#aab8c5", "#29b6f6", "#4a6378", "#90caf9", "#80cbc4", "#29b6f6", "#ffab70", "#f6c177", "#aab8c5", "#4dd0e1", "#f48fb1"),
  ],
  Forest: [
    N("Everforest", "dark", "#2b3339", "#d3c6aa", "#a7c080", "#859289", "#e67e80", "#a7c080", "#83c092", "#d699b6", "#dbbc7f", "#d3c6aa", "#e69875", "#7fbbb3"),
    N("Pine", "dark", "#1a2b22", "#c9d6c0", "#6abf69", "#5f7a64", "#8fbf5f", "#a3d977", "#6abf69", "#e0a458", "#bfd97f", "#c9d6c0", "#79c2a3", "#e0876f"),
    N("Moss", "dark", "#21281f", "#cdd6c0", "#9bbf65", "#6a7560", "#c5d86d", "#a3c585", "#9bbf65", "#e0b15c", "#7fb685", "#cdd6c0", "#8cc084", "#d97e6a"),
    N("Fern", "dark", "#16211a", "#c2d4c4", "#52b788", "#5b7062", "#74c69d", "#95d5b2", "#52b788", "#d9a05b", "#a7d9b0", "#c2d4c4", "#40916c", "#e08e6d"),
    N("Woodland", "dark", "#23291f", "#d6d3bf", "#b5c46b", "#6f7256", "#d4b16a", "#a9b665", "#b5c46b", "#e08e5a", "#d8a657", "#d6d3bf", "#89b482", "#ea6962"),
  ],
  Pastel: [
    N("Catppuccin", "dark", "#1e1e2e", "#cdd6f4", "#cba6f7", "#6c7086", "#cba6f7", "#a6e3a1", "#89b4fa", "#fab387", "#f9e2af", "#cdd6f4", "#89dceb", "#f38ba8"),
    N("Rosé", "dark", "#191724", "#e0def4", "#c4a7e7", "#6e6a86", "#31748f", "#9ccfd8", "#ebbcba", "#f6c177", "#c4a7e7", "#e0def4", "#31748f", "#eb6f92"),
    N("Cotton", "dark", "#2a2438", "#dcd7f0", "#b8a4e3", "#766c93", "#c4a0f0", "#a0e3c4", "#9ec1f0", "#f0c8a0", "#f0e0a0", "#dcd7f0", "#a0d8f0", "#f0a0c4"),
    N("Sorbet", "dark", "#2e2733", "#ece3ef", "#f5a9c4", "#857a8c", "#d8a0f0", "#a8e6cf", "#a0c4f0", "#ffd3a5", "#fbe4a0", "#ece3ef", "#a0e0e0", "#ffaaa5"),
    N("Macaron", "dark", "#2b2733", "#e8e3ef", "#a5d8f0", "#7d7589", "#caa0e8", "#b5e6c0", "#a0c8e8", "#f5cba0", "#f0dca0", "#e8e3ef", "#a0dce0", "#f0a8c0"),
  ],
  Neon: [
    N("Neon City", "dark", "#0d0221", "#f6f6ff", "#0affef", "#5b5b7a", "#ff2e97", "#0aff9d", "#0affef", "#ffe600", "#b388ff", "#f6f6ff", "#ff2e97", "#ff5e5e"),
    N("Cyberpunk", "dark", "#0a0a14", "#e6e6fa", "#fcee0a", "#555570", "#ff003c", "#00ff9f", "#00b8ff", "#fcee0a", "#d100ff", "#e6e6fa", "#ff003c", "#ff6ec7"),
    N("Vaporwave", "dark", "#1a0b2e", "#f5e6ff", "#ff71ce", "#6a5a8a", "#ff71ce", "#05ffa1", "#01cdfe", "#fffb96", "#b967ff", "#f5e6ff", "#ff71ce", "#ff9ce3"),
    N("Laser", "dark", "#05060a", "#e8faff", "#19f6ff", "#4a5560", "#ff2079", "#19f6ff", "#7afcff", "#f8f33c", "#a17fff", "#e8faff", "#ff2079", "#ff5470"),
    N("Electric", "dark", "#0b0f17", "#e6f0ff", "#00f0ff", "#4d5a6b", "#ff476f", "#3ddc97", "#36c5f0", "#ffd23f", "#9d7cff", "#e6f0ff", "#00f0ff", "#ff6b9d"),
  ],
  Synthwave: [
    N("Synthwave", "dark", "#262335", "#ffffff", "#ff7edb", "#848bbd", "#fede5d", "#ff8b39", "#36f9f6", "#f97e72", "#fe4450", "#ffffff", "#ff7edb", "#72f1b8"),
    N("Outrun", "dark", "#1b132a", "#f5e9ff", "#ff6ac1", "#7a6e99", "#ffcc55", "#ff9966", "#39c4ff", "#ff6ac1", "#ff4d6d", "#f5e9ff", "#ff6ac1", "#5cf2c8"),
    N("Miami", "dark", "#1a1a2e", "#f0eeff", "#ff3caf", "#6f6f9c", "#26d9ff", "#ffd166", "#ff61d8", "#ff8c42", "#7af5ff", "#f0eeff", "#ff3caf", "#9b5de5"),
    N("Retrowave", "dark", "#20133a", "#f3e9ff", "#e84cf0", "#7c6f9e", "#ffb84c", "#ff7b54", "#4cc9f0", "#f15bb5", "#ff5d8f", "#f3e9ff", "#e84cf0", "#8ac926"),
    N("Sunset Drive", "dark", "#2a1b3d", "#ffe9f0", "#ff5e7e", "#8a6f8a", "#ffa94d", "#ffd56b", "#ff5e7e", "#ff8e6b", "#c77dff", "#ffe9f0", "#ff5e7e", "#7bdff2"),
  ],
  Material: [
    N("Ocean", "dark", "#0f111a", "#a6accd", "#82aaff", "#464b5d", "#c792ea", "#c3e88d", "#82aaff", "#f78c6c", "#ffcb6b", "#a6accd", "#89ddff", "#f07178"),
    N("Palenight", "dark", "#292d3e", "#a6accd", "#c792ea", "#676e95", "#c792ea", "#c3e88d", "#82aaff", "#f78c6c", "#ffcb6b", "#a6accd", "#89ddff", "#f07178"),
    N("Darker", "dark", "#212121", "#eeffff", "#89ddff", "#545454", "#c792ea", "#c3e88d", "#82aaff", "#f78c6c", "#ffcb6b", "#eeffff", "#89ddff", "#f07178"),
    N("Deep Ocean", "dark", "#0b0e14", "#8f93a2", "#84ffff", "#4b526d", "#c792ea", "#c3e88d", "#82aaff", "#f78c6c", "#ffcb6b", "#8f93a2", "#89ddff", "#f07178"),
    N("Lighter", "light", "#fafafa", "#90a4ae", "#39adb5", "#b0bec5", "#7c4dff", "#91b859", "#6182b8", "#f76d47", "#f6a434", "#90a4ae", "#39adb5", "#e53935"),
  ],
  Cybersecurity: [
    N("Matrix", "dark", "#000000", "#00ff41", "#00ff41", "#0a6b2a", "#39ff14", "#7cfc00", "#00e676", "#76ff03", "#b9f6ca", "#00ff41", "#69f0ae", "#00c853"),
    N("Red Team", "dark", "#0d0000", "#ff6b6b", "#ff1e1e", "#7a2a2a", "#ff1e1e", "#ff8e8e", "#ff5252", "#ffab40", "#ff7961", "#ff6b6b", "#ff5252", "#ffcdd2"),
    N("Blue Team", "dark", "#001018", "#7fdfff", "#00b4ff", "#2a5a6a", "#00b4ff", "#5cffd6", "#40c4ff", "#69f0ff", "#80d8ff", "#7fdfff", "#18ffff", "#b3e5fc"),
    N("Amber CRT", "dark", "#1a0f00", "#ffb000", "#ffb000", "#7a5a1a", "#ffcc33", "#ffd966", "#ffaa00", "#ff8800", "#ffdd99", "#ffb000", "#ffcc33", "#ffe0b3"),
    N("Hacker", "dark", "#020a02", "#9effa0", "#33ff66", "#3a6a3a", "#33ff66", "#aaffaa", "#66ff99", "#ccff66", "#88ffbb", "#9effa0", "#66ff99", "#ccffcc"),
  ],
  Cosmic: [
    N("Nebula", "dark", "#0d0b1f", "#d6d0f0", "#bd93f9", "#5b577a", "#bd93f9", "#a0e8c0", "#8be9fd", "#ffb86c", "#f1fa8c", "#d6d0f0", "#ff79c6", "#ff79c6"),
    N("Galaxy", "dark", "#0b0d21", "#cfd3ff", "#7b8cff", "#4f5680", "#9d7cff", "#7af5c0", "#6ec3ff", "#ffc46b", "#ffe07a", "#cfd3ff", "#7b8cff", "#ff7ab2"),
    N("Aurora", "dark", "#0a1722", "#cfe8e0", "#88c0d0", "#4c6a72", "#b48ead", "#a3be8c", "#88c0d0", "#d08770", "#ebcb8b", "#cfe8e0", "#81a1c1", "#bf616a"),
    N("Cosmos", "dark", "#100c28", "#ddd6ff", "#a78bfa", "#5a5380", "#c4b5fd", "#86efac", "#7dd3fc", "#fdba74", "#fde68a", "#ddd6ff", "#a78bfa", "#f9a8d4"),
    N("Stardust", "dark", "#161229", "#e0dcf5", "#9f86ff", "#615a85", "#c0a0ff", "#9fe8c0", "#80c8ff", "#ffcb8a", "#ffe39a", "#e0dcf5", "#9f86ff", "#ff96c0"),
  ],
  Coffee: [
    N("Espresso", "dark", "#231a16", "#e6d8c8", "#c8956c", "#7a6755", "#d98e73", "#a8b56c", "#e0b35c", "#cc8b5c", "#d6a35c", "#e6d8c8", "#c8956c", "#cf7e5c"),
    N("Mocha", "dark", "#2a211b", "#e8dccb", "#d0a06a", "#82705c", "#e0996b", "#b3c47a", "#e6bd72", "#d99c6a", "#e0b878", "#e8dccb", "#d0a06a", "#dd8a6a"),
    N("Latte", "light", "#f4ece2", "#4a3f35", "#a9744f", "#a3927d", "#a3523f", "#6f7d3f", "#9a6a3f", "#9a6a3f", "#8a6a2f", "#4a3f35", "#7a5a3a", "#b5651d"),
    N("Cappuccino", "dark", "#2e2620", "#ede1d1", "#dcae7c", "#897a66", "#e0a878", "#bcc77f", "#ecc47e", "#dfa46f", "#e6c084", "#ede1d1", "#dcae7c", "#e3936f"),
    N("Cacao", "dark", "#1c1411", "#ddccb8", "#b07a4f", "#6e5c4a", "#cc8a5e", "#9aa85e", "#d4a45c", "#c08552", "#caa05c", "#ddccb8", "#b07a4f", "#c56a4a"),
  ],
  Sunset: [
    N("Dawn", "dark", "#1f1a2c", "#f0e6e0", "#ff9e64", "#6a5f70", "#ff79c6", "#ffd479", "#ff9e64", "#ff6b6b", "#ffb86c", "#f0e6e0", "#ff79c6", "#ff7eb6"),
    N("Dusk", "dark", "#211c2b", "#ece3e8", "#ff6f91", "#6e6478", "#c77dff", "#ffc56b", "#ff6f91", "#ff9e64", "#ffa45c", "#ece3e8", "#ff6f91", "#ff8fab"),
    N("Ember", "dark", "#1a1310", "#f0dcc8", "#ff7043", "#6f5e4f", "#ff5252", "#ffb74d", "#ff7043", "#ffa726", "#ffcc80", "#f0dcc8", "#ff7043", "#ff8a65"),
    N("Sunrise", "dark", "#2a1e1e", "#ffe8d6", "#ffb454", "#7d6a5f", "#ff8f6b", "#ffd479", "#ffb454", "#ff7a59", "#ffc98a", "#ffe8d6", "#ffb454", "#ff9e7a"),
    N("Twilight", "dark", "#1b1726", "#e8dff0", "#c77dff", "#675f7a", "#ff7eb6", "#ffd166", "#9d7cff", "#ff8c69", "#c77dff", "#e8dff0", "#ff7eb6", "#ffa4d8"),
  ],
  Frost: [
    N("Arctic", "dark", "#1c2230", "#d8e0ec", "#88c0ff", "#5a667a", "#81a1c1", "#8fbcbb", "#88c0ff", "#d08770", "#ebcb8b", "#d8e0ec", "#88c0d0", "#b48ead"),
    N("Glacier", "dark", "#16202b", "#cfe0ea", "#5fc9e8", "#516576", "#6cb6e8", "#82d6c8", "#5fc9e8", "#e8a87c", "#e8cf8a", "#cfe0ea", "#7fd4e8", "#e88a9c"),
    N("Nord", "dark", "#2e3440", "#d8dee9", "#88c0d0", "#616e88", "#81a1c1", "#a3be8c", "#88c0d0", "#b48ead", "#8fbcbb", "#d8dee9", "#81a1c1", "#ebcb8b"),
    N("Snow", "light", "#eef2f7", "#3b4252", "#5e81ac", "#9aa5b5", "#5e81ac", "#4a8a6f", "#5e81ac", "#b06a3a", "#a07a3a", "#3b4252", "#3a8a9a", "#a8475a"),
    N("Frostbite", "dark", "#0e1620", "#c4d8e4", "#3ab7e8", "#46586a", "#5cc8ff", "#7fe0d4", "#3ab7e8", "#ffb37a", "#ffd98a", "#c4d8e4", "#5fd6ff", "#ff8aa0"),
  ],
  Gruvbox: [
    N("Gruvbox Dark", "dark", "#282828", "#ebdbb2", "#fabd2f", "#928374", "#fb4934", "#b8bb26", "#b8bb26", "#d3869b", "#fabd2f", "#ebdbb2", "#8ec07c", "#83a598"),
    N("Gruvbox Light", "light", "#fbf1c7", "#3c3836", "#b57614", "#928374", "#9d0006", "#79740e", "#79740e", "#8f3f71", "#b57614", "#3c3836", "#427b58", "#076678"),
    N("Retro", "dark", "#2b2420", "#e8d8b8", "#e0a458", "#8a7a5c", "#e07a5f", "#a3a35c", "#d4a55c", "#cf8a5c", "#e0b15c", "#e8d8b8", "#88a05c", "#7fa0a0"),
    N("Vintage", "dark", "#26211a", "#ddd0b0", "#cba65f", "#857650", "#c96f4e", "#9aa05a", "#c9a45c", "#b07a4a", "#c9a05c", "#ddd0b0", "#7f9a78", "#9a8a5a"),
    N("Sepia", "light", "#f0e6d2", "#433829", "#a86b2f", "#9a8a6a", "#9a4a2f", "#6a7a3a", "#8a5a2f", "#8a5a2f", "#a86b2f", "#433829", "#5a7a5a", "#7a6a3a"),
  ],
  Monochrome: [
    N("Mono Dark", "dark", "#1a1a1a", "#d0d0d0", "#ffffff", "#6a6a6a", "#e8e8e8", "#b0b0b0", "#f4f4f4", "#c8c8c8", "#dcdcdc", "#d0d0d0", "#a8a8a8", "#bcbcbc"),
    N("Mono Light", "light", "#f4f4f4", "#2a2a2a", "#000000", "#9a9a9a", "#101010", "#5a5a5a", "#0a0a0a", "#3a3a3a", "#222222", "#2a2a2a", "#6a6a6a", "#4a4a4a"),
    N("Slate", "dark", "#1e242b", "#c0c8d0", "#7e9cbb", "#5e6a76", "#9db4cc", "#a8b8c4", "#bcccda", "#8aa0b4", "#cdd8e0", "#c0c8d0", "#7e9cbb", "#94a8b8"),
    N("Graphite", "dark", "#202020", "#cfcfcf", "#9ab0c0", "#6c6c6c", "#c8c8c8", "#a6a6a6", "#e6e6e6", "#bcbcbc", "#dcdcdc", "#cfcfcf", "#9ab0c0", "#b0b0b0"),
    N("Ash", "dark", "#26282b", "#cdd0d4", "#a7b0bb", "#6a6e74", "#c4cad0", "#aab2ba", "#dbe0e6", "#b6bcc4", "#d2d8de", "#cdd0d4", "#a7b0bb", "#b8bec6"),
  ],
  Vibrant: [
    N("Candy", "dark", "#1e1e2e", "#f5e0ff", "#ff5ec7", "#6c6a80", "#ff5ec7", "#5effa0", "#5ec7ff", "#ffd95e", "#c45eff", "#f5e0ff", "#5effe0", "#ff7a5e"),
    N("Tropical", "dark", "#102a2a", "#e6fff5", "#00e5b0", "#4a7a72", "#ff6f61", "#ffd166", "#00e5b0", "#ffa600", "#06d6a0", "#e6fff5", "#4dd0e1", "#ef476f"),
    N("Fiesta", "dark", "#241a2e", "#fff0e6", "#ff4d6d", "#7a6a78", "#ffba08", "#06d6a0", "#ff4d6d", "#ff7a00", "#9b5de5", "#fff0e6", "#00bbf9", "#f15bb5"),
    N("Prism", "dark", "#16182a", "#eef0ff", "#6c8cff", "#5a5e7a", "#ff6ec7", "#3ddc97", "#6c8cff", "#ffd166", "#c77dff", "#eef0ff", "#36c5f0", "#ff8c69"),
    N("Rainbow", "dark", "#1c1c28", "#f0f0fa", "#ff5d8f", "#6a6a7e", "#ff5d8f", "#5dd39e", "#5d8fff", "#ffd25d", "#b15dff", "#f0f0fa", "#5dd3d3", "#ff8f5d"),
  ],
  Midnight: [
    N("Midnight", "dark", "#0a0e14", "#b3b1ad", "#39bae6", "#4d5566", "#ff8f40", "#c2d94c", "#39bae6", "#e6b450", "#59c2ff", "#b3b1ad", "#f29668", "#95e6cb"),
    N("Deep Space", "dark", "#05070d", "#aeb6c2", "#5aa0ff", "#3f4a5a", "#7c9cff", "#7fd6a0", "#5aa0ff", "#ffb870", "#6cc6ff", "#aeb6c2", "#5aa0ff", "#ff7a9c"),
    N("Black Hole", "dark", "#000000", "#cccccc", "#bb86fc", "#5a5a5a", "#bb86fc", "#03dac6", "#82aaff", "#ffb86c", "#03dac6", "#cccccc", "#cf6679", "#cf6679"),
    N("Void", "dark", "#070710", "#c8c4e0", "#8a7dff", "#46426a", "#a78bfa", "#7fe0c0", "#7aa2f7", "#ffb86c", "#9d7cff", "#c8c4e0", "#8a7dff", "#ff7ab2"),
    N("Ink", "dark", "#0c0c0f", "#c0c0c8", "#6c8cff", "#4a4a55", "#9aa5ff", "#9ad6a0", "#6c8cff", "#e6c07a", "#7fc0ff", "#c0c0c8", "#6c8cff", "#e68aa0"),
  ],
  GitHub: [
    N("GitHub Dark", "dark", "#0d1117", "#c9d1d9", "#58a6ff", "#8b949e", "#ff7b72", "#a5d6ff", "#d2a8ff", "#79c0ff", "#7ee787", "#c9d1d9", "#79c0ff", "#ffa657"),
    N("GitHub Light", "light", "#ffffff", "#24292f", "#0969da", "#6e7781", "#cf222e", "#0a3069", "#8250df", "#0550ae", "#116329", "#24292f", "#0969da", "#953800"),
    N("GitHub Dimmed", "dark", "#22272e", "#adbac7", "#539bf5", "#768390", "#f47067", "#96d0ff", "#dcbdfb", "#6cb6ff", "#8ddb8c", "#adbac7", "#6cb6ff", "#f69d50"),
    N("GitHub Dark HC", "dark", "#0a0c10", "#f0f3f6", "#71b7ff", "#9ea7b3", "#ff9492", "#addcff", "#dbb7ff", "#91cbff", "#72f088", "#f0f3f6", "#91cbff", "#ffb757"),
    N("GitHub Colorblind", "dark", "#0d1117", "#c9d1d9", "#58a6ff", "#8b949e", "#ec8e2c", "#a5d6ff", "#d2a8ff", "#79c0ff", "#6cb6ff", "#c9d1d9", "#79c0ff", "#fdac54"),
  ],
  Solarized: [
    N("Solarized Dark", "dark", "#002b36", "#839496", "#268bd2", "#586e75", "#859900", "#2aa198", "#268bd2", "#d33682", "#b58900", "#839496", "#cb4b16", "#6c71c4"),
    N("Solarized Light", "light", "#fdf6e3", "#657b83", "#268bd2", "#93a1a1", "#859900", "#2aa198", "#268bd2", "#d33682", "#b58900", "#657b83", "#cb4b16", "#6c71c4"),
    N("Muted", "dark", "#222b30", "#a7adba", "#6a9fb5", "#5a6671", "#ba8baf", "#90a959", "#6a9fb5", "#d28445", "#f4bf75", "#a7adba", "#75b5aa", "#ac4142"),
    N("Sage", "dark", "#232a25", "#c2cabb", "#88a17a", "#677066", "#a3b18a", "#b5c99a", "#88a17a", "#d8a25e", "#cdb380", "#c2cabb", "#7a9b8e", "#c08a6a"),
    N("Sand", "light", "#efe9da", "#5a544a", "#a08a5e", "#9a917f", "#9a6a4a", "#7a8a4a", "#a08a5e", "#a06a3a", "#8a7a3a", "#5a544a", "#6a8a7a", "#9a5a4a"),
  ],
  Tokyo: [
    N("Tokyo Night", "dark", "#1a1b26", "#a9b1d6", "#7aa2f7", "#565f89", "#bb9af7", "#9ece6a", "#7aa2f7", "#ff9e64", "#2ac3de", "#c0caf5", "#89ddff", "#73daca"),
    N("Tokyo Storm", "dark", "#24283b", "#a9b1d6", "#7aa2f7", "#565f89", "#bb9af7", "#9ece6a", "#7aa2f7", "#ff9e64", "#2ac3de", "#c0caf5", "#89ddff", "#73daca"),
    N("Tokyo Day", "light", "#e1e2e7", "#3760bf", "#2e7de9", "#848cb5", "#9854f1", "#587539", "#2e7de9", "#b15c00", "#007197", "#3760bf", "#006a83", "#7847bd"),
    N("Tokyo Moon", "dark", "#222436", "#c8d3f5", "#82aaff", "#636da6", "#c099ff", "#c3e88d", "#82aaff", "#ff966c", "#86e1fc", "#c8d3f5", "#89ddff", "#65bcff"),
    N("Kanagawa", "dark", "#1f1f28", "#dcd7ba", "#7e9cd8", "#727169", "#957fb8", "#98bb6c", "#7e9cd8", "#d27e99", "#7aa89f", "#dcd7ba", "#c0a36e", "#e6c384"),
  ],
};

// Order the groups appear in the sidebar / native picker.
const GROUP_ORDER = Object.keys(CATEGORIES);

// ---------------------------------------------------------------------------
// Color helpers
// ---------------------------------------------------------------------------

const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
const hx = (n) => clamp(n).toString(16).padStart(2, "0");
const parse = (h) => {
  const s = h.replace("#", "");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
};
const rgb = (r, g, b) => `#${hx(r)}${hx(g)}${hx(b)}`;

/** Shift a color toward white (p>0) or black (p<0); p in [-1, 1]. */
function shade(hex, p) {
  const [r, g, b] = parse(hex);
  if (p >= 0) return rgb(r + (255 - r) * p, g + (255 - g) * p, b + (255 - b) * p);
  const q = 1 + p;
  return rgb(r * q, g * q, b * q);
}

/** Linear blend from a to b by t in [0, 1]. */
function mix(a, b, t) {
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  return rgb(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}

/** Append an alpha byte to a #rrggbb color. a in [0, 1]. */
const alpha = (hex, a) => hex + clamp(a * 255).toString(16).padStart(2, "0");

// ---------------------------------------------------------------------------
// Theme builder
// ---------------------------------------------------------------------------

function buildColors(p) {
  const dark = p.type !== "light";
  const bg = p.bg;
  const chrome = shade(bg, dark ? -0.28 : -0.05); // activity / status / title bar
  const side = shade(bg, dark ? -0.14 : -0.025);
  const tabsBg = shade(bg, dark ? -0.1 : -0.02);
  const line = shade(bg, dark ? 0.06 : -0.035); // current line highlight
  const sel = alpha(p.accent, dark ? 0.26 : 0.22);
  const dim = mix(p.fg, bg, 0.55); // line numbers, inactive foreground
  const onAccent = pickReadable(p.accent);

  return {
    "editor.background": bg,
    "editor.foreground": p.fg,
    "editorLineNumber.foreground": dim,
    "editorLineNumber.activeForeground": p.accent,
    "editor.selectionBackground": sel,
    "editor.lineHighlightBackground": line,
    "editorCursor.foreground": p.accent,
    "editor.findMatchBackground": alpha(p.accent, 0.4),
    "editor.findMatchHighlightBackground": alpha(p.accent, 0.22),
    "editorWhitespace.foreground": alpha(p.fg, 0.1),
    "editorIndentGuide.background1": alpha(p.fg, 0.08),
    "editorIndentGuide.activeBackground1": alpha(p.fg, 0.22),
    "editorBracketMatch.border": p.accent,
    "activityBar.background": chrome,
    "activityBar.foreground": p.accent,
    "activityBar.inactiveForeground": dim,
    "activityBarBadge.background": p.accent,
    "activityBarBadge.foreground": onAccent,
    "sideBar.background": side,
    "sideBar.foreground": p.fg,
    "sideBarTitle.foreground": p.accent,
    "sideBarSectionHeader.background": bg,
    "statusBar.background": chrome,
    "statusBar.foreground": p.fg,
    "statusBar.noFolderBackground": chrome,
    "titleBar.activeBackground": chrome,
    "titleBar.activeForeground": p.fg,
    "titleBar.inactiveBackground": chrome,
    "titleBar.inactiveForeground": dim,
    "editorGroupHeader.tabsBackground": tabsBg,
    "tab.activeBackground": bg,
    "tab.activeForeground": p.accent,
    "tab.inactiveBackground": tabsBg,
    "tab.inactiveForeground": dim,
    "tab.activeBorderTop": p.accent,
    "tab.border": shade(bg, dark ? -0.1 : -0.03),
    "panel.background": side,
    "panelTitle.activeForeground": p.accent,
    "terminal.background": bg,
    "terminal.foreground": p.fg,
    "button.background": p.accent,
    "button.foreground": onAccent,
    "button.hoverBackground": shade(p.accent, dark ? 0.12 : -0.1),
    "input.background": chrome,
    "input.foreground": p.fg,
    "input.placeholderForeground": dim,
    "dropdown.background": chrome,
    "focusBorder": p.accent,
    "list.activeSelectionBackground": sel,
    "list.activeSelectionForeground": p.fg,
    "list.hoverBackground": line,
    "list.inactiveSelectionBackground": alpha(p.accent, 0.14),
    "badge.background": p.accent,
    "badge.foreground": onAccent,
    "scrollbarSlider.background": alpha(p.fg, 0.16),
    "scrollbarSlider.hoverBackground": alpha(p.fg, 0.26),
    "scrollbarSlider.activeBackground": alpha(p.fg, 0.36),
    "editorWidget.background": chrome,
    "editorSuggestWidget.selectedBackground": sel,
    "selection.background": alpha(p.accent, 0.3),
  };
}

/** Choose black or white text for a given background, by luminance. */
function pickReadable(hex) {
  const [r, g, b] = parse(hex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#1a1a1a" : "#ffffff";
}

function buildTokens(p) {
  return [
    { scope: "comment", settings: { foreground: p.comment, fontStyle: "italic" } },
    { scope: ["string", "string.quoted", "string.template"], settings: { foreground: p.str } },
    { scope: ["constant.numeric", "constant.language", "constant.character"], settings: { foreground: p.num } },
    { scope: ["keyword", "keyword.control", "storage", "storage.type", "storage.modifier"], settings: { foreground: p.kw } },
    { scope: ["entity.name.function", "support.function", "meta.function-call.generic"], settings: { foreground: p.fn } },
    { scope: ["variable", "meta.definition.variable.name", "variable.other.readwrite"], settings: { foreground: p.var } },
    { scope: ["variable.parameter", "parameter"], settings: { foreground: mix(p.var, p.bg, 0.18) } },
    { scope: ["entity.name.type", "support.type", "support.class", "entity.name.namespace"], settings: { foreground: p.ty } },
    { scope: ["variable.other.property", "variable.other.object.property", "support.variable.property", "meta.object-literal.key"], settings: { foreground: p.prop } },
    { scope: "keyword.operator", settings: { foreground: p.op } },
    { scope: ["entity.name.tag", "punctuation.definition.tag"], settings: { foreground: p.kw } },
    { scope: ["entity.other.attribute-name"], settings: { foreground: p.fn } },
    { scope: ["constant.other.color", "support.constant"], settings: { foreground: p.num } },
    { scope: "entity.name.type.class", settings: { foreground: p.ty, fontStyle: "bold" } },
    { scope: ["markup.bold"], settings: { fontStyle: "bold" } },
    { scope: ["markup.italic"], settings: { fontStyle: "italic" } },
    { scope: ["markup.heading"], settings: { foreground: p.accent, fontStyle: "bold" } },
    { scope: ["invalid"], settings: { foreground: p.bg, background: p.kw } },
  ];
}

function buildTheme(p) {
  return {
    name: p.name,
    type: p.type === "light" ? "light" : "dark",
    semanticHighlighting: true,
    colors: buildColors(p),
    tokenColors: buildTokens(p),
    semanticTokenColors: {
      function: p.fn,
      method: p.fn,
      class: p.ty,
      property: p.prop,
      parameter: mix(p.var, p.bg, 0.18),
      variable: p.var,
    },
  };
}

// ---------------------------------------------------------------------------
// Generate
// ---------------------------------------------------------------------------

const slug = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function main() {
  // Start from a clean themes directory so removed palettes don't linger.
  if (fs.existsSync(THEMES_DIR)) {
    for (const f of fs.readdirSync(THEMES_DIR)) {
      if (f.endsWith(".json")) fs.unlinkSync(path.join(THEMES_DIR, f));
    }
  } else {
    fs.mkdirSync(THEMES_DIR, { recursive: true });
  }

  const contributions = [];
  let count = 0;

  for (const group of GROUP_ORDER) {
    for (const p of CATEGORIES[group]) {
      const label = `${group}: ${p.name}`;
      const file = `${slug(group)}-${slug(p.name)}.json`;
      const theme = buildTheme({ ...p, name: label });
      fs.writeFileSync(path.join(THEMES_DIR, file), JSON.stringify(theme, null, 2) + "\n");
      contributions.push({
        label,
        uiTheme: p.type === "light" ? "vs" : "vs-dark",
        path: `./themes/${file}`,
      });
      count++;
    }
  }

  // Patch package.json: themes array + display description.
  const pkgPath = path.join(ROOT, "package.json");
  const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
  pkg.contributes.themes = contributions;
  pkg.description = `A pack of ${count} modern color themes in ${GROUP_ORDER.length} categories, with a one-click theme picker in the sidebar.`;
  fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + "\n");

  console.log(`Generated ${count} themes across ${GROUP_ORDER.length} categories.`);
}

main();
