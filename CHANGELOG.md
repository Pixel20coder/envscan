# Changelog

All notable changes to this project are documented here.
This project follows [Semantic Versioning](https://semver.org).

## 0.10.0

- Broader runtime support: detect `Bun.env.FOO` and `Deno.env.get("FOO")` in
  addition to `process.env` and `import.meta.env`.

## 0.9.0

- GitHub Actions annotations: with `--github` (auto-enabled in CI) envscan emits
  workflow commands so missing/duplicate/unused vars appear inline on the PR.

## 0.8.0

- Comment-aware scanning: references inside `//` and `/* */` comments are no
  longer counted, while string literals (and `process.env["KEY"]`) are preserved.

## 0.7.0

- Detect optional variables: references with a `||`/`??` fallback are no longer
  reported as missing, just listed for awareness.

## 0.6.0

- Check against multiple env files: repeat `--env` or pass a list in
  `envscan.json`. A variable declared in any file counts as declared.

## 0.5.0

- Detect duplicate variable declarations in the env file and fail on them.

## 0.4.0

- Framework presets (`next`, `vite`, `cra`, `expo`, `astro`) with auto-detection
  from `package.json`, so framework-injected vars aren't reported as missing.

## 0.3.0

- `envscan.json` config file with `env`, `strict`, and an `ignore` list
  supporting exact names and `*` glob patterns.

## 0.2.0

- `--fix` flag to append missing variables to the env file as placeholders.

## 0.1.0

- Initial release: scan a codebase for `process.env` / `import.meta.env` usage
  and report missing and unused variables, with human and `--json` output.
