import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { writeFileSync, mkdirSync, rmSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { collectFiles, scanUsages } from "../src/scanner.js";

let dir: string;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "envscan-scan-"));
  mkdirSync(join(dir, "node_modules"));
  writeFileSync(join(dir, "node_modules", "skip.js"), "process.env.SHOULD_SKIP");
  writeFileSync(
    join(dir, "app.ts"),
    ["const a = process.env.API_KEY;", "const b = process.env['DB_URL'];", "const c = import.meta.env.MODE;"].join("\n"),
  );
  writeFileSync(join(dir, "readme.md"), "process.env.NOT_CODE");
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("scanner", () => {
  it("collects only code files and skips ignored dirs", () => {
    const files = collectFiles(dir);
    expect(files.some((f) => f.endsWith("app.ts"))).toBe(true);
    expect(files.some((f) => f.includes("node_modules"))).toBe(false);
    expect(files.some((f) => f.endsWith("readme.md"))).toBe(false);
  });

  it("extracts dot, bracket, and import.meta env usages", () => {
    const keys = scanUsages(collectFiles(dir)).map((u) => u.key).sort();
    expect(keys).toEqual(["API_KEY", "DB_URL", "MODE"]);
  });

  it("detects Deno.env.get and Bun.env references", () => {
    const d = mkdtempSync(join(tmpdir(), "envscan-rt-"));
    writeFileSync(
      join(d, "app.ts"),
      [
        "const a = Deno.env.get('DENO_KEY');",
        "const b = Bun.env.BUN_KEY;",
        "const c = Bun.env['BUN_BRACKET'];",
      ].join("\n"),
    );
    const keys = scanUsages(collectFiles(d)).map((u) => u.key).sort();
    expect(keys).toEqual(["BUN_BRACKET", "BUN_KEY", "DENO_KEY"]);
    rmSync(d, { recursive: true, force: true });
  });

  it("treats a Deno.env.get with a fallback as optional", () => {
    const d = mkdtempSync(join(tmpdir(), "envscan-rt2-"));
    writeFileSync(join(d, "app.ts"), "const a = Deno.env.get('LEVEL') ?? 'info';");
    const [usage] = scanUsages(collectFiles(d));
    expect(usage).toMatchObject({ key: "LEVEL", optional: true });
    rmSync(d, { recursive: true, force: true });
  });

  it("ignores references inside comments", () => {
    const d = mkdtempSync(join(tmpdir(), "envscan-cmt-"));
    writeFileSync(
      join(d, "app.ts"),
      [
        "const a = process.env.REAL;",
        "// const b = process.env.COMMENTED;",
        "/* process.env.BLOCKED */",
      ].join("\n"),
    );
    const keys = scanUsages(collectFiles(d)).map((u) => u.key).sort();
    expect(keys).toEqual(["REAL"]);
    rmSync(d, { recursive: true, force: true });
  });

  it("marks references with a || or ?? fallback as optional", () => {
    const d = mkdtempSync(join(tmpdir(), "envscan-opt-"));
    writeFileSync(
      join(d, "app.ts"),
      [
        "const a = process.env.REQUIRED;",
        "const b = process.env.WITH_OR || 'x';",
        "const c = process.env.WITH_NULLISH ?? 'y';",
      ].join("\n"),
    );
    const byKey = Object.fromEntries(scanUsages(collectFiles(d)).map((u) => [u.key, u.optional]));
    expect(byKey).toEqual({ REQUIRED: false, WITH_OR: true, WITH_NULLISH: true });
    rmSync(d, { recursive: true, force: true });
  });
});
