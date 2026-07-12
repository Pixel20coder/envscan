import { describe, it, expect } from "vitest";
import { stripComments } from "../src/comments.js";

describe("stripComments", () => {
  it("removes line comments but keeps the code before them", () => {
    const out = stripComments("const a = 1; // hello");
    expect(out).toHaveLength("const a = 1; // hello".length); // offsets preserved
    expect(out.replace(/ /g, "")).toBe("consta=1;");
  });

  it("removes block comments, including multi-line ones", () => {
    const out = stripComments("a /* x\ny */ b");
    expect(out.replace(/ /g, "")).toBe("a\nb"); // comment gone, newline kept
  });

  it("preserves line numbers", () => {
    const out = stripComments("// gone\nprocess.env.KEEP");
    expect(out.split("\n")[1]).toBe("process.env.KEEP");
  });

  it("leaves comment markers inside strings alone", () => {
    const src = `const url = "https://x.dev"; const k = process.env["A//B"];`;
    expect(stripComments(src)).toBe(src);
  });

  it("respects escaped quotes inside strings", () => {
    const src = `const s = "a \\" // not a comment";`;
    expect(stripComments(src)).toBe(src);
  });
});
