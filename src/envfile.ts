import { readFileSync, existsSync, writeFileSync } from "node:fs";

/**
 * Read the declared KEY names from a dotenv-style file, in file order and
 * including any repeats. Blank lines and comments are skipped. Returns [] when
 * the file does not exist.
 */
function readDeclaredKeys(filePath: string): string[] {
  if (!existsSync(filePath)) return [];

  const keys: string[] = [];
  for (const rawLine of readFileSync(filePath, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "" || line.startsWith("#")) continue;

    // Support optional `export ` prefix, then KEY=...
    const match = line.match(/^(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=/);
    if (match?.[1]) keys.push(match[1]);
  }
  return keys;
}

/**
 * Parse the distinct KEY names declared in a dotenv-style file.
 * We only care about which keys are defined, not their values.
 */
export function parseEnvKeys(filePath: string): Set<string> {
  return new Set(readDeclaredKeys(filePath));
}

/**
 * Find keys that are declared more than once in the env file. Later
 * declarations silently override earlier ones, so this is usually a mistake.
 */
export function findDuplicateKeys(filePath: string): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const key of readDeclaredKeys(filePath)) {
    if (seen.has(key)) dupes.add(key);
    else seen.add(key);
  }
  return [...dupes].sort((a, b) => a.localeCompare(b));
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
