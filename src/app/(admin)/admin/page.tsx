import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthError } from "@/lib/auth/guards";
import {
  requirePermission,
  buildOperationsAttentionQueue,
  buildOperationsKpis,
} from "@/domains/administration";
import { buildAdminInternalMetrics } from "@/domains/administration/service/admin-internal-metrics";
import {
  buildAdminHomeProfile,
  filterAttentionByProfile,
} from "@/lib/admin/admin-home-by-role";
import { PageHeader } from "@/components/ui/page-header";
import { OperationsAttentionQueue } from "@/components/admin/operations-attention-queue";
import { OperationsKpiStrip } from "@/components/admin/operations-kpi-strip";
import { AdminMetricsGrid } from "@/components/admin/data-table";
import { InlineAlert } from "@/components/feedback/states";

export const metadata: Metadata = {
  title: "Admin · Home",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

function pctLabel(rate: number | null): string | null {
  if (rate == null) return null;
  return `${Math.round(rate * 100)}%`;
}

export default async function AdminOperationsDashboardPage() {
  let actor;
  try {
    actor = await requirePermission("ops.dashboard.read");
  } catch (err) {
    if (err instanceof AuthError) {
      redirect("/ucet?error=forbidden");
    }
    throw err;
  }

  const profile = buildAdminHomeProfile(actor.role);

  const [queue, kpis, internal] = await Promise.all([
    buildOperationsAttentionQueue({ limit: 40 }),
    profile.showOpsKpis
      ? buildOperationsKpis()
      : Promise.resolve(null),
    profile.showInternalMetrics
      ? buildAdminInternalMetrics()
      : Promise.resolve(null),
  ]);

  const filtered = filterAttentionByProfile(queue.items, profile);
  const criticalCount = filtered.filter((i) => i.severity === "CRITICAL").length;

  return (
    <div className="admin-dense space-y-8">
      <PageHeader
        title={profile.title}
        description={`${profile.roleLabel} · ${profile.description}`}
      />

      {profile.quickLinks.length > 0 ? (
        <nav aria-label="Rychlé odkazy" className="flex flex-wrap gap-2 text-sm">
          {profile.quickLinks.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="rounded-[var(--radius-sm)] border border-[var(--border-default)] px-2.5 py-1 text-[var(--text-secondary)] hover:bg-[var(--background-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            >
              {l.label}
            </Link>
          ))}
        </nav>
      ) : null}

      {kpis ? <OperationsKpiStrip kpis={kpis} /> : null}

      {internal ? (
        <section className="space-y-2">
          {internal.error ? (
            <InlineAlert tone="warning" title="Interní metriky">
              {internal.error}
            </InlineAlert>
          ) : null}
          <AdminMetricsGrid
            title="Interní metriky"
            metrics={[
              {
                id: "completeness",
                label: "Data completeness",
                value:
                  internal.dataCompletenessPct == null
                    ? null
                    : `${internal.dataCompletenessPct}%`,
                hint:
                  internal.datasetsScored > 0
                    ? `${internal.datasetsScored} datasetů se skóre`
                    : null,
                href: "/admin/monitoring",
                tone:
                  internal.dataCompletenessPct != null &&
                  internal.dataCompletenessPct < 70
                    ? "warn"
                    : "neutral",
              },
              {
                id: "error-rate",
                label: "Job error rate (24h)",
                value: pctLabel(internal.jobErrorRate24h),
                hint:
                  internal.jobsFinished24h > 0
                    ? `${internal.jobsFinished24h} dokončených jobů`
                    : null,
                href: "/admin/monitoring",
                tone:
                  internal.jobErrorRate24h != null &&
                  internal.jobErrorRate24h > 0.1
                    ? "bad"
                    : "neutral",
              },
              {
                id: "queue-age",
                label: "Queue age",
                value:
                  internal.queueAgeMinutes == null
                    ? null
                    : `${internal.queueAgeMinutes} min`,
                hint:
                  internal.queuedJobs > 0
                    ? `${internal.queuedJobs} ve frontě`
                    : "Fronta prázdná",
                href: "/admin/monitoring",
                tone:
                  internal.queueAgeMinutes != null &&
                  internal.queueAgeMinutes > 60
                    ? "warn"
                    : "neutral",
              },
              {
                id: "queued",
                label: "Queued jobs",
                value: internal.queuedJobs,
                href: "/admin/monitoring",
              },
            ]}
          />
        </section>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 className="font-display text-xl text-[var(--text-primary)]">
            Attention queue
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            {criticalCount > 0
              ? `${criticalCount} CRITICAL · ${filtered.length} položek`
              : `${filtered.length} položek · filtrováno dle role`}
          </p>
        </div>
        <OperationsAttentionQueue items={filtered} error={queue.error} />
      </section>
    </div>
  );
}
