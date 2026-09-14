/**
 * Operations Attention Queue — unified "what is on fire" feed.
 */

import { prisma } from "@/lib/db";
import { listMarketKillSwitches } from "@/domains/markets/capabilities/kill-switch";
import { listStaleRegulatoryAttention } from "@/domains/platform/admin/content-governance";
import { listFeatureFlags } from "@/domains/platform/admin/feature-flags";

export const ATTENTION_SEVERITIES = [
  "CRITICAL",
  "HIGH",
  "MEDIUM",
  "INFO",
] as const;

export type AttentionSeverity = (typeof ATTENTION_SEVERITIES)[number];

export type AttentionItemType =
  | "import_failed"
  | "import_partial"
  | "dq_critical"
  | "payment_failed"
  | "payment_mismatch"
  | "stale_property"
  | "market_review_required"
  | "stale_regulatory"
  | "incident_open"
  | "kill_switch_engaged";

export type AttentionItem = {
  id: string;
  type: AttentionItemType;
  severity: AttentionSeverity;
  title: string;
  entityKind: string;
  entityId: string;
  ageMinutes: number;
  ownerLabel: string | null;
  href: string;
};

const SEVERITY_RANK: Record<AttentionSeverity, number> = {
  CRITICAL: 0,
  HIGH: 1,
  MEDIUM: 2,
  INFO: 3,
};

function ageMinutes(from: Date, now: Date): number {
  return Math.max(0, Math.floor((now.getTime() - from.getTime()) / 60_000));
}

function sortAttention(a: AttentionItem, b: AttentionItem): number {
  const s = SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity];
  if (s !== 0) return s;
  return b.ageMinutes - a.ageMinutes;
}

/**
 * Build ops attention items from existing Postgres tables (+ in-memory kill switches).
 * Returns [] on DB errors (graceful degrade).
 */
