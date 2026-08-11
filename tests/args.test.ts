import { describe, it, expect } from "vitest";
import { parseArgs } from "../src/args.js";

describe("parseArgs", () => {
  it("uses sensible defaults with no arguments", () => {
    expect(parseArgs([])).toEqual({ dir: ".", envFiles: [], json: false, fix: false });
  });

  it("takes the first non-flag argument as the directory", () => {
    expect(parseArgs(["./src"]).dir).toBe("./src");
  });

  it("collects repeatable --env / -e files", () => {
    expect(parseArgs(["-e", ".env", "--env", ".env.local"]).envFiles).toEqual([
      ".env",
      ".env.local",
    ]);
  });

  it("reads the framework value after --framework / -f", () => {
    expect(parseArgs(["--framework", "vite"]).framework).toBe("vite");
    expect(parseArgs(["-f", "next"]).framework).toBe("next");
  });

  it("sets the boolean flags", () => {
    const args = parseArgs(["--json", "--github", "--strict", "--fix"]);
    expect(args).toMatchObject({ json: true, github: true, strict: true, fix: true });
  });

  it("recognizes --help and -h", () => {
    expect(parseArgs(["--help"]).help).toBe(true);
    expect(parseArgs(["-h"]).help).toBe(true);
  });

  it("recognizes --version and -v", () => {
    expect(parseArgs(["--version"]).version).toBe(true);
    expect(parseArgs(["-v"]).version).toBe(true);
  });

  it("keeps strict undefined unless passed, so config can fill it", () => {
    expect(parseArgs([]).strict).toBeUndefined();
  });
});
