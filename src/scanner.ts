import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { stripComments } from "./comments.js";

const CODE_EXTENSIONS = new Set([
  ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs", ".vue", ".svelte",
]);

const IGNORED_DIRS = new Set([
  "node_modules", ".git", "dist", "build", ".next", "coverage", ".turbo",
]);

// Matches process.env.FOO, process.env["FOO"], import.meta.env.FOO
const ENV_USAGE = /(?:process\.env|import\.meta\.env)(?:\.([A-Za-z_][A-Za-z0-9_]*)|\[\s*['"`]([A-Za-z_][A-Za-z0-9_]*)['"`]\s*\])/g;

// A fallback right after the reference (`|| "x"`, `?? "x"`) makes the var optional.
const FALLBACK = /^\s*(?:\|\||\?\?)/;

export interface EnvUsage {
  key: string;
  file: string;
  line: number;
  /** True when the reference has a `||`/`??` fallback, so absence is handled. */
  optional: boolean;
}

/** Recursively collect scannable code files under `dir`. */
export function collectFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      if (IGNORED_DIRS.has(entry)) continue;
      out.push(...collectFiles(full));
    } else if (CODE_EXTENSIONS.has(extname(entry))) {
      out.push(full);
    }
  }
  return out;
}

/** Find every environment-variable reference in the given files. */
export function scanUsages(files: string[]): EnvUsage[] {
  const usages: EnvUsage[] = [];
  for (const file of files) {
    // Strip comments first so commented-out references aren't counted.
    const content = stripComments(readFileSync(file, "utf8"));
    const lines = content.split(/\r?\n/);
    lines.forEach((text, i) => {
      let m: RegExpExecArray | null;
      ENV_USAGE.lastIndex = 0;
      while ((m = ENV_USAGE.exec(text)) !== null) {
        const key = m[1] ?? m[2];
        if (!key) continue;
        const rest = text.slice(m.index + m[0].length);
        usages.push({ key, file, line: i + 1, optional: FALLBACK.test(rest) });
      }
    });
  }
  return usages;
}
