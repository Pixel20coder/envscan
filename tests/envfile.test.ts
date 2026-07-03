import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { writeFileSync, rmSync, mkdtempSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { parseEnvKeys } from "../src/envfile.js";

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
