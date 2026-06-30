/** A small TypeScript snippet exercising the common token types for live preview. */
export const SAMPLE_CODE = `// ThemePaint sample — watch these colors change live
import { readFile } from "fs/promises";

const MAX_RETRIES = 3;
type Status = "idle" | "loading" | "done";

interface Profile {
  id: number;
  name: string;
  tags: string[];
}

/**
 * Loads a profile from disk and counts its tags.
 */
export class ProfileLoader {
  private cache = new Map<number, Profile>();

  async load(path: string): Promise<Profile | null> {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      try {
        const raw = await readFile(path, "utf8");
        const profile = JSON.parse(raw) as Profile;
        this.cache.set(profile.id, profile);
        return profile;
      } catch (err) {
        console.warn(\`Attempt \${attempt + 1} failed: \${String(err)}\`);
      }
    }
    return null; // gave up after retries
  }
}
`;
