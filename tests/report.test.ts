import { describe, it, expect } from "vitest";
import { buildReport } from "../src/report.js";
import type { EnvUsage } from "../src/scanner.js";

const usage = (key: string): EnvUsage => ({ key, file: "app.ts", line: 1 });

describe("buildReport", () => {
  it("flags vars used in code but not declared", () => {
    const report = buildReport([usage("API_KEY"), usage("DB_URL")], new Set(["API_KEY"]));
    expect(report.missing.map((m) => m.key)).toEqual(["DB_URL"]);
  });

  it("flags declared vars that are never used", () => {
    const report = buildReport([usage("API_KEY")], new Set(["API_KEY", "STALE"]));
    expect(report.unused).toEqual(["STALE"]);
  });

  it("ignores runtime builtins like NODE_ENV", () => {
    const report = buildReport([usage("NODE_ENV")], new Set());
    expect(report.missing).toHaveLength(0);
  });

  it("dedupes and sorts used keys", () => {
    const report = buildReport([usage("B"), usage("A"), usage("A")], new Set());
    expect(report.used).toEqual(["A", "B"]);
  });
});
