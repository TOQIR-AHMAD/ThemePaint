import * as vscode from "vscode";
import { WorkingTheme } from "./themeModel";

const STORE_KEY = "themePaint.savedThemes";

export interface SavedTheme {
  id: string;
  theme: WorkingTheme;
  updatedAt: number;
}

export interface SavedThemeMeta {
  id: string;
  name: string;
  type: string;
  updatedAt: number;
}

/** Persists user themes in context.globalState. */
export class ThemeStore {
  constructor(private readonly context: vscode.ExtensionContext) {}

  private all(): SavedTheme[] {
    return this.context.globalState.get<SavedTheme[]>(STORE_KEY, []);
  }

  private async writeAll(themes: SavedTheme[]): Promise<void> {
    await this.context.globalState.update(STORE_KEY, themes);
  }

  public list(): SavedThemeMeta[] {
    return this.all()
      .map((s) => ({ id: s.id, name: s.theme.name, type: s.theme.type, updatedAt: s.updatedAt }))
      .sort((a, b) => b.updatedAt - a.updatedAt);
  }

  public get(id: string): SavedTheme | undefined {
    return this.all().find((s) => s.id === id);
  }

  /** Upsert by id. Returns the stored record. `now` is supplied by the caller. */
  public async save(theme: WorkingTheme, now: number, id?: string): Promise<SavedTheme> {
    const themes = this.all();
    const useId = id ?? makeId(theme.name, now, themes);
    const record: SavedTheme = { id: useId, theme: structuredCloneSafe(theme), updatedAt: now };
    const idx = themes.findIndex((s) => s.id === useId);
    if (idx >= 0) {
      themes[idx] = record;
    } else {
      themes.push(record);
    }
    await this.writeAll(themes);
    return record;
  }

  public async rename(id: string, name: string, now: number): Promise<void> {
    const themes = this.all();
    const t = themes.find((s) => s.id === id);
    if (t) {
      t.theme.name = name;
      t.updatedAt = now;
      await this.writeAll(themes);
    }
  }

  public async duplicate(id: string, now: number): Promise<SavedTheme | undefined> {
    const src = this.get(id);
    if (!src) {
      return undefined;
    }
    const copy = structuredCloneSafe(src.theme);
    copy.name = `${copy.name} copy`;
    return this.save(copy, now);
  }

  public async delete(id: string): Promise<void> {
    await this.writeAll(this.all().filter((s) => s.id !== id));
  }
}

function makeId(name: string, now: number, existing: SavedTheme[]): string {
  const base =
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "theme";
  let id = base;
  let n = 1;
  const taken = new Set(existing.map((s) => s.id));
  while (taken.has(id)) {
    id = `${base}-${now.toString(36)}-${n++}`;
  }
  return id;
}

function structuredCloneSafe<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}
