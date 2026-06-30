import * as vscode from "vscode";
import { exec } from "child_process";
import { promisify } from "util";
import { WorkingTheme, buildThemeFile } from "./themeModel";

const execAsync = promisify(exec);

export interface ExportResult {
  folder: string;
  themeFile: string;
  packageCommand: string;
  vsixPath?: string;
  vsceMessage: string;
}

function slug(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "themeforge-theme"
  );
}

/**
 * Write an installable theme package into `folder`:
 *   package.json (contributes.themes), themes/<slug>-color-theme.json, README.md
 * Then attempt to run `vsce package` if @vscode/vsce is available.
 */
export async function exportTheme(
  folderUri: vscode.Uri,
  theme: WorkingTheme,
  version: string
): Promise<ExportResult> {
  const id = slug(theme.name);
  const themeRelPath = `themes/${id}-color-theme.json`;

  const themeFileObj = buildThemeFile(theme);

  const pkg = {
    name: id,
    displayName: theme.name,
    description: `${theme.name} — a color theme created with ThemePaint.`,
    version,
    engines: { vscode: "^1.84.0" },
    categories: ["Themes"],
    contributes: {
      themes: [
        {
          label: theme.name,
          uiTheme: uiThemeFor(theme.type),
          path: `./${themeRelPath}`,
        },
      ],
    },
  };

  const readme = generateReadme(theme, id);

  // Create folders + files via the VS Code fs API (works on remote/virtual FS too).
  await vscode.workspace.fs.createDirectory(folderUri);
  await vscode.workspace.fs.createDirectory(vscode.Uri.joinPath(folderUri, "themes"));

  await writeJson(vscode.Uri.joinPath(folderUri, "package.json"), pkg);
  await writeJson(vscode.Uri.joinPath(folderUri, themeRelPath), themeFileObj);
  await writeText(vscode.Uri.joinPath(folderUri, "README.md"), readme);

  const folderPath = folderUri.fsPath;
  const packageCommand = `cd "${folderPath}" && npx --yes @vscode/vsce package`;

  // Best-effort: run vsce if it can be resolved. Failure is non-fatal.
  let vsixPath: string | undefined;
  let vsceMessage: string;
  try {
    const { stdout } = await execAsync("npx --yes @vscode/vsce package", {
      cwd: folderPath,
      timeout: 120000,
    });
    const match = stdout.match(/Packaged:\s*(.+\.vsix)/i);
    if (match) {
      vsixPath = match[1].trim();
      vsceMessage = `Packaged successfully: ${vsixPath}`;
    } else {
      vsixPath = vscode.Uri.joinPath(folderUri, `${id}-${version}.vsix`).fsPath;
      vsceMessage = `vsce ran. Look for the .vsix in ${folderPath}`;
    }
  } catch (e: any) {
    vsceMessage =
      "Could not run vsce automatically (it may not be installed or network is unavailable). " +
      "Run the printed command manually to produce a .vsix.";
  }

  return {
    folder: folderPath,
    themeFile: vscode.Uri.joinPath(folderUri, themeRelPath).fsPath,
    packageCommand,
    vsixPath,
    vsceMessage,
  };
}

function uiThemeFor(type: string): string {
  if (type === "light") {
    return "vs";
  }
  if (type === "hc-black") {
    return "hc-black";
  }
  return "vs-dark";
}

async function writeJson(uri: vscode.Uri, obj: any): Promise<void> {
  await writeText(uri, JSON.stringify(obj, null, 2) + "\n");
}

async function writeText(uri: vscode.Uri, text: string): Promise<void> {
  await vscode.workspace.fs.writeFile(uri, Buffer.from(text, "utf8"));
}

function generateReadme(theme: WorkingTheme, id: string): string {
  return `# ${theme.name}

A VS Code color theme.

## Install without packaging

Copy this folder into your extensions directory and restart VS Code, then pick
${theme.name} from Preferences: Color Theme.

- Windows: \`%USERPROFILE%\\.vscode\\extensions\\${id}\`
- macOS/Linux: \`~/.vscode/extensions/${id}\`

## Package as a .vsix

\`\`\`bash
vsce package    # needs @vscode/vsce installed
code --install-extension ${id}-<version>.vsix
\`\`\`

To publish (\`vsce publish\`) you'll need a publisher and a token:
https://code.visualstudio.com/api/working-with-extensions/publishing-extension
`;
}
