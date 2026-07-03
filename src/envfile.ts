import { readFileSync, existsSync } from "node:fs";

/**
 * Parse the KEY names declared in a dotenv-style file.
 * We only care about which keys are defined, not their values.
 */
export function parseEnvKeys(filePath: string): Set<string> {
  const keys = new Set<string>();
  if (!existsSync(filePath)) return keys;

  const content = readFileSync(filePath, "utf8");
  for (const rawLine of content.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;

    // Support optional `export ` prefix, then KEY=...
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (match?.[1]) keys.add(match[1]);
  }
  return keys;
}
