import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthError } from "@/lib/auth/guards";
import {
  hasPermission,
  requirePermission,
} from "@/domains/administration";
import { buildLeadOpsQueues } from "@/domains/leads/admin/lead-ops";
import { LeadAssignForm } from "@/components/admin/actors-governance-panels";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/feedback/states";

export const metadata: Metadata = {
  title: "Admin · Lead Operations",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminLeadsPage() {
  let actor;
  try {
    actor = await requirePermission("leads.read");
  } catch (err) {
    if (err instanceof AuthError) redirect("/ucet?error=forbidden");
    throw err;
  }

  const queues = await buildLeadOpsQueues();
  const canWrite = hasPermission(actor.role, "leads.write");

  return (
    <div className="space-y-8">
      <PageHeader
        title="Lead Operations"
        description="Mini CRM — failed submissions, unassigned, stale leads."
      />
      {queues.error ? (
        <InlineAlert tone="warning" title="Leads">
          {queues.error}
        </InlineAlert>
      ) : null}

      <section className="space-y-3">
        <h2 className="font-display text-xl">Failed submissions</h2>
        <ul className="space-y-2 text-sm">
          {queues.failedSubmissions.map((f) => (
            <li
              key={f.id}
              className="rounded border border-[var(--border-subtle)] px-3 py-2"
            >
              {f.status} · lead {f.leadId ?? "—"} · {f.errorMessage ?? "—"}
            </li>
          ))}
          {queues.failedSubmissions.length === 0 ? (
            <p className="text-[var(--text-muted)]">Žádné failed attempts.</p>
          ) : null}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Unassigned</h2>
        <ul className="space-y-3">
          {queues.unassigned.map((l) => (
            <li
              key={l.id}
              className="space-y-2 rounded border border-[var(--border-default)] px-3 py-2"
            >
              <p className="text-sm font-medium">
                {l.type} · {l.status} · {l.email ?? "no email"}
              </p>
              <p className="text-xs text-[var(--text-muted)]">
                {l.source ?? "—"} · {l.createdAt.toLocaleString("cs-CZ")}
              </p>
              <LeadAssignForm leadId={l.id} canWrite={canWrite} />
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Stale (≥ 7 dní bez update)</h2>
        <ul className="space-y-2 text-sm">
          {queues.stale.map((l) => (
            <li
              key={l.id}
              className="rounded border border-[var(--border-subtle)] px-3 py-2"
            >
              {l.type} · {l.status} · updated{" "}
              {l.updatedAt.toLocaleString("cs-CZ")} · assignee{" "}
              {l.assignedToUserId ?? "—"}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
