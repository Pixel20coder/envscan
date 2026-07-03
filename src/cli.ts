#!/usr/bin/env node
import { join, resolve } from "node:path";
import { collectFiles, scanUsages } from "./scanner.js";
import { parseEnvKeys } from "./envfile.js";
import { buildReport } from "./report.js";

const c = {
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
};

interface Options {
  dir: string;
  envFile: string;
  json: boolean;
  strict: boolean;
}

function parseArgs(argv: string[]): Options {
  const opts: Options = {
    dir: ".",
    envFile: ".env.example",
    json: false,
    strict: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--env" || arg === "-e") opts.envFile = argv[++i] ?? opts.envFile;
    else if (arg === "--json") opts.json = true;
    else if (arg === "--strict") opts.strict = true;
    else if (arg === "--help" || arg === "-h") {
      printHelp();
      process.exit(0);
    } else if (!arg?.startsWith("-")) opts.dir = arg ?? opts.dir;
  }
  return opts;
}

function printHelp(): void {
  console.log(`${c.bold("envscan")} — find missing or unused environment variables

${c.bold("Usage:")}
  envscan [dir] [options]

${c.bold("Options:")}
  -e, --env <file>   env file to check against (default: .env.example)
      --strict       also fail when declared vars are unused
      --json         output machine-readable JSON
  -h, --help         show this help

${c.bold("Exit codes:")}
  0  all good   1  missing (or unused in --strict) vars found`);
}

function main(): void {
  const opts = parseArgs(process.argv.slice(2));
  const root = resolve(opts.dir);

  const files = collectFiles(root);
  const usages = scanUsages(files);
  const declared = parseEnvKeys(join(root, opts.envFile));
  const report = buildReport(usages, declared);

  if (opts.json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    printHuman(report, opts, files.length);
  }

  const failed = report.missing.length > 0 || (opts.strict && report.unused.length > 0);
  process.exit(failed ? 1 : 0);
}

function printHuman(
  report: ReturnType<typeof buildReport>,
  opts: Options,
  fileCount: number,
): void {
  console.log(c.dim(`Scanned ${fileCount} files · checked against ${opts.envFile}\n`));

  if (report.missing.length === 0 && report.unused.length === 0) {
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

  if (report.unused.length > 0) {
    const label = opts.strict ? c.red : c.yellow;
    console.log(label(`⚠ ${report.unused.length} declared but unused:`));
    console.log(`  ${report.unused.join(", ")}\n`);
  }
}

main();
