// Preview generator for ThemePaint.
//
// Renders a set of representative themes as realistic VS Code window mockups
// (title bar + activity bar + sidebar + tabbed editor + status bar) and a wide
// hero banner. Output is standalone HTML in media/preview/*.html; a headless
// browser (see `npm run previews:shoot`) turns each into a PNG of the same name.
//
// The chrome colors are derived with the SAME math as scripts/generate-themes.js
// so the previews match the actual themes shipped by the extension.

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "media", "preview");

// ---------------------------------------------------------------------------
// Palettes (a hand-picked subset of the full 100 — the README highlights).
//   [ name, category, type, bg, fg, accent, comment, kw, str, fn, num, ty, var, op, prop ]
// ---------------------------------------------------------------------------

const P = (name, category, type, bg, fg, accent, comment, kw, str, fn, num, ty, vr, op, prop) => ({
  name, category, type, bg, fg, accent, comment, kw, str, fn, num, ty, var: vr, op, prop,
});

const HIGHLIGHTS = [
  P("Andromeda", "Dark", "dark", "#23262e", "#d5ced9", "#00e8c6", "#6c6783", "#c74ded", "#96e072", "#ffe66d", "#f39c12", "#7cb7ff", "#d5ced9", "#00e8c6", "#ee5d43"),
  P("Tokyo Night", "Tokyo", "dark", "#1a1b26", "#a9b1d6", "#7aa2f7", "#565f89", "#bb9af7", "#9ece6a", "#7aa2f7", "#ff9e64", "#2ac3de", "#c0caf5", "#89ddff", "#73daca"),
  P("Synthwave", "Synthwave", "dark", "#262335", "#ffffff", "#ff7edb", "#848bbd", "#fede5d", "#ff8b39", "#36f9f6", "#f97e72", "#fe4450", "#ffffff", "#ff7edb", "#72f1b8"),
  P("Catppuccin", "Pastel", "dark", "#1e1e2e", "#cdd6f4", "#cba6f7", "#6c7086", "#cba6f7", "#a6e3a1", "#89b4fa", "#fab387", "#f9e2af", "#cdd6f4", "#89dceb", "#f38ba8"),
  P("GitHub Dark", "GitHub", "dark", "#0d1117", "#c9d1d9", "#58a6ff", "#8b949e", "#ff7b72", "#a5d6ff", "#d2a8ff", "#79c0ff", "#7ee787", "#c9d1d9", "#79c0ff", "#ffa657"),
  P("Matrix", "Cybersecurity", "dark", "#000000", "#00ff41", "#00ff41", "#0a6b2a", "#39ff14", "#7cfc00", "#00e676", "#76ff03", "#b9f6ca", "#00ff41", "#69f0ae", "#00c853"),
];

// One accent per category, for the hero color strip (matches generate-themes.js).
const CATEGORY_ACCENTS = [
  ["Dark", "#00e8c6"], ["Light", "#4078f2"], ["Ocean", "#84ffff"], ["Forest", "#a7c080"],
  ["Pastel", "#cba6f7"], ["Neon", "#0affef"], ["Synthwave", "#ff7edb"], ["Material", "#82aaff"],
  ["Cybersecurity", "#00ff41"], ["Cosmic", "#bd93f9"], ["Coffee", "#c8956c"], ["Sunset", "#ff9e64"],
  ["Frost", "#88c0ff"], ["Gruvbox", "#fabd2f"], ["Monochrome", "#ffffff"], ["Vibrant", "#ff5ec7"],
  ["Midnight", "#39bae6"], ["GitHub", "#58a6ff"], ["Solarized", "#268bd2"], ["Tokyo", "#7aa2f7"],
];

// ---------------------------------------------------------------------------
// Color helpers (same as generate-themes.js)
// ---------------------------------------------------------------------------

const clamp = (n) => Math.max(0, Math.min(255, Math.round(n)));
const hx = (n) => clamp(n).toString(16).padStart(2, "0");
const parse = (h) => {
  const s = h.replace("#", "");
  return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)];
};
const rgb = (r, g, b) => `#${hx(r)}${hx(g)}${hx(b)}`;

