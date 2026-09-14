/**
 * Alert rule definitions — thresholds for payments / imports / auth / queue.
 * Used by admin health + external monitors (docs/DISASTER_RECOVERY.md).
 * Dedup keys prevent alert storms (same fingerprint within window).
 */

export type AlertSeverity = "SEV1" | "SEV2" | "SEV3" | "SEV4";

export type AlertRule = {
  id: string;
  title: string;
  severity: AlertSeverity;
  /** Metric / probe description */
  condition: string;
  threshold: string;
  /** Minutes before re-notify for the same fingerprint */
  dedupeWindowMin: number;
  fingerprint: string;
  notify: ("oncall" | "commerce" | "data" | "security")[];
};

/** Canonical production alert catalogue — wire to pager/Slack via ERROR_TRACKER_WEBHOOK_URL or vendor. */
export const ALERT_RULES: readonly AlertRule[] = [
  {
    id: "payments.failed_burst",
    title: "Payment failures elevated",
    severity: "SEV1",
    condition: "Payment.status=FAILED count in 24h",
    threshold: "> 50 (matches system-health DEGRADED) OR > 10 in 15m",
    dedupeWindowMin: 30,
    fingerprint: "payments:failed_burst",
    notify: ["oncall", "commerce"],
  },
  {
    id: "payments.webhook_reject_storm",
    title: "Payment webhook signature rejects",
    severity: "SEV1",
    condition: "auditWebhookForgery payments count",
    threshold: "> 20 in 10m",
    dedupeWindowMin: 20,
    fingerprint: "payments:webhook_forgery",
    notify: ["oncall", "security"],
  },
  {
    id: "import.job_dlq",
    title: "Import / system job dead-letter",
    severity: "SEV2",
    condition: "SystemJobDeadLetter unrequeued",
    threshold: "dlq > 0 sustained 15m OR failed > 20",
    dedupeWindowMin: 45,
    fingerprint: "ops:dlq",
    notify: ["oncall", "data"],
  },
  {
    id: "auth.lockout_burst",
    title: "Auth failure lockout burst",
    severity: "SEV2",
    condition: "auditAuthFailureBurst / AuthRateLimit locks",
    threshold: "> 50 distinct keys locked in 1h",
    dedupeWindowMin: 60,
    fingerprint: "auth:lockout_burst",
    notify: ["oncall", "security"],
  },
  {
    id: "auth.login_outage",
    title: "Login success rate collapsed",
    severity: "SEV1",
    condition: "login_succeeded / (login_succeeded+login_failed) rolling 15m",
    threshold: "< 20% with sample >= 30",
    dedupeWindowMin: 15,
    fingerprint: "auth:login_outage",
    notify: ["oncall"],
  },
  {
    id: "health.database_down",
    title: "Database probe DOWN",
    severity: "SEV1",
    condition: "GET /api/ready OR admin health DATABASE",
    threshold: "status != ready / DOWN for 2 consecutive checks",
    dedupeWindowMin: 10,
    fingerprint: "health:database",
    notify: ["oncall"],
  },
  {
    id: "health.overall_down",
    title: "Admin health overall DOWN",
    severity: "SEV1",
    condition: "buildSystemHealthReport().overall",
    threshold: "DOWN",
    dedupeWindowMin: 10,
    fingerprint: "health:overall",
    notify: ["oncall"],
  },
  {
    id: "revenue.reconcile_failed",
    title: "Nightly revenue reconcile failed",
    severity: "SEV2",
    condition: "GitHub Actions revenue-reconcile.yml",
    threshold: "workflow conclusion=failure",
    dedupeWindowMin: 120,
    fingerprint: "revenue:reconcile",
    notify: ["oncall", "commerce"],
  },
] as const;

export type SyntheticCheck = {
  id: string;
  name: string;
  urlPath: string;
  method: "GET";
  expectStatus: number;
  /** Response body must include (substring) when set */
  expectBodyIncludes?: string;
  intervalMin: number;
  locations: "eu" | "multi";
  alertRuleId: string;
};

/** Synthetic monitoring catalogue — configure in uptime vendor (Checkly / Better Stack). */
export const SYNTHETIC_CHECKS: readonly SyntheticCheck[] = [
  {
    id: "synth.liveness",
    name: "Public liveness",
    urlPath: "/api/health",
    method: "GET",
    expectStatus: 200,
    expectBodyIncludes: '"status":"ok"',
    intervalMin: 1,
    locations: "eu",
    alertRuleId: "health.overall_down",
  },
  {
    id: "synth.readiness",
    name: "Public readiness (DB)",
    urlPath: "/api/ready",
    method: "GET",
    expectStatus: 200,
    expectBodyIncludes: '"status":"ready"',
    intervalMin: 1,
    locations: "eu",
    alertRuleId: "health.database_down",
  },
  {
    id: "synth.homepage",
    name: "Homepage HTML",
    urlPath: "/",
    method: "GET",
    expectStatus: 200,
    intervalMin: 5,
    locations: "eu",
    alertRuleId: "health.overall_down",
  },
  {
    id: "synth.login",
    name: "Login page",
    urlPath: "/prihlaseni",
    method: "GET",
    expectStatus: 200,
    intervalMin: 5,
    locations: "eu",
    alertRuleId: "auth.login_outage",
  },
  {
    id: "synth.pricing",
    name: "Pricing page",
    urlPath: "/cenik",
    method: "GET",
    expectStatus: 200,
    intervalMin: 5,
    locations: "eu",
    alertRuleId: "health.overall_down",
  },
] as const;

/** In-memory dedupe for process-local alert emission (jobs / admin cron). */
const recentFingerprints = new Map<string, number>();

export function shouldEmitAlert(
  fingerprint: string,
  dedupeWindowMin: number,
  now = Date.now(),
): boolean {
  const prev = recentFingerprints.get(fingerprint);
  if (prev != null && now - prev < dedupeWindowMin * 60_000) {
    return false;
  }
  recentFingerprints.set(fingerprint, now);
  return true;
}

export function resetAlertDedupeForTests(): void {
  recentFingerprints.clear();
}

export function getAlertRule(id: string): AlertRule | undefined {
  return ALERT_RULES.find((r) => r.id === id);
}
