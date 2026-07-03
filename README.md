# envscan

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
| compare | Diff usages against keys declared in your env file                  |
| report  | Print human output, or JSON with `--json`                           |

Runtime-injected vars (`NODE_ENV`, `PORT`, `CI`, …) are ignored by default.

## Development

```bash
npm install
npm test          # run the test suite (vitest)
npm run build     # bundle to dist/ with tsup
npm run dev -- .  # run the CLI from source
```

## License

MIT © [Pixel20coder](https://github.com/Pixel20coder)
