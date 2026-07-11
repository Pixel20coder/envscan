#!/usr/bin/env node
import { join, resolve } from "node:path";
import { collectFiles, scanUsages } from "./scanner.js";
import { parseEnvKeys, appendEnvKeys, findDuplicateKeys } from "./envfile.js";
import { buildReport } from "./report.js";
import { loadConfig, makeMatcher } from "./config.js";
import { detectFramework, presetPatterns } from "./presets.js";

const c = {
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

/** Raw command-line flags. `envFile`/`strict` stay undefined unless passed, so
 *  config-file values can fill the gap before defaults are applied. */
interface CliArgs {
  dir: string;
  envFiles: string[];
  json: boolean;
  strict?: boolean;
  fix: boolean;
  framework?: string;
}

interface Options {
  dir: string;
  envFiles: string[];
  json: boolean;
  strict: boolean;
  fix: boolean;
}

function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { dir: ".", envFiles: [], json: false, fix: false };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--env" || arg === "-e") {
      const next = argv[++i];
      if (next) args.envFiles.push(next);
    } else if (arg === "--framework" || arg === "-f") args.framework = argv[++i] ?? args.framework;
    else if (arg === "--json") args.json = true;
    else if (arg === "--strict") args.strict = true;
    else if (arg === "--fix") args.fix = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (!arg?.startsWith("-")) args.dir = arg ?? args.dir;
  }
  return args;
}

function printHelp(): void {
  console.log(`${c.bold("envscan")} — find missing or unused environment variables

${c.bold("Usage:")}
  envscan [dir] [options]

${c.bold("Options:")}
  -e, --env <file>       env file to check against (repeatable; default: .env.example)
  -f, --framework <name> preset for injected vars: next, vite, cra, expo, astro
      --fix              append any missing vars to the env file as placeholders
      --strict           also fail when declared vars are unused
      --json             output machine-readable JSON
  -h, --help             show this help

${c.bold("Config:")}
  envscan.json in the target dir may set "env", "strict", "framework",
  and an "ignore" list of var names or * patterns (e.g. "AWS_*"). Flags win.
  The framework is auto-detected from package.json when not set.

${c.bold("Exit codes:")}
  0  all good   1  missing/duplicate/unused vars   2  bad config`);
}

function main(): void {
  const args = parseArgs(process.argv.slice(2));
  const root = resolve(args.dir);

  // CLI flags take precedence over envscan.json, which takes precedence over defaults.
  let config;
  try {
    config = loadConfig(root);
  } catch (err) {
    console.error(c.red(`✖ ${(err as Error).message}`));
    process.exit(2);
  }
  // Env files: CLI flags > config (string or list) > default. Flags win entirely.
  const configEnv = config.env === undefined ? [] : [config.env].flat();
  const envFiles = args.envFiles.length > 0 ? args.envFiles
    : configEnv.length > 0 ? configEnv
    : [".env.example"];

  const opts: Options = {
    dir: args.dir,
    envFiles,
    json: args.json,
    strict: args.strict ?? config.strict ?? false,
    fix: args.fix,
  };

  // Framework: explicit flag > config > auto-detected from package.json.
  const framework = args.framework ?? config.framework ?? detectFramework(root);
  const ignorePatterns = [...config.ignore, ...presetPatterns(framework)];

  const files = collectFiles(root);
  const usages = scanUsages(files);
  const envPaths = opts.envFiles.map((f) => join(root, f));

  // Keys declared in *any* env file count as declared; duplicates are per-file.
  const declared = new Set<string>();
  const duplicateSet = new Set<string>();
  for (const p of envPaths) {
    for (const key of parseEnvKeys(p)) declared.add(key);
    for (const key of findDuplicateKeys(p)) duplicateSet.add(key);
  }
  const duplicates = [...duplicateSet].sort((a, b) => a.localeCompare(b));
  const report = buildReport(usages, declared, makeMatcher(ignorePatterns), duplicates);

  if (opts.fix && report.missing.length > 0) {
    // Missing vars are added to the first env file in the list.
    const target = opts.envFiles[0]!;
    const added = appendEnvKeys(join(root, target), report.missing.map((m) => m.key));
    console.log(c.green(`✚ Added ${added.length} placeholder(s) to ${target}:`));
    console.log(`  ${added.join(", ")}\n`);
    process.exit(0);
  }

  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHuman(report, opts, files.length);
  }

  const failed =
    report.missing.length > 0 ||
    report.duplicates.length > 0 ||
    (opts.strict && report.unused.length > 0);
  process.exit(failed ? 1 : 0);
}

function printHuman(
  report: ReturnType<typeof buildReport>,
  opts: Options,
  fileCount: number,
): void {
  console.log(c.dim(`Scanned ${fileCount} files · checked against ${opts.envFiles.join(", ")}\n`));

  if (
    report.missing.length === 0 &&
    report.unused.length === 0 &&
    report.duplicates.length === 0
  ) {
    console.log(c.green("✔ All environment variables are declared and used."));
    return;
  }

  if (report.missing.length > 0) {
    console.log(c.red(`✖ ${report.missing.length} missing variable(s):`));
    for (const { key, usages } of report.missing) {
      const where = usages[0];
      console.log(`  ${c.red("•")} ${c.bold(key)} ${c.dim(`(${where?.file}:${where?.line})`)}`);
    }
    console.log();
  }

  if (report.duplicates.length > 0) {
    console.log(c.red(`✖ ${report.duplicates.length} duplicate declaration(s):`));
    console.log(`  ${report.duplicates.join(", ")}\n`);
  }

  if (report.unused.length > 0) {
    const label = opts.strict ? c.red : c.yellow;
    console.log(label(`⚠ ${report.unused.length} declared but unused:`));
    console.log(`  ${report.unused.join(", ")}\n`);
  }
}

main();
