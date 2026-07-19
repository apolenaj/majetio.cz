import type { AccountExportPayload } from "@/lib/account/export";

/** Pure CSV serializer — kept outside "use server" so clients can import it. */
export function exportToCsv(data: AccountExportPayload): string {
  const rows: string[][] = [
    ["section", "key", "value"],
    ["meta", "exportedAt", data.exportedAt],
    ["user", "id", data.user.id],
    ["user", "email", data.user.email],
    ["user", "name", data.user.name ?? ""],
    ["user", "createdAt", data.user.createdAt],
  ];

  const flatten = (section: string, obj: unknown, prefix = "") => {
    if (obj == null) {
      rows.push([section, prefix || "value", ""]);
      return;
    }
    if (typeof obj !== "object") {
      rows.push([section, prefix || "value", String(obj)]);
      return;
    }
    if (Array.isArray(obj)) {
      rows.push([section, prefix || "count", String(obj.length)]);
      obj.forEach((item, i) => flatten(section, item, `${prefix}[${i}]`));
      return;
    }
    for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
      const path = prefix ? `${prefix}.${k}` : k;
      if (v != null && typeof v === "object") {
        flatten(section, v, path);
      } else {
        rows.push([section, path, v == null ? "" : String(v)]);
      }
    }
  };

  flatten("profile", data.profile);
  flatten("financialProfile", data.financialProfile);
  flatten("propertyPreference", data.propertyPreference);
  flatten("investmentPreference", data.investmentPreference);
  flatten("notificationPrefs", data.notificationPrefs);
  flatten("consents", data.consents);
  flatten("favourites", data.favourites);
  flatten("analyses", data.analyses);
  flatten("comparisons", data.comparisons);
  flatten("leads", data.leads);

  return rows
    .map((cols) =>
      cols
        .map((c) => {
          const escaped = c.replace(/"/g, '""');
          return `"${escaped}"`;
        })
        .join(","),
    )
    .join("\n");
}