function shade(hex, p) {
  const [r, g, b] = parse(hex);
  if (p >= 0) return rgb(r + (255 - r) * p, g + (255 - g) * p, b + (255 - b) * p);
  const q = 1 + p;
  return rgb(r * q, g * q, b * q);
}
function mix(a, b, t) {
  const [r1, g1, b1] = parse(a);
  const [r2, g2, b2] = parse(b);
  return rgb(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
}
const alpha = (hex, a) => hex + clamp(a * 255).toString(16).padStart(2, "0");
function pickReadable(hex) {
  const [r, g, b] = parse(hex);
  const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return lum > 0.6 ? "#1a1a1a" : "#ffffff";
}

// ---------------------------------------------------------------------------
// The code snippet, tokenised once as spans keyed by token class.
// ---------------------------------------------------------------------------

const CODE_LINES = [
  [["com", "// ThemePaint — 100 modern themes, one click away"]],
  [["kw", "import"], ["t", " { "], ["var", "workspace"], ["op", ", "], ["var", "window"], ["t", " } "], ["kw", "from"], ["t", " "], ["str", "\"vscode\""], ["op", ";"]],
  [],
  [["kw", "interface"], ["t", " "], ["ty", "ThemeOptions"], ["t", " {"]],
  [["t", "  "], ["prop", "category"], ["op", ":"], ["t", " "], ["ty", "string"], ["op", ";"]],
  [["t", "  "], ["prop", "contrast"], ["op", ":"], ["t", " "], ["ty", "number"], ["op", ";"]],
  [["t", "  "], ["prop", "italics"], ["op", ":"], ["t", " "], ["ty", "boolean"], ["op", ";"]],
  [["t", "}"]],
  [],
  [["kw", "export"], ["t", " "], ["kw", "function"], ["t", " "], ["fn", "applyTheme"], ["op", "("], ["param", "name"], ["op", ":"], ["t", " "], ["ty", "string"], ["op", ","], ["t", " "], ["param", "opts"], ["t", " = "], ["var", "defaults"], ["op", ") {"]],
  [["t", "  "], ["kw", "const"], ["t", " "], ["var", "config"], ["t", " = "], ["var", "workspace"], ["op", "."], ["fn", "getConfiguration"], ["op", "("], ["str", "\"workbench\""], ["op", ");"]],
  [["t", "  "], ["kw", "const"], ["t", " "], ["var", "previous"], ["t", " = "], ["var", "config"], ["op", "."], ["fn", "get"], ["op", "("], ["str", "\"colorTheme\""], ["op", ");"]],
  [],
  [["t", "  "], ["kw", "return"], ["t", " "], ["var", "config"], ["op", "."], ["fn", "update"], ["op", "("], ["str", "\"colorTheme\""], ["op", ", "], ["param", "name"], ["op", ", "], ["num", "true"], ["op", ")."], ["fn", "then"], ["op", "(() => {"]],
  [["t", "    "], ["var", "window"], ["op", "."], ["fn", "showInformationMessage"], ["op", "("], ["str", "`Applied ${"], ["param", "name"], ["str", "} ✨`"], ["op", ");"]],
  [["t", "    "], ["kw", "return"], ["t", " { "], ["prop", "name"], ["op", ","], ["t", " "], ["prop", "previous"], ["op", ","], ["t", " "], ["prop", "count"], ["op", ":"], ["t", " "], ["num", "100"], ["t", " };"]],
  [["t", "  "], ["op", "});"]],
  [["t", "}"]],
];

const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

function renderCode() {
  const rows = CODE_LINES.map((line, i) => {
    const num = String(i + 1).padStart(2, " ");
    const code = line.map(([cls, text]) => `<span class="${cls}">${esc(text)}</span>`).join("");
    const active = i === 9 ? " active" : "";
    return `<div class="row${active}"><span class="ln">${num}</span><span class="code">${code || "&nbsp;"}</span></div>`;
  });
  return rows.join("\n");
}

// Sidebar rows mimic the ThemePaint picker: category header + theme chips.
function renderSidebar(p) {
  const dot = (c) => `<span class="swatch" style="background:${c}"></span>`;
  const item = (label, sw, on) =>
    `<div class="side-item${on ? " on" : ""}">${sw.map(dot).join("")}<span class="side-label">${label}</span></div>`;
  return [
    `<div class="side-head">${esc(p.category.toUpperCase())}</div>`,
    item(p.name, [p.bg, p.accent, p.str, p.kw], true),
    item("Onyx One", ["#1e1e1e", "#61afef", "#98c379", "#c678dd"]),
    item("Carbon", ["#161616", "#78a9ff", "#42be65", "#ff7eb6"]),
    `<div class="side-head">OCEAN</div>`,
    item("Deep Sea", ["#0f111a", "#84ffff", "#c3e88d", "#c792ea"]),
    item("Lagoon", ["#0d2b2b", "#2ee6c8", "#7be0a0", "#4dd0e1"]),
    `<div class="side-head">SYNTHWAVE</div>`,
    item("Outrun", ["#1b132a", "#ff6ac1", "#ff9966", "#ffcc55"]),
  ].join("\n");
}

function themePage(p) {
  const dark = p.type !== "light";
  const bg = p.bg;
  const chrome = shade(bg, dark ? -0.28 : -0.05);
  const side = shade(bg, dark ? -0.14 : -0.025);
  const tabsBg = shade(bg, dark ? -0.1 : -0.02);
  const line = shade(bg, dark ? 0.06 : -0.035);
  const dim = mix(p.fg, bg, 0.55);
  const onAccent = pickReadable(p.accent);
  const param = mix(p.var, bg, 0.18);
  const border = shade(bg, dark ? -0.1 : -0.03);

  return `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { background:transparent; }
  .win {
    width:1000px; height:640px; border-radius:12px; overflow:hidden;
    font-family:'Cascadia Code','JetBrains Mono','SF Mono',Menlo,Consolas,monospace;
    box-shadow:0 24px 70px rgba(0,0,0,.5); display:flex; flex-direction:column;
    background:${bg};
  }
  .titlebar { height:34px; background:${chrome}; display:flex; align-items:center;
    padding:0 12px; color:${dim}; font-size:12px; gap:8px; flex:0 0 auto; }
  .dots { display:flex; gap:7px; margin-right:8px; }
  .dots i { width:11px; height:11px; border-radius:50%; display:block; }
  .title { color:${p.fg}; opacity:.8; }
  .body { flex:1; display:flex; min-height:0; }
  .activity { width:48px; background:${chrome}; display:flex; flex-direction:column;
    align-items:center; padding-top:12px; gap:18px; flex:0 0 auto; }
  .activity .ico { width:22px; height:22px; border-radius:5px; opacity:.5; background:${dim}; }
  .activity .ico.sel { opacity:1; background:${p.accent}; }
  .sidebar { width:232px; background:${side}; color:${p.fg}; padding:10px 0; flex:0 0 auto;
    font-size:12px; overflow:hidden; }
  .side-title { color:${p.accent}; font-size:11px; font-weight:700; letter-spacing:.12em;
    padding:0 14px 8px; text-transform:uppercase; }
  .side-head { color:${dim}; font-size:10px; font-weight:700; letter-spacing:.1em;
    padding:10px 14px 4px; }
  .side-item { display:flex; align-items:center; gap:8px; padding:5px 14px; }
  .side-item.on { background:${alpha(p.accent, 0.26)}; }
  .side-item.on .side-label { color:${p.accent}; }
  .swatch { width:11px; height:11px; border-radius:3px; flex:0 0 auto;
    box-shadow:0 0 0 1px rgba(255,255,255,.08) inset; }
  .side-label { color:${p.fg}; }
  .editor { flex:1; background:${bg}; display:flex; flex-direction:column; min-width:0; }
  .tabs { height:36px; background:${tabsBg}; display:flex; align-items:stretch; flex:0 0 auto; }
  .tab { display:flex; align-items:center; gap:8px; padding:0 16px; font-size:12px;
    color:${dim}; background:${tabsBg}; border-right:1px solid ${border}; }
  .tab.active { background:${bg}; color:${p.accent}; box-shadow:inset 0 2px 0 ${p.accent}; }
  .tab .fdot { width:8px; height:8px; border-radius:50%; background:${p.fn}; }
  .code-area { flex:1; padding:14px 0; overflow:hidden; }
  .row { display:flex; font-size:13.5px; line-height:21px; height:21px; white-space:pre; }
  .row.active { background:${line}; }
  .ln { width:44px; text-align:right; padding-right:16px; color:${dim}; user-select:none; flex:0 0 auto; }
  .code { color:${p.fg}; }
  .com { color:${p.comment}; font-style:italic; }
  .kw  { color:${p.kw}; }
  .str { color:${p.str}; }
  .fn  { color:${p.fn}; }
  .num { color:${p.num}; }
  .ty  { color:${p.ty}; }
  .var { color:${p.var}; }
  .op  { color:${p.op}; }
  .prop{ color:${p.prop}; }
  .param{ color:${param}; }
  .t   { color:${p.fg}; }
  .statusbar { height:26px; background:${chrome}; display:flex; align-items:center;
    padding:0 12px; gap:16px; font-size:11px; color:${p.fg}; flex:0 0 auto; }
  .statusbar .accent { color:${onAccent}; background:${p.accent}; padding:2px 8px;
    border-radius:4px; font-weight:600; }
  </style></head><body>
  <div class="win">
    <div class="titlebar">
      <div class="dots"><i style="background:#ff5f57"></i><i style="background:#febc2e"></i><i style="background:#28c840"></i></div>
      <span class="title">applyTheme.ts — ThemePaint</span>
    </div>
    <div class="body">
      <div class="activity">
        <div class="ico sel"></div><div class="ico"></div><div class="ico"></div><div class="ico"></div>
      </div>
      <div class="sidebar">
        <div class="side-title">ThemePaint</div>
        ${renderSidebar(p)}
      </div>
      <div class="editor">
        <div class="tabs">
          <div class="tab active"><span class="fdot"></span>applyTheme.ts</div>
          <div class="tab">theme.json</div>
        </div>
        <div class="code-area">${renderCode()}</div>
      </div>
    </div>
    <div class="statusbar">
      <span class="accent">${esc(p.category)}: ${esc(p.name)}</span>
      <span>TypeScript</span><span>UTF-8</span><span>Ln 10, Col 24</span><span>Spaces: 2</span>
    </div>
  </div>
  </body></html>`;
}

function heroPage() {
  const chips = CATEGORY_ACCENTS.map(([name, c]) =>
    `<div class="chip"><span class="cdot" style="background:${c}"></span>${name}</div>`
  ).join("");
  return `<!doctype html><html><head><meta charset="utf-8"><style>
  * { margin:0; padding:0; box-sizing:border-box; }
  html,body { background:transparent; }
  .hero { width:1280px; height:460px; border-radius:16px; overflow:hidden;
    background:radial-gradient(120% 140% at 12% 0%, #2a2440 0%, #171326 55%, #0d0a18 100%);
    font-family:'Cascadia Code','JetBrains Mono','SF Mono',Menlo,Consolas,monospace;
    color:#e9e6f5; padding:56px 64px; display:flex; flex-direction:column;
    justify-content:center; box-shadow:0 30px 90px rgba(0,0,0,.6); position:relative; }
  .brandbar { display:flex; gap:6px; margin-bottom:26px; }
  .brandbar i { width:34px; height:8px; border-radius:4px; display:block; }
  h1 { font-size:78px; font-weight:800; letter-spacing:-.02em; line-height:1;
    background:linear-gradient(92deg,#00e8c6,#7aa2f7,#ff7edb,#fabd2f);
    -webkit-background-clip:text; background-clip:text; color:transparent; }
  .tag { font-size:26px; margin-top:18px; color:#c9c3e6; font-weight:500; }
  .sub { font-size:16px; margin-top:10px; color:#8f88b0; }
  .chips { display:flex; flex-wrap:wrap; gap:9px; margin-top:34px; max-width:1000px; }
  .chip { display:flex; align-items:center; gap:7px; font-size:13px; color:#d7d2ee;
    background:rgba(255,255,255,.05); border:1px solid rgba(255,255,255,.08);
    padding:6px 11px; border-radius:20px; }
  .cdot { width:11px; height:11px; border-radius:50%; display:block; }
  </style></head><body>
  <div class="hero">
    <div class="brandbar">
      <i style="background:#00e8c6"></i><i style="background:#7aa2f7"></i>
      <i style="background:#ff7edb"></i><i style="background:#a6e3a1"></i>
      <i style="background:#fabd2f"></i><i style="background:#ff5ec7"></i>
    </div>
    <h1>ThemePaint</h1>
    <div class="tag">100 modern color themes · 20 categories · one-click picker</div>
    <div class="sub">Dark · Light · Ocean · Neon · Synthwave · Pastel · Cybersecurity · and more</div>
    <div class="chips">${chips}</div>
  </div>
  </body></html>`;
}

function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const manifest = [];

  fs.writeFileSync(path.join(OUT, "hero.html"), heroPage());
  manifest.push({ name: "hero", w: 1280, h: 460 });

  for (const p of HIGHLIGHTS) {
    const slug = p.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    fs.writeFileSync(path.join(OUT, `${slug}.html`), themePage(p));
    manifest.push({ name: slug, w: 1000, h: 640 });
  }

  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2) + "\n");
  console.log(`Wrote ${manifest.length} preview pages to media/preview/`);
}

main();
