/**
 * Property alert e-mail templates (BOD 74).
 * Minimal: title/location, change summary, CTA.
 * NEVER include personal financing data (income, LTV, passport amounts).
 */

import {
  buildAppAbsoluteUrl,
  sanitizeNotificationHref,
} from "./safe-href";
import type { EmailTemplate } from "@/lib/email/templates";

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layout(title: string, bodyHtml: string, bodyText: string): EmailTemplate {
  return {
    subject: title,
    text: `${title}\n\n${bodyText}\n\n—\nMajetio.cz\nTransakční e-mail. Neobsahuje citlivé finanční údaje z vašeho pasu.`,
    html: `<!DOCTYPE html>
<html lang="cs"><head><meta charset="utf-8" /><title>${escapeHtml(title)}</title></head>
<body style="margin:0;padding:24px;font-family:Arial,Helvetica,sans-serif;color:#12202e;background:#f4f6f8;">
  <table role="presentation" width="100%" style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:24px;border:1px solid #e2e8f0;">
    <tr><td>
      <p style="margin:0 0 8px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:#5b6b7c;">Majetio</p>
      <h1 style="margin:0 0 16px;font-size:20px;">${escapeHtml(title)}</h1>
      ${bodyHtml}
      <p style="margin:24px 0 0;font-size:12px;color:#5b6b7c;">
        Tento e-mail je transakční. Neobsahuje marketing ani citlivé finanční údaje (příjem, LTV, hypotéka).
      </p>
    </td></tr>
  </table>
</body></html>`,
  };
}

function cta(href: string, label: string): string {
  return `<p style="margin:20px 0;">
  <a href="${escapeHtml(href)}" style="display:inline-block;background:#0f3d3e;color:#fff;text-decoration:none;padding:12px 18px;border-radius:8px;font-weight:600;">
    ${escapeHtml(label)}
  </a>
</p>`;
}

const EVENT_LABEL: Record<string, string> = {
  NEW_PROPERTY: "Nová nabídka",
  PRICE_DROP: "Pokles ceny",
  RELISTED: "Znovu v nabídce",
};

/**
 * Instant single-property alert e-mail — no financing fields allowed in input.
 */
export function buildPropertyAlertInstantEmail(input: {
  eventKind: "NEW_PROPERTY" | "PRICE_DROP" | "RELISTED" | string;
  propertyTitle: string;
  city?: string | null;
  /** Human change line — must NOT include passport/financing personal data. */
  changeLine: string;
  path: string;
  siteOrigin: string;
}): EmailTemplate | null {
  const path = sanitizeNotificationHref(input.path);
  const absolute = buildAppAbsoluteUrl(path, input.siteOrigin);
  if (!absolute) return null;

  const kind = EVENT_LABEL[input.eventKind] ?? "Aktualizace nabídky";
  const location = input.city?.trim() ? ` · ${input.city.trim()}` : "";
  const title = `${kind}: ${input.propertyTitle}`;
  const line = `${input.propertyTitle}${location}`;

  return layout(
    title,
    `<p style="margin:0 0 8px;font-size:15px;line-height:1.5;"><strong>${escapeHtml(line)}</strong></p>
     <p style="margin:0 0 12px;font-size:15px;line-height:1.5;">${escapeHtml(input.changeLine)}</p>
     ${cta(absolute, "Zobrazit nabídku")}`,
    `${line}\n${input.changeLine}\n\n${absolute}`,
  );
}

export function buildPropertyAlertDigestEmail(input: {
  searchName: string;
  items: Array<{
    title: string;
    city?: string | null;
    eventKind: string;
    path: string;
  }>;
  /** Optional precomputed summary e.g. "5 nových, 2 poklesy". */
  summary?: string | null;
  ctaPath: string;
  siteOrigin: string;
}): EmailTemplate | null {
  const ctaPath = sanitizeNotificationHref(input.ctaPath) ?? "/ucet/ulozena-hledani";
  const absolute = buildAppAbsoluteUrl(ctaPath, input.siteOrigin);
  if (!absolute) return null;

  const count = input.items.length;
  const summary =
    input.summary?.trim() ||
    // Lazy import avoided — duplicate short count inline for template purity
    summarizeDigestKinds(input.items);
  const title = `Přehled hledání „${input.searchName}“ (${summary || count})`;
  const lines = input.items.slice(0, 20).map((i) => {
    const kind = EVENT_LABEL[i.eventKind] ?? "Nabídka";
    const loc = i.city?.trim() ? ` · ${i.city}` : "";
    return `• ${kind}: ${i.title}${loc}`;
  });

  const listHtml = input.items
    .slice(0, 20)
    .map((i) => {
      const kind = EVENT_LABEL[i.eventKind] ?? "Nabídka";
      const loc = i.city?.trim() ? ` · ${escapeHtml(i.city)}` : "";
      return `<li style="margin:0 0 8px;"><strong>${escapeHtml(kind)}</strong> — ${escapeHtml(i.title)}${loc}</li>`;
    })
    .join("");

  return layout(
    title,
    `<p style="margin:0 0 12px;font-size:15px;"><strong>${escapeHtml(summary || `${count} změn`)}</strong> k uloženému hledání.</p>
     <ul style="margin:0 0 12px;padding-left:18px;font-size:15px;line-height:1.45;">${listHtml}</ul>
     ${cta(absolute, "Otevřít uložená hledání")}`,
    `${summary || "Nové nabídky"} k „${input.searchName}“:\n${lines.join("\n")}\n\n${absolute}`,
  );
}

/** Local copy of digest kind summary (keeps template free of digest.ts cycle). */
function summarizeDigestKinds(
  items: Array<{ eventKind: string }>,
): string {
  let neu = 0;
  let drops = 0;
  let relisted = 0;
  for (const i of items) {
    if (i.eventKind === "NEW_PROPERTY") neu += 1;
    else if (i.eventKind === "PRICE_DROP") drops += 1;
    else if (i.eventKind === "RELISTED") relisted += 1;
  }
  const parts: string[] = [];
  if (neu > 0) {
    parts.push(`${neu} ${neu === 1 ? "nová" : neu < 5 ? "nové" : "nových"}`);
  }
  if (drops > 0) {
    parts.push(
      `${drops} ${drops === 1 ? "pokles" : drops < 5 ? "poklesy" : "poklesů"}`,
    );
  }
  if (relisted > 0) {
    parts.push(
      `${relisted} ${relisted === 1 ? "znovu v nabídce" : "znovu v nabídce"}`,
    );
  }
  return parts.join(", ");
}

/** Guard: reject payloads that look like financing/passport dumps. */
export function assertNoFinancingPayload(meta: Record<string, unknown>): boolean {
  const forbidden = [
    "income",
    "monthlyIncome",
    "ltv",
    "dsti",
    "passport",
    "financialProfile",
    "netSalary",
    "householdIncome",
  ];
  return !forbidden.some((k) => k in meta && meta[k] != null);
}
