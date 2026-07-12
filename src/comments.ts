/**
 * Blank out `//` line comments and block comments from source, replacing their
 * characters with spaces so byte offsets and line numbers stay identical.
 *
 * String and template literals are preserved verbatim, so comment markers that
 * live inside strings (and things like `process.env["KEY"]`) are left alone.
 */
export function stripComments(src: string): string {
  type State = "code" | "line" | "block" | "sq" | "dq" | "tpl";
  let state: State = "code";
  let out = "";

  for (let i = 0; i < src.length; i++) {
    const ch = src[i]!;
    const next = src[i + 1];

    switch (state) {
      case "code":
        if (ch === "/" && next === "/") { state = "line"; out += "  "; i++; }
        else if (ch === "/" && next === "*") { state = "block"; out += "  "; i++; }
        else if (ch === "'") { state = "sq"; out += ch; }
        else if (ch === '"') { state = "dq"; out += ch; }
        else if (ch === "`") { state = "tpl"; out += ch; }
        else out += ch;
        break;

      case "line":
        if (ch === "\n") { state = "code"; out += ch; }
        else out += " ";
        break;

      case "block":
        if (ch === "*" && next === "/") { state = "code"; out += "  "; i++; }
        else out += ch === "\n" ? "\n" : " ";
        break;

      // Inside a string: copy verbatim, respect escapes, and close on the quote.
      case "sq":
      case "dq":
      case "tpl": {
        out += ch;
        if (ch === "\\" && i + 1 < src.length) { out += src[i + 1]; i++; break; }
        const close = state === "sq" ? "'" : state === "dq" ? '"' : "`";
        if (ch === close) state = "code";
        break;
      }
    }
  }
  return out;
}
