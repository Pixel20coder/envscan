import { readFileSync, existsSync, writeFileSync } from "node:fs";

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

/**
 * Append the given keys to an env file as empty placeholders, creating the
 * file if it does not exist. Returns the keys that were actually written
 * (skipping any that are already present).
 */
export function appendEnvKeys(filePath: string, keys: string[]): string[] {
  const existing = parseEnvKeys(filePath);
  const toAdd = keys.filter((k) => !existing.has(k)).sort((a, b) => a.localeCompare(b));
  if (toAdd.length === 0) return [];

  const prev = existsSync(filePath) ? readFileSync(filePath, "utf8") : "";
  const needsNewline = prev.length > 0 && !prev.endsWith("\n");
  const block = toAdd.map((k) => `${k}=`).join("\n") + "\n";

  writeFileSync(filePath, prev + (needsNewline ? "\n" : "") + block);
  return toAdd;
}
