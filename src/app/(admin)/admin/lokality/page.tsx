import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthError } from "@/lib/auth/guards";
import {
  hasPermission,
  requirePermission,
} from "@/domains/administration";
import { listLocationMetricAnomalies } from "@/domains/locations/admin/location-ops";
import { LocationOpsForms } from "@/components/admin/analytics-governance-panels";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/feedback/states";

export const metadata: Metadata = {
  title: "Admin · Location Intelligence",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLocationsPage() {
  let actor;
  try {
    actor = await requirePermission("analytics.models.read");
  } catch (err) {
    if (err instanceof AuthError) redirect("/ucet?error=forbidden");
    throw err;
  }

  const { items, error } = await listLocationMetricAnomalies({ take: 40 });
  const canWrite = hasPermission(actor.role, "analytics.models.write");

  return (
    <div className="space-y-6">
      <Link href="/admin/analyzy" className="text-xs text-[var(--text-link)] hover:underline">
        ← Analytics hub
      </Link>
      <PageHeader
        title="Location Intelligence ops"
        description="Opravy mapování property→location a fronta metrik s reviewRequired (price trend errors)."
      />
      {error ? (
        <InlineAlert tone="warning" title="Lokality">
          {error}
        </InlineAlert>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-display text-xl">Metric anomalies</h2>
        <ul className="space-y-2 text-sm">
          {items.map((m) => (
            <li
              key={m.id}
              className="rounded border border-[var(--border-subtle)] px-3 py-2"
            >
              <p className="font-medium">
                {m.metricKey} · {m.value.toLocaleString("cs-CZ")}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {m.id} · {m.locationSlug ?? m.locationId} · {m.period} ·{" "}
                {m.freshness}
              </p>
            </li>
          ))}
          {items.length === 0 ? (
            <p className="text-[var(--text-muted)]">Žádné reviewRequired metriky.</p>
          ) : null}
        </ul>
      </section>

      <LocationOpsForms canWrite={canWrite} />
    </div>
  );
}
