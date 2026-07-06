import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { writeFileSync, rmSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { detectFramework, presetPatterns, PRESETS } from "../src/presets.js";

let dir: string;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "envscan-preset-"));
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

function withPkg(deps: Record<string, string>): string {
  const d = mkdtempSync(join(tmpdir(), "envscan-pkg-"));
  writeFileSync(join(d, "package.json"), JSON.stringify({ dependencies: deps }));
  return d;
}

describe("detectFramework", () => {
  it("detects next from dependencies", () => {
    expect(detectFramework(withPkg({ next: "14.0.0" }))).toBe("next");
  });

  it("detects vite from devDependencies", () => {
    const d = mkdtempSync(join(tmpdir(), "envscan-pkg-"));
    writeFileSync(join(d, "package.json"), JSON.stringify({ devDependencies: { vite: "5.0.0" } }));
    expect(detectFramework(d)).toBe("vite");
  });

  it("prefers next over vite when both are present", () => {
    expect(detectFramework(withPkg({ next: "14", vite: "5" }))).toBe("next");
  });

  it("returns undefined when no package.json exists", () => {
    expect(detectFramework(dir)).toBeUndefined();
  });
});

describe("presetPatterns", () => {
  it("returns the pattern list for a known framework", () => {
    expect(presetPatterns("next")).toEqual(PRESETS.next);
  });

  it("returns an empty list for unknown or missing names", () => {
    expect(presetPatterns("svelte")).toEqual([]);
    expect(presetPatterns(undefined)).toEqual([]);
  });
});
