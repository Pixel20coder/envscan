import type { Report } from "./report.js";

/**
 * Format a report as GitHub Actions workflow commands. When printed during a
 * workflow run these surface as inline annotations on the pull request.
 * See: https://docs.github.com/actions/reference/workflow-commands-for-github-actions
 */
export function githubAnnotations(report: Report, envLabel: string, strict: boolean): string[] {
  const lines: string[] = [];

  for (const { key, usages } of report.missing) {
    const where = usages[0];
    const props = where ? ` file=${where.file},line=${where.line}` : "";
    lines.push(`::error${props}::Missing environment variable ${key}`);
  }

  for (const key of report.duplicates) {
    lines.push(`::error::Duplicate declaration of ${key} in ${envLabel}`);
  }

  for (const key of report.unused) {
    const cmd = strict ? "error" : "warning";
    lines.push(`::${cmd}::Declared but unused variable ${key}`);
  }

  return lines;
}
