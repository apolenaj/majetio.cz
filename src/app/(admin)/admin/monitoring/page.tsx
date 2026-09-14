import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthError } from "@/lib/auth/guards";
import {
  hasPermission,
  requirePermission,
} from "@/domains/administration";
import { buildSystemHealthReport } from "@/domains/operations/monitoring/system-health";
import {
  listDeadLetterQueue,
  listSystemJobs,
} from "@/domains/operations/jobs/job-queue";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/feedback/states";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Admin · Monitoring",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminMonitoringPage() {
  let actor;
  try {
    actor = await requirePermission("ops.health.read");
  } catch (err) {
    if (err instanceof AuthError) redirect("/ucet?error=forbidden");
    throw err;
  }

  const canJobs = hasPermission(actor.role, "ops.jobs.read");
  const report = await buildSystemHealthReport();
  const jobs = canJobs
    ? await listSystemJobs({ take: 20 })
    : { items: [], error: null };
  const dlq = canJobs
    ? await listDeadLetterQueue(10)
    : { items: [], error: null };

  return (
    <div className="space-y-8">
      <PageHeader
        title="System Health & Jobs"
        description="Komponenty (DB, queue, payments, search, providers), background jobs a DLQ."
      />

      <InlineAlert
        tone={report.overall === "UP" ? "info" : "warning"}
        title={`Overall: ${report.overall}`}
      >
        API: <code>/api/admin/health</code>, <code>/api/admin/jobs</code>,{" "}
        <code>/api/admin/repair/recalculate</code>
      </InlineAlert>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {report.components.map((c) => (
          <Card key={`${c.component}:${c.componentKey}`} elevation="flat">
            <p className="text-xs uppercase text-[var(--text-muted)]">
              {c.component}
            </p>
            <p className="mt-1 font-medium">
              {c.componentKey} · {c.status}
            </p>
            <p className="text-xs text-[var(--text-muted)]">
              {c.latencyMs != null ? `${c.latencyMs} ms` : "—"}
              {c.message ? ` · ${c.message}` : ""}
            </p>
          </Card>
        ))}
      </div>

      {canJobs ? (
        <section className="space-y-3">
          <h2 className="font-display text-xl">Recent jobs</h2>
          {jobs.error ? (
            <InlineAlert tone="warning" title="Jobs">
              {jobs.error}
            </InlineAlert>
          ) : null}
          <ul className="space-y-2 text-sm">
            {jobs.items.map((j) => (
              <li
                key={j.id}
                className="rounded border border-[var(--border-default)] px-3 py-2"
              >
                <code>{j.kind}</code> · {j.status} · attempts {j.attempts}/
                {j.maxAttempts}
                {j.lastError ? (
                  <span className="text-[var(--status-warning)]">
                    {" "}
                    · {j.lastError.slice(0, 80)}
                  </span>
                ) : null}
              </li>
            ))}
            {jobs.items.length === 0 ? (
              <li className="text-[var(--text-muted)]">Žádné joby.</li>
            ) : null}
          </ul>

          <h2 className="font-display text-xl">Dead-letter queue</h2>
          <ul className="space-y-2 text-sm">
            {dlq.items.map((d) => (
              <li key={d.id} className="text-[var(--status-warning)]">
                {d.kind} · {d.error.slice(0, 100)}
              </li>
            ))}
            {dlq.items.length === 0 ? (
              <li className="text-[var(--text-muted)]">DLQ prázdná.</li>
            ) : null}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
