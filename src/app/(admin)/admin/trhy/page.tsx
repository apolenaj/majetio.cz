import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthError } from "@/lib/auth/guards";
import { requirePermission } from "@/domains/administration";
import { buildAdminMarketsDashboard } from "@/domains/markets";
import { buildMarketReadinessRows } from "@/domains/platform/admin/market-ops";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";
import { MarketKillSwitchControls } from "@/components/admin/market-kill-switch-controls";
import { MarketLaunchControls } from "@/components/admin/platform-governance-panels";
import { InlineAlert } from "@/components/feedback/states";

export const metadata: Metadata = {
  title: "Admin · Trhy",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

const STATUS_TONE: Record<string, string> = {
  LIVE: "text-[var(--status-success)]",
  BETA: "text-[var(--status-info)]",
  RESEARCH: "text-[var(--text-secondary)]",
  PLANNED: "text-[var(--text-muted)]",
  PAUSED: "text-[var(--status-warning)]",
};

export default async function AdminMarketsPage() {
  try {
    await requirePermission("platform.markets.write");
  } catch (err) {
    if (err instanceof AuthError) redirect("/ucet?error=forbidden");
    throw err;
  }

  const dashboard = buildAdminMarketsDashboard();
  const readiness = buildMarketReadinessRows();
  const readinessByCode = new Map(
    readiness.map((r) => [r.marketCode, r] as const),
  );

  return (
    <div className="space-y-8">
      <PageHeader
        title="Trhy (Market Registry)"
        description="Readiness, translations, sources. LIVE vyžaduje validaci + step-up. Nouzové PAUSED."
      />

      <InlineAlert tone="info" title="Kill switches">
        Per-market pause (listings / valuace / leady / platby) + globální kill
        switches v /admin/nastaveni.
      </InlineAlert>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card elevation="flat">
          <p className="text-xs uppercase text-[var(--text-muted)]">Celkem</p>
          <p className="mt-2 text-2xl font-semibold">{dashboard.counts.total}</p>
        </Card>
        <Card elevation="flat">
          <p className="text-xs uppercase text-[var(--text-muted)]">LIVE</p>
          <p className="mt-2 text-2xl font-semibold">{dashboard.counts.live}</p>
        </Card>
        <Card elevation="flat">
          <p className="text-xs uppercase text-[var(--text-muted)]">
            Veřejně aktivní
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {dashboard.counts.publiclyActive}
          </p>
        </Card>
        <Card elevation="flat">
          <p className="text-xs uppercase text-[var(--text-muted)]">
            Planned / Research
          </p>
          <p className="mt-2 text-2xl font-semibold">
            {dashboard.counts.plannedOrResearch}
          </p>
        </Card>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Registry</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-default)] text-[var(--text-muted)]">
                <th className="py-2 pr-3 font-medium">Market</th>
                <th className="py-2 pr-3 font-medium">Status</th>
                <th className="py-2 pr-3 font-medium">Readiness</th>
                <th className="py-2 pr-3 font-medium">Locale / CCY</th>
                <th className="py-2 pr-3 font-medium">Public</th>
                <th className="py-2 pr-3 font-medium">Launch</th>
                <th className="py-2 pr-3 font-medium">Kill switch</th>
                <th className="py-2 font-medium">Regulatory</th>
              </tr>
            </thead>
            <tbody>
              {dashboard.rows.map((row) => {
                const ready = readinessByCode.get(row.marketCode);
                return (
                  <tr
                    key={row.marketCode}
                    className="border-b border-[var(--border-default)] align-top"
                  >
                    <td className="py-3 pr-3">
                      <p className="font-medium">
                        {row.marketCode} · {row.displayNameLocal}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        locales: {row.supportedLocales.join(", ")}
                      </p>
                    </td>
                    <td className="py-3 pr-3">
                      <span className={STATUS_TONE[row.launchStatus] ?? ""}>
                        {row.launchStatus}
                      </span>
                      <p className="text-xs text-[var(--text-muted)]">
                        enabled={String(row.enabled)}
                      </p>
                    </td>
                    <td className="py-3 pr-3">
                      <p className="font-medium text-xs">{row.launchReadiness}</p>
                      {row.launchReadinessBlocking.length > 0 ? (
                        <p className="mt-1 max-w-[14rem] text-xs text-[var(--text-muted)]">
                          {row.launchReadinessBlocking[0]}
                        </p>
                      ) : null}
                    </td>
                    <td className="py-3 pr-3">
                      <p>{row.defaultLocale}</p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {row.defaultCurrency}
                      </p>
                    </td>
                    <td className="py-3 pr-3">
                      {row.publiclyActive ? (
                        <span className="text-[var(--status-success)]">Ano</span>
                      ) : (
                        <span className="text-[var(--text-muted)]">Ne</span>
                      )}
                    </td>
                    <td className="py-3 pr-3">
                      <MarketLaunchControls
                        marketCode={row.marketCode}
                        canGoLive={ready?.canGoLive ?? false}
                        launchStatus={row.launchStatus}
                      />
                    </td>
                    <td className="py-3 pr-3">
                      <MarketKillSwitchControls
                        marketCode={row.marketCode}
                        killSwitch={row.killSwitch}
                      />
                    </td>
                    <td className="py-3 text-xs text-[var(--text-muted)]">
                      {row.regulatoryConfigVersion}
                      <p>data={String(row.hasMinimumPublicData)}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Capability Matrix</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[64rem] border-collapse text-left text-xs">
            <thead>
              <tr className="border-b border-[var(--border-default)] text-[var(--text-muted)]">
                <th className="py-2 pr-2 font-medium">Capability</th>
                {dashboard.capabilityMatrix.rows.map((r) => (
                  <th key={r.marketCode} className="py-2 px-1 font-medium">
                    {r.marketCode}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dashboard.capabilityMatrix.capabilityKeys.map((cap) => (
                <tr
                  key={cap}
                  className="border-b border-[var(--border-default)]"
                >
                  <td className="py-2 pr-2 font-medium">{cap}</td>
                  {dashboard.capabilityMatrix.rows.map((r) => (
                    <td key={r.marketCode} className="py-2 px-1">
                      {r.capabilities[cap]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
