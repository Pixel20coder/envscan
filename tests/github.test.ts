import { describe, it, expect } from "vitest";
import { githubAnnotations } from "../src/github.js";
import type { Report } from "../src/report.js";

const base: Report = { missing: [], optional: [], unused: [], duplicates: [], used: [] };

describe("githubAnnotations", () => {
  it("emits an error with file and line for missing vars", () => {
    const report: Report = {
      ...base,
      missing: [{ key: "API_KEY", usages: [{ key: "API_KEY", file: "src/a.ts", line: 7, optional: false }] }],
    };
    expect(githubAnnotations(report, ".env.example", false)).toEqual([
      "::error file=src/a.ts,line=7::Missing environment variable API_KEY",
    ]);
  });

  it("emits errors for duplicates and warnings for unused", () => {
    const report: Report = { ...base, duplicates: ["DB_URL"], unused: ["STALE"] };
    expect(githubAnnotations(report, ".env", false)).toEqual([
      "::error::Duplicate declaration of DB_URL in .env",
      "::warning::Declared but unused variable STALE",
    ]);
  });

  it("escalates unused to errors under strict mode", () => {
    const report: Report = { ...base, unused: ["STALE"] };
    expect(githubAnnotations(report, ".env", true)).toEqual([
      "::error::Declared but unused variable STALE",
    ]);
  });

  it("returns nothing for a clean report", () => {
    expect(githubAnnotations(base, ".env", false)).toEqual([]);
  });
});
