# envscan

[![npm version](https://img.shields.io/npm/v/envscan.svg)](https://www.npmjs.com/package/envscan)
[![license](https://img.shields.io/npm/l/envscan.svg)](./LICENSE)
[![node](https://img.shields.io/node/v/envscan.svg)](https://nodejs.org)

> Catch missing or unused environment variables before they break production.

`envscan` walks your codebase, finds every `process.env.X` / `import.meta.env.X`
reference, and compares it against your `.env.example`. It tells you which
variables your code needs but you forgot to document, and which ones you
document but no longer use.

Zero runtime dependencies. Works with JS, TS, JSX, TSX, Vue, and Svelte.

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
envscan --fix                 # append missing vars to the env file as placeholders
envscan --strict              # also fail on unused (documented but dead) vars
envscan --json                # machine-readable output for CI
```

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

## How it works

| Step    | What happens                                                        |
| ------- | ------------------------------------------------------------------- |
| collect | Recursively gather code files, skipping `node_modules`, `dist`, etc. |
| scan    | Regex-match `process.env.*` and `import.meta.env.*` usages          |
| compare | Diff usages against keys declared in your env file, flag duplicates |
| report  | Print human output, or JSON with `--json`                           |

Runtime-injected vars (`NODE_ENV`, `PORT`, `CI`, …) are ignored by default.

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
  "env": ".env.example",
  "strict": false,
  "framework": "next",
  "ignore": ["AWS_*", "SENTRY_DSN"]
}
```

Command-line flags always override the config file.

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
