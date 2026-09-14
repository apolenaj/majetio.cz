import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { formatCzkFromMinor } from "@/config/commerce";
import {
  getMonetizationDashboardMetrics,
  listMonetizationAuditLogs,
} from "@/domains/revenue";
import {
  estimateCustomerLtvMinor,
  estimateCacMinor,
  ltvToCacRatio,
  resolveCacInputs,
  assertLtvDoesNotUseGmv,
  LTV_CAC_GUARDRAILS,
} from "@/domains/revenue/ltv-cac";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { track } from "@/lib/analytics/events";

export const metadata: Metadata = {
  title: "Admin · Monetizace",
  robots: { index: false, follow: false },
};

export default async function AdminMonetizationPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/prihlaseni?callbackUrl=/admin/monetizace");
  const role = session.user.role ?? "USER";
  if (role !== "ADMIN" && role !== "SUPER_ADMIN" && role !== "SALES") {
    redirect("/ucet");
  }

  const metrics = await getMonetizationDashboardMetrics();
  const audits = await listMonetizationAuditLogs({ take: 15 });

  const cacInputs = resolveCacInputs({
    newPayingCustomers: metrics.newPayingCustomers,
  });
  const ltvGuard = assertLtvDoesNotUseGmv({
    avgMonthlyRevenueMinor: metrics.mrrMinor,
    gmvMinor: metrics.gmvMinor,
    label: "admin_dashboard",
  });
  const ltv = estimateCustomerLtvMinor({
    avgMonthlyRevenueMinor: ltvGuard.ok ? metrics.mrrMinor : 0,
    grossMargin: LTV_CAC_GUARDRAILS.defaultGrossMargin,
    monthlyChurnRate: LTV_CAC_GUARDRAILS.defaultMonthlyChurnRate,
  });
  const cac = estimateCacMinor(cacInputs);
  const ratio = ltvToCacRatio(ltv.ltvMinor, cac.cacMinor);

  track({
    name: "admin_monetization_dashboard_viewed",
    props: {
      has_mrr: metrics.mrrMinor > 0,
      has_gmv: metrics.gmvMinor > 0,
    },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Monetizace"
        description="MRR/ARR (recurring snapshot), GMV ≠ revenue, one-time sales. Ledger je zdroj pravdy."
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card elevation="flat">
          <p className="text-xs uppercase text-[var(--text-muted)]">MRR</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatCzkFromMinor(metrics.mrrMinor)}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {metrics.definitions.mrr}
          </p>
        </Card>
        <Card elevation="flat">
          <p className="text-xs uppercase text-[var(--text-muted)]">ARR</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatCzkFromMinor(metrics.arrMinor)}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {metrics.definitions.arr}
          </p>
        </Card>
        <Card elevation="flat">
          <p className="text-xs uppercase text-[var(--text-muted)]">GMV</p>
          <p className="mt-2 text-2xl font-semibold">
            {formatCzkFromMinor(metrics.gmvMinor)}
          </p>
          <p className="mt-1 text-xs text-[var(--status-warning)]">
            Není revenue — {metrics.definitions.gmv}
          </p>
        </Card>
        <Card elevation="flat">
          <p className="text-xs uppercase text-[var(--text-muted)]">
            One-time sales
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {formatCzkFromMinor(metrics.oneTimeSalesMinor)}
          </p>
          <p className="mt-1 text-xs text-[var(--text-muted)]">
            {metrics.definitions.oneTime}
          </p>
        </Card>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card elevation="flat">
          <p className="text-xs uppercase text-[var(--text-muted)]">
            Recognized revenue
          </p>
          <p className="mt-2 text-xl font-semibold">
            {formatCzkFromMinor(metrics.recognizedRevenueMinor)}
          </p>
        </Card>
        <Card elevation="flat">
          <p className="text-xs uppercase text-[var(--text-muted)]">
            Success fee revenue
          </p>
          <p className="mt-2 text-xl font-semibold">
            {formatCzkFromMinor(metrics.successFeeRevenueMinor)}
          </p>
        </Card>
        <Card elevation="flat">
          <p className="text-xs uppercase text-[var(--text-muted)]">
            Marketplace GMV proxy
          </p>
          <p className="mt-2 text-xl font-semibold">
            {formatCzkFromMinor(metrics.marketplaceGmvMinor)}
          </p>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl">LTV / CAC základy (153 / 154)</h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card elevation="flat">
            <p className="text-xs uppercase text-[var(--text-muted)]">
              LTV (odhad)
            </p>
            <p className="mt-2 text-xl font-semibold">
              {formatCzkFromMinor(ltv.ltvMinor)}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">{ltv.formula}</p>
          </Card>
          <Card elevation="flat">
            <p className="text-xs uppercase text-[var(--text-muted)]">CAC</p>
            <p className="mt-2 text-xl font-semibold">
              {cac.cacMinor > 0 ? formatCzkFromMinor(cac.cacMinor) : "—"}
            </p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Spend {formatCzkFromMinor(cacInputs.marketingSpendMinor)} /{" "}
              {cacInputs.newPayingCustomers} nových platících
            </p>
          </Card>
          <Card elevation="flat">
            <p className="text-xs uppercase text-[var(--text-muted)]">
              LTV : CAC
            </p>
            <p className="mt-2 text-xl font-semibold">{ratio ?? "—"}</p>
            <p className="mt-1 text-xs text-[var(--text-muted)]">
              Cíl ≥ {LTV_CAC_GUARDRAILS.healthyLtvCacMin}. GMV se do LTV{" "}
              {LTV_CAC_GUARDRAILS.forbidGmvAsLtvInput ? "nesmí" : "smí"} použít.
            </p>
          </Card>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          CAC spend: env <code>MARKETING_SPEND_MINOR_30D</code>. Noví platící:
          PAID orders v okně (override <code>NEW_PAYING_CUSTOMERS_30D</code>).
        </p>
      </section>

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="font-display text-xl">Monetization audit</h2>
          <a
            href="/admin/audit-log"
            className="text-sm text-[var(--text-secondary)] underline-offset-2 hover:underline"
          >
            Celý audit log →
          </a>
        </div>
        <ul className="space-y-2 text-sm">
          {audits.map((a) => (
            <li
              key={a.id}
              className="rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 py-2"
            >
              <span className="font-medium">{a.action}</span> · {a.entity}{" "}
              {a.entityId ? `(${a.entityId.slice(0, 8)}…)` : ""} ·{" "}
              {a.createdAt.toISOString()}
            </li>
          ))}
          {audits.length === 0 ? (
            <li className="text-[var(--text-muted)]">Zatím bez záznamů.</li>
          ) : null}
        </ul>
      </section>

      <p className="text-xs text-[var(--text-muted)]">
        {metrics.definitions.revenueVsGmv} · okno {metrics.windowFrom} →{" "}
        {metrics.windowTo} · asOf {metrics.asOf}
      </p>
    </div>
  );
}
