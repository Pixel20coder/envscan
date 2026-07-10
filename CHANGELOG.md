# Changelog

All notable changes to this project are documented here.
This project follows [Semantic Versioning](https://semver.org).

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
