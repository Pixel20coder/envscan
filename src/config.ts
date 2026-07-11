import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

export const CONFIG_FILE = "envscan.json";

export interface Config {
  /** Env file(s) to check against (e.g. ".env.example" or a list). */
  env?: string | string[];
  /** Also fail when declared vars are unused. */
  strict?: boolean;
  /** Framework preset name (e.g. "next", "vite") for injected vars. */
  framework?: string;
  /** Var names or `*` glob patterns to exclude from the report. */
  ignore: string[];
}

/**
 * Load `envscan.json` from `root` if it exists. Unknown keys are ignored and
 * malformed config throws a readable error rather than a stack trace.
 */
export function loadConfig(root: string): Config {
  const path = join(root, CONFIG_FILE);
  const config: Config = { ignore: [] };
  if (!existsSync(path)) return config;

  let parsed: unknown;
  try {
    parsed = JSON.parse(readFileSync(path, "utf8"));
  } catch {
    throw new Error(`${CONFIG_FILE} is not valid JSON`);
  }
  if (typeof parsed !== "object" || parsed === null) {
    throw new Error(`${CONFIG_FILE} must contain a JSON object`);
  }

  const obj = parsed as Record<string, unknown>;
  if (typeof obj.env === "string") config.env = obj.env;
  else if (Array.isArray(obj.env)) {
    config.env = obj.env.filter((v): v is string => typeof v === "string");
  }
  if (typeof obj.strict === "boolean") config.strict = obj.strict;
  if (typeof obj.framework === "string") config.framework = obj.framework;
  if (Array.isArray(obj.ignore)) {
    config.ignore = obj.ignore.filter((v): v is string => typeof v === "string");
  }
  return config;
}

/** Turn an ignore pattern (`AWS_*`) into a matcher for a variable name. */
export function makeMatcher(patterns: string[]): (key: string) => boolean {
  const regexes = patterns.map((p) => {
    const escaped = p.replace(/[.+?^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*");
    return new RegExp(`^${escaped}$`);
  });
  return (key: string) => regexes.some((re) => re.test(key));
}
