import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthError } from "@/lib/auth/guards";
import { requirePermission } from "@/domains/administration";
import { buildDataFreshnessCenter } from "@/domains/property-sources/admin/source-ops";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/feedback/states";

export const metadata: Metadata = {
  title: "Admin · Data Freshness Center",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminFreshnessPage() {
  try {
    await requirePermission("dataQuality.read");
  } catch (err) {
    if (err instanceof AuthError) redirect("/ucet?error=forbidden");
    throw err;
  }

  const { summary, error } = await buildDataFreshnessCenter();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Freshness Center"
        description={`Monitoring zastarávání — STALE ≥ ${summary.staleAfterDays} dní, UNAVAILABLE ≥ ${summary.unavailableAfterDays} dní.`}
      />
      <Link
        href="/admin/zdroje"
        className="text-xs text-[var(--text-link)] hover:underline"
      >
        ← Source Management
      </Link>

      {error ? (
        <InlineAlert tone="warning" title="Freshness">
          {error}
        </InlineAlert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg border border-[var(--border-default)] px-3 py-3">
          <p className="text-xs text-[var(--text-muted)]">FRESH</p>
          <p className="mt-1 text-2xl font-semibold">
            {summary.freshCount.toLocaleString("cs-CZ")}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--border-default)] px-3 py-3">
          <p className="text-xs text-[var(--text-muted)]">STALE affected</p>
          <p className="mt-1 text-2xl font-semibold">
            {summary.staleAffectedProperties.toLocaleString("cs-CZ")}
          </p>
        </div>
        <div className="rounded-lg border border-[var(--border-default)] px-3 py-3">
          <p className="text-xs text-[var(--text-muted)]">UNAVAILABLE affected</p>
          <p className="mt-1 text-2xl font-semibold">
            {summary.unavailableAffectedProperties.toLocaleString("cs-CZ")}
          </p>
        </div>
      </div>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Alerts · dopad</h2>
        {summary.alerts.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            Žádné freshness alerty.
          </p>
        ) : (
          <ul className="space-y-3">
            {summary.alerts.map((a) => (
              <li
                key={a.code}
                className="rounded-lg border border-[var(--border-default)] px-4 py-3"
              >
                <p className="text-xs uppercase text-[var(--text-muted)]">
                  {a.severity} · {a.code}
                </p>
                <p className="mt-1 text-sm">{a.message}</p>
                <p className="mt-1 text-xs text-[var(--text-muted)]">
                  Affected: {a.affectedCount.toLocaleString("cs-CZ")}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
