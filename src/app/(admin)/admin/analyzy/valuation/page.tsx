import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthError } from "@/lib/auth/guards";
import {
  hasPermission,
  requirePermission,
} from "@/domains/administration";
import {
  listModelPerformance,
  listRecentValuations,
  listValuationModels,
} from "@/domains/valuation/admin/control-center";
import {
  ValuationModelActions,
  ValuationOverrideForm,
} from "@/components/admin/analytics-governance-panels";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/feedback/states";

export const metadata: Metadata = {
  title: "Admin · Valuation Control Center",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminValuationPage() {
  let actor;
  try {
    actor = await requirePermission("analytics.models.read");
  } catch (err) {
    if (err instanceof AuthError) redirect("/ucet?error=forbidden");
    throw err;
  }

  const [models, perf, valuations] = await Promise.all([
    listValuationModels(),
    listModelPerformance({ take: 20 }),
    listRecentValuations({ take: 15 }),
  ]);

  const canWrite = hasPermission(actor.role, "analytics.models.write");
  const canApprove = hasPermission(actor.role, "analytics.models.approve");
  const regressions = perf.items.filter((p) => p.regressionAlert);

  return (
    <div className="space-y-8">
      <Link href="/admin/analyzy" className="text-xs text-[var(--text-link)] hover:underline">
        ← Analytics hub
      </Link>
      <PageHeader
        title="Valuation Control Center"
        description="Registry DRAFT → TESTING → APPROVED → ACTIVE. Live bez APPROVED + auditu nejde."
      />

      {models.error ? (
        <InlineAlert tone="warning" title="Models">
          {models.error}
        </InlineAlert>
      ) : null}

      {regressions.length > 0 ? (
        <InlineAlert tone="warning" title="Performance regression">
          {regressions
            .map(
              (r) =>
                `${r.modelCode} ${r.marketCode}/${r.segmentKey}: ${r.regressionNote ?? "MAE worsened"}`,
            )
            .join(" · ")}
        </InlineAlert>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-display text-xl">Model registry</h2>
        <ul className="space-y-4">
          {models.items.map((m) => (
            <li
              key={m.id}
              className="space-y-2 rounded-lg border border-[var(--border-default)] p-4"
            >
              <p className="font-medium">
                {m.displayName}{" "}
                <span className="text-xs text-[var(--text-muted)]">
                  {m.code} · {m.algorithmVersion} · {m.marketCode}
                </span>
              </p>
              <p className="text-sm">
                Lifecycle: <strong>{m.lifecycleStatus}</strong>
                {m.isActive ? " · isActive" : ""}
              </p>
              <ValuationModelActions
                modelId={m.id}
                canWrite={canWrite}
                canApprove={canApprove}
              />
            </li>
          ))}
          {models.items.length === 0 ? (
            <p className="text-sm text-[var(--text-muted)]">
              Žádné registry řádky — založte ValuationModelRegistry.
            </p>
          ) : null}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">MAE / MAPE by segment</h2>
        {perf.error ? (
          <InlineAlert tone="warning" title="Performance">
            {perf.error}
          </InlineAlert>
        ) : null}
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[var(--border-default)] text-[var(--text-muted)]">
                <th className="py-2 pr-3 font-medium">Model</th>
                <th className="py-2 pr-3 font-medium">Market/Seg</th>
                <th className="py-2 pr-3 font-medium">n</th>
                <th className="py-2 pr-3 font-medium">MAE</th>
                <th className="py-2 pr-3 font-medium">MAPE %</th>
                <th className="py-2 pr-3 font-medium">Alert</th>
              </tr>
            </thead>
            <tbody>
              {perf.items.map((p) => (
                <tr key={p.id} className="border-b border-[var(--border-subtle)]">
                  <td className="py-2 pr-3">{p.modelCode}</td>
                  <td className="py-2 pr-3">
                    {p.marketCode}/{p.segmentKey}
                  </td>
                  <td className="py-2 pr-3">{p.sampleSize}</td>
                  <td className="py-2 pr-3">{Math.round(p.mae).toLocaleString("cs-CZ")}</td>
                  <td className="py-2 pr-3">{p.mape.toFixed(1)}</td>
                  <td className="py-2 pr-3">
                    {p.regressionAlert ? "YES" : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {perf.items.length === 0 ? (
            <p className="mt-2 text-sm text-[var(--text-muted)]">
              Zatím žádné performance snapshoty (recordModelPerformanceSnapshot).
            </p>
          ) : null}
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Recent valuations · override</h2>
        <ul className="space-y-4">
          {valuations.items.map((v) => (
            <li
              key={v.id}
              className="space-y-2 rounded-lg border border-[var(--border-default)] p-4"
            >
              <p className="font-medium">
                {v.property.title} ·{" "}
                {v.estimatedValue?.toLocaleString("cs-CZ") ?? "—"} Kč
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {v.type} · {v.status} · {v.modelVersion} · asking{" "}
                {v.property.askingPrice?.toLocaleString("cs-CZ") ?? "—"}
              </p>
              <Link
                href={`/admin/nemovitosti/${v.propertyId}`}
                className="text-xs text-[var(--text-link)] hover:underline"
              >
                Property · comps na detailu valuace v DB
              </Link>
              <ValuationOverrideForm
                valuationId={v.id}
                currentValue={v.estimatedValue}
                canWrite={canWrite}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