export async function buildOperationsAttentionQueue(input?: {
  limit?: number;
  now?: Date;
}): Promise<{ items: AttentionItem[]; error: string | null }> {
  const limit = input?.limit ?? 40;
  const now = input?.now ?? new Date();
  const items: AttentionItem[] = [];

  try {
    const failedJobs = await prisma.importJob.findMany({
      where: {
        status: {
          in: ["FAILED", "PARTIAL", "COMPLETED_WITH_WARNINGS"],
        },
      },
      orderBy: { createdAt: "desc" },
      take: 15,
      select: {
        id: true,
        provider: true,
        status: true,
        errorCount: true,
        createdAt: true,
        finishedAt: true,
      },
    });

    for (const job of failedJobs) {
      const when = job.finishedAt ?? job.createdAt;
      items.push({
        id: `import:${job.id}`,
        type: job.status === "FAILED" ? "import_failed" : "import_partial",
        severity: job.status === "FAILED" ? "CRITICAL" : "HIGH",
        title: `Import ${job.provider} ${job.status.toLowerCase()} (${job.errorCount} errors)`,
        entityKind: "ImportJob",
        entityId: job.id,
        ageMinutes: ageMinutes(when, now),
        ownerLabel: null,
        href: "/admin/importy",
      });
    }

    const dqCritical = await prisma.dataQualityIssue.findMany({
      where: {
        severity: "CRITICAL",
        status: { in: ["OPEN", "IN_REVIEW", "ACKNOWLEDGED"] },
      },
      orderBy: { detectedAt: "desc" },
      take: 20,
      select: {
        id: true,
        ruleCode: true,
        message: true,
        propertyId: true,
        locationId: true,
        detectedAt: true,
      },
    });

    for (const issue of dqCritical) {
      items.push({
        id: `dq:${issue.id}`,
        type: "dq_critical",
        severity: "CRITICAL",
        title: issue.message.slice(0, 120),
        entityKind: issue.propertyId
          ? "Property"
          : issue.locationId
            ? "Location"
            : "DataQualityIssue",
        entityId: issue.propertyId ?? issue.locationId ?? issue.id,
        ageMinutes: ageMinutes(issue.detectedAt, now),
        ownerLabel: issue.ruleCode,
        href: "/admin/data-quality",
      });
    }

    const failedPayments = await prisma.payment.findMany({
      where: { status: "FAILED" },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        orderId: true,
        failureMessage: true,
        createdAt: true,
      },
    });

    for (const pay of failedPayments) {
      items.push({
        id: `pay:${pay.id}`,
        type: "payment_failed",
        severity: "HIGH",
        title: pay.failureMessage
          ? `Payment failed: ${pay.failureMessage.slice(0, 80)}`
          : `Payment failed for order ${pay.orderId}`,
        entityKind: "Payment",
        entityId: pay.id,
        ageMinutes: ageMinutes(pay.createdAt, now),
        ownerLabel: null,
        href: "/admin/objednavky",
      });
    }

    // Paid orders without any entitlement — lightweight mismatch signal
    const paidWithoutEntitlement = await prisma.order.findMany({
      where: {
        status: "PAID",
        entitlements: { none: {} },
        paidAt: { not: null },
      },
      orderBy: { paidAt: "desc" },
      take: 10,
      select: { id: true, productKey: true, paidAt: true },
    });

    for (const order of paidWithoutEntitlement) {
      items.push({
        id: `mismatch:${order.id}`,
        type: "payment_mismatch",
        severity: "CRITICAL",
        title: `PAID order without entitlement (${order.productKey})`,
        entityKind: "Order",
        entityId: order.id,
        ageMinutes: ageMinutes(order.paidAt ?? now, now),
        ownerLabel: null,
        href: "/admin/objednavky",
      });
    }

    const staleProps = await prisma.property.findMany({
      where: {
        freshness: "STALE",
        status: "ACTIVE",
        isDemo: false,
      },
      orderBy: { staleMarkedAt: "desc" },
      take: 8,
      select: {
        id: true,
        slug: true,
        staleMarkedAt: true,
        lastSeenAt: true,
      },
    });

    for (const p of staleProps) {
      const when = p.staleMarkedAt ?? p.lastSeenAt ?? now;
      items.push({
        id: `stale:${p.id}`,
        type: "stale_property",
        severity: "MEDIUM",
        title: `Stale listing ${p.slug}`,
        entityKind: "Property",
        entityId: p.id,
        ageMinutes: ageMinutes(when, now),
        ownerLabel: null,
        href: `/admin/nemovitosti`,
      });
    }

    for (const ks of listMarketKillSwitches()) {
      if (!ks.reviewRequired) continue;
      items.push({
        id: `market-review:${ks.marketCode}`,
        type: "market_review_required",
        severity: "INFO",
        title: `Market ${ks.marketCode} review_required (kill switch)`,
        entityKind: "Market",
        entityId: ks.marketCode,
        ageMinutes: ageMinutes(new Date(ks.updatedAt), now),
        ownerLabel: ks.updatedBy,
        href: "/admin/trhy",
      });
    }

    const staleReg = await listStaleRegulatoryAttention(now);
    for (const c of staleReg.cms) {
      items.push({
        id: `reg-cms:${c.id}`,
        type: "stale_regulatory",
        severity: "HIGH",
        title: `Stale regulatory CMS: ${c.slug}`,
        entityKind: "CmsContent",
        entityId: c.id,
        ageMinutes: ageMinutes(c.reviewRequiredAt ?? now, now),
        ownerLabel: null,
        href: "/admin/obsah",
      });
    }
    for (const r of staleReg.rules) {
      items.push({
        id: `reg-rule:${r.id}`,
        type: "stale_regulatory",
        severity: "HIGH",
        title: `Stale rule ${r.marketCode}/${r.code}`,
        entityKind: "RegulatoryRule",
        entityId: r.id,
        ageMinutes: ageMinutes(r.reviewRequiredAt ?? now, now),
        ownerLabel: null,
        href: "/admin/obsah",
      });
    }

    try {
      const openIncidents = await prisma.platformIncident.findMany({
        where: { status: { in: ["OPEN", "INVESTIGATING"] } },
        orderBy: { createdAt: "desc" },
        take: 10,
        select: {
          id: true,
          title: true,
          severity: true,
          createdAt: true,
          category: true,
        },
      });
      for (const inc of openIncidents) {
        items.push({
          id: `incident:${inc.id}`,
          type: "incident_open",
          severity:
            inc.severity === "CRITICAL"
              ? "CRITICAL"
              : inc.severity === "HIGH"
                ? "HIGH"
                : "MEDIUM",
          title: `[${inc.category}] ${inc.title}`,
          entityKind: "PlatformIncident",
          entityId: inc.id,
          ageMinutes: ageMinutes(inc.createdAt, now),
          ownerLabel: null,
          href: "/admin/incidenty",
        });
      }
    } catch {
      // PlatformIncident table may not be migrated yet
    }

    const { items: flags } = await listFeatureFlags({ killSwitchesOnly: true });
    for (const f of flags) {
      if (!f.enabled) continue;
      items.push({
        id: `kill:${f.id}`,
        type: "kill_switch_engaged",
        severity: "CRITICAL",
        title: `Kill switch ON: ${f.key}`,
        entityKind: "FeatureFlag",
        entityId: f.id,
        ageMinutes: ageMinutes(f.updatedAt, now),
        ownerLabel: null,
        href: "/admin/nastaveni",
      });
    }

    items.sort(sortAttention);
    return { items: items.slice(0, limit), error: null };
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Nepodařilo se načíst attention queue.";
    return { items: [], error: message };
  }
}
