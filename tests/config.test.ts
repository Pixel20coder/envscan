import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { writeFileSync, rmSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { loadConfig, makeMatcher } from "../src/config.js";

let dir: string;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "envscan-cfg-"));
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("loadConfig", () => {
  it("returns empty defaults when no config exists", () => {
    expect(loadConfig(dir)).toEqual({ ignore: [] });
  });

  it("reads env, strict, and ignore fields", () => {
    writeFileSync(
      join(dir, "envscan.json"),
      JSON.stringify({ env: ".env.sample", strict: true, ignore: ["AWS_*", "DEBUG"], extra: 1 }),
    );
    expect(loadConfig(dir)).toEqual({
      env: ".env.sample",
      strict: true,
      ignore: ["AWS_*", "DEBUG"],
    });
  });

  it("accepts a list of env files", () => {
    const d = mkdtempSync(join(tmpdir(), "envscan-multi-"));
    writeFileSync(join(d, "envscan.json"), JSON.stringify({ env: [".env.example", ".env.local"] }));
    expect(loadConfig(d).env).toEqual([".env.example", ".env.local"]);
    rmSync(d, { recursive: true, force: true });
  });

  it("throws a readable error on invalid JSON", () => {
    const bad = mkdtempSync(join(tmpdir(), "envscan-bad-"));
    writeFileSync(join(bad, "envscan.json"), "{ not json");
    expect(() => loadConfig(bad)).toThrow(/not valid JSON/);
    rmSync(bad, { recursive: true, force: true });
  });
});

describe("makeMatcher", () => {
  it("matches exact names and glob patterns", () => {
    const match = makeMatcher(["DEBUG", "AWS_*"]);
    expect(match("DEBUG")).toBe(true);
    expect(match("AWS_REGION")).toBe(true);
    expect(match("AWS_SECRET_KEY")).toBe(true);
    expect(match("DATABASE_URL")).toBe(false);
  });

  it("never matches when the pattern list is empty", () => {
    expect(makeMatcher([])("ANYTHING")).toBe(false);
  });
});
