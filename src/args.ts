/** Raw command-line flags. `strict`/`framework` stay undefined unless passed, so
 *  config-file values can fill the gap before defaults are applied. */
export interface CliArgs {
  dir: string;
  envFiles: string[];
  json: boolean;
  strict?: boolean;
  fix: boolean;
  framework?: string;
  github?: boolean;
  ignore: string[];
  help?: boolean;
  version?: boolean;
}

/** Parse argv into flags. Pure — side effects (help/version output) happen in the CLI. */
export function parseArgs(argv: string[]): CliArgs {
  const args: CliArgs = { dir: ".", envFiles: [], json: false, fix: false, ignore: [] };
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--env" || arg === "-e") {
      const next = argv[++i];
      if (next) args.envFiles.push(next);
    } else if (arg === "--ignore" || arg === "-i") {
      const next = argv[++i];
      if (next) args.ignore.push(next);
    } else if (arg === "--framework" || arg === "-f") args.framework = argv[++i] ?? args.framework;
    else if (arg === "--json") args.json = true;
    else if (arg === "--github") args.github = true;
    else if (arg === "--strict") args.strict = true;
    else if (arg === "--fix") args.fix = true;
    else if (arg === "--help" || arg === "-h") args.help = true;
    else if (arg === "--version" || arg === "-v") args.version = true;
    else if (!arg?.startsWith("-")) args.dir = arg ?? args.dir;
  }
  return args;
}
