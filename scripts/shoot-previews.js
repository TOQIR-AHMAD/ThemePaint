// Screenshots the generated preview pages (media/preview/*.html) to PNG using
// headless Chrome/Edge. Renders at 2x for crisp marketplace images with
// transparent rounded corners. Run after `npm run previews`.

const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const { pathToFileURL } = require("url");

const OUT = path.join(__dirname, "..", "media", "preview");

const CANDIDATES = [
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "C:/Program Files/Microsoft/Edge/Application/msedge.exe",
];

function findBrowser() {
  for (const c of CANDIDATES) if (fs.existsSync(c)) return c;
  throw new Error("No Chrome/Edge found. Install one or edit CANDIDATES.");
}

function main() {
  const browser = findBrowser();
  const manifest = JSON.parse(fs.readFileSync(path.join(OUT, "manifest.json"), "utf8"));

  for (const { name, w, h } of manifest) {
    const html = path.join(OUT, `${name}.html`);
    const png = path.join(OUT, `${name}.png`);
    const args = [
      "--headless=new",
      "--disable-gpu",
      "--hide-scrollbars",
      "--force-device-scale-factor=2",
      "--default-background-color=00000000",
      `--window-size=${w},${h}`,
      `--screenshot=${png}`,
      pathToFileURL(html).href,
    ];
    const r = spawnSync(browser, args, { stdio: "inherit" });
    if (r.status !== 0) throw new Error(`Screenshot failed for ${name} (exit ${r.status})`);
    console.log(`✓ ${name}.png (${w * 2}×${h * 2})`);
  }
  console.log(`\nShot ${manifest.length} previews.`);
}

main();
