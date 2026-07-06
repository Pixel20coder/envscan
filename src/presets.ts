import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

/**
 * Framework presets: variable-name patterns that a framework injects at build
 * or runtime, so they should never be reported as "missing" from your env file.
 * Patterns use the same `*` glob syntax as the config ignore-list.
 */
export const PRESETS: Record<string, string[]> = {
  next: ["NEXT_PUBLIC_*", "NEXT_RUNTIME", "__NEXT_*", "VERCEL", "VERCEL_*"],
  vite: ["VITE_*", "MODE", "BASE_URL", "DEV", "PROD", "SSR"],
  cra: ["REACT_APP_*", "PUBLIC_URL", "FAST_REFRESH"],
  expo: ["EXPO_PUBLIC_*"],
  astro: ["PUBLIC_*", "ASTRO_*", "SITE", "BASE_URL"],
};

export type PresetName = keyof typeof PRESETS;

/** package.json dependency → preset name. First match wins. */
const DEP_TO_PRESET: [string, PresetName][] = [
  ["next", "next"],
  ["@astrojs/core", "astro"],
  ["astro", "astro"],
  ["expo", "expo"],
  ["react-scripts", "cra"],
  ["vite", "vite"],
];

/** Infer the framework from the project's package.json dependencies. */
export function detectFramework(root: string): PresetName | undefined {
  const pkgPath = join(root, "package.json");
  if (!existsSync(pkgPath)) return undefined;

  let deps: Record<string, unknown> = {};
  try {
    const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
    deps = { ...pkg.dependencies, ...pkg.devDependencies };
  } catch {
    return undefined;
  }

  for (const [dep, preset] of DEP_TO_PRESET) {
    if (dep in deps) return preset;
  }
  return undefined;
}

/** Resolve preset patterns for a framework name, or [] if unknown. */
export function presetPatterns(name: string | undefined): string[] {
  if (!name) return [];
  return PRESETS[name] ?? [];
}
