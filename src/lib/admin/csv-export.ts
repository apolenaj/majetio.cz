/**
 * Admin CSV export with formula-injection protection (203–206).
 */

/** Prefix that neutralizes spreadsheet formula execution. */
const FORMULA_PREFIX = "'";

export function sanitizeCsvCell(value: unknown): string {
  if (value == null) return "";
  let text = String(value);
  // Normalize newlines inside cells
  text = text.replace(/\r\n|\r|\n/g, " ");
  const trimmed = text.trimStart();
  if (/^[=+\-@\t\r]/.test(trimmed)) {
    text = `${FORMULA_PREFIX}${text}`;
  }
  return text;
}

export function escapeCsvCell(value: unknown): string {
  const sanitized = sanitizeCsvCell(value);
  const escaped = sanitized.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function buildAdminCsv(input: {
  headers: string[];
  rows: Array<Array<unknown>>;
}): string {
  const lines = [
    input.headers.map(escapeCsvCell).join(","),
    ...input.rows.map((row) => row.map(escapeCsvCell).join(",")),
  ];
  // BOM helps Excel open UTF-8 correctly; does not affect sanitization
  return `\uFEFF${lines.join("\n")}`;
}

export type AdminExportPreview = {
  rowCount: number;
  headers: string[];
  sampleRows: string[][];
  warnings: string[];
};

/** Dry-run style preview before download. */
export function previewAdminCsv(input: {
  headers: string[];
  rows: Array<Array<unknown>>;
  sampleSize?: number;
}): AdminExportPreview {
  const sampleSize = input.sampleSize ?? 5;
  const warnings: string[] = [];
  for (const row of input.rows) {
    for (const cell of row) {
      const raw = cell == null ? "" : String(cell);
      if (/^[=+\-@]/.test(raw.trimStart())) {
        warnings.push(
          "Some cells start with formula characters and will be sanitized.",
        );
        break;
      }
    }
    if (warnings.length) break;
  }
  return {
    rowCount: input.rows.length,
    headers: input.headers,
    sampleRows: input.rows
      .slice(0, sampleSize)
      .map((r) => r.map((c) => sanitizeCsvCell(c))),
    warnings,
  };
}
