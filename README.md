# envscan

[![npm version](https://img.shields.io/npm/v/envscan.svg)](https://www.npmjs.com/package/envscan)
[![license](https://img.shields.io/npm/l/envscan.svg)](./LICENSE)
[![node](https://img.shields.io/node/v/envscan.svg)](https://nodejs.org)
[![tests](https://img.shields.io/badge/tests-50%20passing-brightgreen)](./tests)

> Catch missing or unused environment variables before they break production.

`envscan` walks your codebase, finds every `process.env.X` / `import.meta.env.X`
reference, and compares it against your `.env.example`. It tells you which
variables your code needs but you forgot to document, and which ones you
document but no longer use.

Zero runtime dependencies. Works with JS, TS, JSX, TSX, Vue, and Svelte, and
recognizes `process.env`, `import.meta.env`, `Bun.env`, and `Deno.env.get()`.
Commented-out references are ignored, so old code doesn't cause false reports.

## Features

- **Missing & unused detection** — variables your code reads but you never
  documented, and documented variables the code no longer uses.
- **Multiple runtimes** — `process.env`, `import.meta.env`, `Bun.env`, `Deno.env.get()`.
- **Optional-variable awareness** — references with a `?? fallback` are treated as
  optional, not required.
- **Framework presets** — `NEXT_PUBLIC_*`, `VITE_*` and friends are auto-recognized.
- **Duplicate detection** — flags the same key declared twice in your env file.
- **Auto-fix** — `--fix` appends missing keys as placeholders.
- **CI-ready** — JSON output, GitHub Actions annotations, and meaningful exit codes.
- **Zero dependencies** — a single small binary, nothing to audit.

## Install

```bash
npm install -g envscan
# or run without installing:
npx envscan
```

## Usage

```bash
envscan                       # scan ./ against .env.example
envscan ./src                 # scan a specific directory
envscan --env .env.sample     # use a different reference file
envscan -e .env.example -e .env.local  # check against several files at once
envscan --ignore 'AWS_*'      # ignore vars by name or * pattern (repeatable)
envscan --fix                 # append missing vars to the env file as placeholders
envscan --strict              # also fail on unused (documented but dead) vars
envscan --json                # machine-readable output for CI
envscan --github              # emit GitHub Actions inline annotations
envscan --version             # print the installed version
```

### Flags

| Flag                 | Description                                                        |
| -------------------- | ------------------------------------------------------------------ |
| `-e`, `--env <file>` | Reference env file to check against (repeatable). Default `.env.example`. |
| `-i`, `--ignore <pattern>` | Ignore a variable by name or `*` pattern (repeatable). Merges with `envscan.json`. |
| `--fix`              | Append missing variables to the env file as empty placeholders.    |
| `--strict`           | Also fail when documented variables are unused.                    |
| `--framework <name>` | Force a framework preset: `next`, `vite`, `cra`, `expo`, `astro`.  |
| `--json`             | Emit machine-readable JSON instead of the human report.            |
| `--github`           | Emit GitHub Actions inline annotations.                            |
| `-v`, `--version`    | Print the installed version and exit.                              |
| `-h`, `--help`       | Show usage and exit.                                               |

### Example

```text
$ envscan
Scanned 42 files · checked against .env.example

✖ 2 missing variable(s):
  • STRIPE_SECRET_KEY  (src/billing.ts:12)
  • REDIS_URL          (src/cache.ts:4)

✖ 1 duplicate declaration(s) in .env.example:
  API_KEY

⚠ 1 declared but unused:
  LEGACY_TOKEN
```

## Use in CI

`envscan` exits `1` when it finds missing variables (or unused ones under
`--strict`), so it drops straight into a pipeline:

```yaml
- run: npx envscan --strict
```

Inside GitHub Actions it auto-detects the runner and emits inline annotations,
so missing variables show up right on the pull request diff. Force it anywhere
with `--github`:

```text
::error file=src/billing.ts,line=12::Missing environment variable STRIPE_SECRET_KEY
```

### Exit codes

| Code | Meaning                                                             |
| ---- | ------------------------------------------------------------------- |
| `0`  | Clean — no missing variables (and none unused under `--strict`).    |
| `1`  | Findings — missing variables, or unused ones when `--strict`.       |
| `2`  | Configuration or usage error (e.g. an invalid `envscan.json`).      |

## How it works

| Step    | What happens                                                        |
| ------- | ------------------------------------------------------------------- |
| collect | Recursively gather code files, skipping `node_modules`, `dist`, etc. |
| scan    | Strip comments, then match `process.env.*` / `import.meta.env.*`    |
| compare | Diff usages against keys declared in your env file, flag duplicates |
| report  | Print human output, or JSON with `--json`                           |

Runtime-injected vars (`NODE_ENV`, `PORT`, `CI`, …) are ignored by default.

### Optional variables

If every reference to a variable supplies a fallback, envscan treats it as
optional — it won't fail the check when the variable is missing, but still
lists it so you know it exists:

```ts
const level = process.env.LOG_LEVEL ?? "info";   // optional, not required
const key = process.env.API_KEY;                 // required
```

```text
ℹ 1 optional (used with a fallback): LOG_LEVEL
```

### Framework presets

Frameworks inject their own public variables (`NEXT_PUBLIC_*`, `VITE_*`, …).
envscan auto-detects the framework from your `package.json` and treats those as
valid, so they never show up as false "missing" reports. Override with a flag:

```bash
envscan --framework vite
```

Supported presets: `next`, `vite`, `cra`, `expo`, `astro`.

### Configuration

Drop an `envscan.json` in the scanned directory to set defaults and skip
variables you don't want reported (exact names or `*` glob patterns):

```json
{
  "env": [".env.example", ".env.local"],
  "strict": false,
  "framework": "next",
  "ignore": ["AWS_*", "SENTRY_DSN"]
}
```

`env` accepts a single file or a list — a variable declared in *any* of them
counts as declared. Command-line flags always override the config file.

### Auto-fixing

Pass `--fix` and envscan appends any missing variables to your env file as
empty placeholders (creating the file if needed), so you can fill in the values
instead of hunting them down:

```text
$ envscan --fix
✚ Added 2 placeholder(s) to .env.example:
  REDIS_URL, STRIPE_SECRET_KEY
```

## Development

```bash
npm install
npm test          # run the test suite (vitest)
npm run build     # bundle to dist/ with tsup
npm run dev -- .  # run the CLI from source
```

## License

MIT © [Pixel20coder](https://github.com/Pixel20coder)
