import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { writeFileSync, rmSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { readFileSync } from "node:fs";
import { parseEnvKeys, appendEnvKeys } from "../src/envfile.js";

let dir: string;

beforeAll(() => {
  dir = mkdtempSync(join(tmpdir(), "envscan-"));
});
afterAll(() => rmSync(dir, { recursive: true, force: true }));

describe("parseEnvKeys", () => {
  it("extracts keys and ignores comments and blanks", () => {
    const file = join(dir, ".env");
    writeFileSync(
      file,
      ["# a comment", "", "API_KEY=secret", "  export DB_URL=postgres://x", "PORT = 3000"].join("\n"),
    );
    const keys = parseEnvKeys(file);
    expect(keys).toEqual(new Set(["API_KEY", "DB_URL", "PORT"]));
  });

  it("returns an empty set for a missing file", () => {
    expect(parseEnvKeys(join(dir, "nope.env")).size).toBe(0);
  });
});

describe("appendEnvKeys", () => {
  it("creates the file and adds sorted placeholders", () => {
    const file = join(dir, "created.env");
    const added = appendEnvKeys(file, ["B_KEY", "A_KEY"]);
    expect(added).toEqual(["A_KEY", "B_KEY"]);
    expect(readFileSync(file, "utf8")).toBe("A_KEY=\nB_KEY=\n");
  });

  it("skips keys that already exist and preserves content", () => {
    const file = join(dir, "existing.env");
    writeFileSync(file, "API_KEY=secret");
    const added = appendEnvKeys(file, ["API_KEY", "NEW_KEY"]);
    expect(added).toEqual(["NEW_KEY"]);
    expect(readFileSync(file, "utf8")).toBe("API_KEY=secret\nNEW_KEY=\n");
  });

  it("returns nothing when there is no key to add", () => {
    const file = join(dir, "full.env");
    writeFileSync(file, "A=1\n");
    expect(appendEnvKeys(file, ["A"])).toEqual([]);
  });
});
