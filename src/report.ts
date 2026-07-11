import type { EnvUsage } from "./scanner.js";

export interface Report {
  /** Required vars used in code but not declared in the env file. */
  missing: { key: string; usages: EnvUsage[] }[];
  /** Undeclared vars whose every usage has a fallback — safe but worth noting. */
  optional: string[];
  /** Vars declared in the env file but never used in code. */
  unused: string[];
  /** Vars declared more than once in the env file. */
  duplicates: string[];
  /** Every distinct var referenced in code. */
  used: string[];
}

// Common vars injected by the runtime/tooling — not expected in .env.
const BUILTINS = new Set(["NODE_ENV", "PORT", "PWD", "HOME", "PATH", "CI"]);

export function buildReport(
  usages: EnvUsage[],
  declared: Set<string>,
  isIgnored: (key: string) => boolean = () => false,
  duplicates: string[] = [],
): Report {
  const byKey = new Map<string, EnvUsage[]>();
  for (const u of usages) {
    const list = byKey.get(u.key) ?? [];
    list.push(u);
    byKey.set(u.key, list);
  }

  const missing: Report["missing"] = [];
  const optional: string[] = [];
  for (const [key, keyUsages] of byKey) {
    if (declared.has(key) || BUILTINS.has(key) || isIgnored(key)) continue;
    // A var is only "missing" if at least one usage relies on it having a value.
    if (keyUsages.some((u) => !u.optional)) missing.push({ key, usages: keyUsages });
    else optional.push(key);
  }
  missing.sort((a, b) => a.key.localeCompare(b.key));
  optional.sort((a, b) => a.localeCompare(b));

  const unused = [...declared]
    .filter((key) => !byKey.has(key) && !isIgnored(key))
    .sort((a, b) => a.localeCompare(b));

  return {
    missing,
    optional,
    unused,
    duplicates: duplicates.filter((key) => !isIgnored(key)),
    used: [...byKey.keys()].sort((a, b) => a.localeCompare(b)),
  };
}
