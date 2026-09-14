/**
 * Support issue taxonomy — use when triaging tickets / incidents.
 * Always ask for Correlation ID (x-request-id) or error digest from the UI.
 */

export const SUPPORT_ISSUE_CATEGORIES = [
  {
    id: "AUTH",
    label: "Přihlášení / účet",
    examples: ["Nelze se přihlásit", "Reset hesla", "E-mail change"],
    severityHint: "SEV2–SEV3",
  },
  {
    id: "CHECKOUT",
    label: "Platba / checkout",
    examples: ["Platba selhala", "Entitlement neodemčen", "Duplicitní charge"],
    severityHint: "SEV1–SEV2",
  },
  {
    id: "PROPERTY_DATA",
    label: "Data nemovitostí",
    examples: ["Špatná cena", "Duplicita", "Chybějící foto", "Stale listing"],
    severityHint: "SEV2–SEV3",
  },
  {
    id: "VALUATION",
    label: "Ocenění / analýza",
    examples: ["INSUFFICIENT_DATA", "Nesmyslný odhad", "Deep Analysis lock"],
    severityHint: "SEV2–SEV3",
  },
  {
    id: "FINANCING",
    label: "Hypotéka / lead",
    examples: ["Lead neodeslán", "Consent", "Status webhook", "Sazby"],
    severityHint: "SEV2",
  },
  {
    id: "INVESTMENT",
    label: "Investiční kalkulačka",
    examples: ["IRR/CoC nesedí", "Scénář se neuloží"],
    severityHint: "SEV3",
  },
  {
    id: "PRIVACY",
    label: "Soukromí / export / výmaz",
    examples: ["GDPR export", "Smazání účtu", "Marketing opt-out"],
    severityHint: "SEV2",
  },
  {
    id: "ADMIN_OPS",
    label: "Admin / DQ / incidenty",
    examples: ["Nelze resolve DQ", "Merge fail", "Feature flag"],
    severityHint: "SEV2–SEV3",
  },
  {
    id: "PERF",
    label: "Výkon / dostupnost",
    examples: ["Timeout", "503 maintenance", "Pomalé hledání"],
    severityHint: "SEV1–SEV2",
  },
  {
    id: "OTHER",
    label: "Ostatní",
    examples: ["UI bug", "SEO", "Nezařazené"],
    severityHint: "SEV3–SEV4",
  },
] as const;

export type SupportIssueCategoryId =
  (typeof SUPPORT_ISSUE_CATEGORIES)[number]["id"];

/**
 * Production SLO baselines (synthetic + RUM targets).
 * Wire monitors to these thresholds; adjust after first week of prod traffic.
 */
export const PERFORMANCE_SLO_BASELINES = {
  /** HTML document / SSR TTFB proxy via edge — p95 */
  http_p95_ms: {
    homepage: 800,
    search: 1200,
    property_detail: 1500,
    checkout: 1000,
    api_ready: 300,
  },
  /** Rolling 5m error rate (5xx / total) */
  error_rate_pct: {
    warn: 1,
    critical: 5,
  },
  /** Client Core Web Vitals (field) — aspirational until RUM wired */
  cwv: {
    lcp_p75_ms: 2500,
    cls_p75: 0.1,
    inp_p75_ms: 200,
  },
} as const;
