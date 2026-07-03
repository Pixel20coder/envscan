import type { EnvUsage } from "./scanner.js";

export interface Report {
  /** Vars used in code but not declared in the env file. */
  missing: { key: string; usages: EnvUsage[] }[];
  /** Vars declared in the env file but never used in code. */
  unused: string[];
  /** Every distinct var referenced in code. */
  used: string[];
}

// Common vars injected by the runtime/tooling — not expected in .env.
const BUILTINS = new Set(["NODE_ENV", "PORT", "PWD", "HOME", "PATH", "CI"]);

export function buildReport(
  usages: EnvUsage[],
  declared: Set<string>,
): Report {
  const byKey = new Map<string, EnvUsage[]>();
  for (const u of usages) {
    const list = byKey.get(u.key) ?? [];
    list.push(u);
    byKey.set(u.key, list);
  }

  const missing: Report["missing"] = [];
  for (const [key, keyUsages] of byKey) {
    if (!declared.has(key) && !BUILTINS.has(key)) {
      missing.push({ key, usages: keyUsages });
    }
  }
  missing.sort((a, b) => a.key.localeCompare(b.key));

  const unused = [...declared]
    .filter((key) => !byKey.has(key))
    .sort((a, b) => a.localeCompare(b));

  return {
    missing,
    unused,
    used: [...byKey.keys()].sort((a, b) => a.localeCompare(b)),
  };
}
