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
});
