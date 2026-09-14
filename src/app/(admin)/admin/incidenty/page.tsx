import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthError } from "@/lib/auth/guards";
import {
  hasPermission,
  requirePermission,
} from "@/domains/administration";
import { listIncidents } from "@/domains/platform/admin/incidents";
import {
  IncidentOpenForm,
  IncidentStatusButtons,
} from "@/components/admin/platform-governance-panels";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/feedback/states";

export const metadata: Metadata = {
  title: "Admin · Incidenty",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminIncidentyPage() {
  let actor;
  try {
    actor = await requirePermission("platform.incidents.read");
  } catch (err) {
    if (err instanceof AuthError) redirect("/ucet?error=forbidden");
    throw err;
  }

  const canWrite = hasPermission(actor.role, "platform.incidents.write");
  const { items, error } = await listIncidents();

  return (
    <div className="space-y-8">
      <PageHeader
        title="Incidents"
        description="Lightweight: DATA · SECURITY · PAYMENTS · AVAILABILITY."
      />

      {error ? (
        <InlineAlert tone="warning" title="Incidents">
          {error}
        </InlineAlert>
      ) : null}

      <IncidentOpenForm canWrite={canWrite} />

      <ul className="space-y-3">
        {items.map((inc) => (
          <li
            key={inc.id}
            className="rounded-lg border border-[var(--border-default)] p-3 text-sm"
          >
            <p className="font-medium">
              [{inc.severity}] {inc.title}{" "}
              <span className="text-[var(--text-muted)]">
                · {inc.category} · {inc.status}
              </span>
            </p>
            <p className="text-[var(--text-secondary)]">{inc.summary}</p>
            <p className="text-xs text-[var(--text-muted)]">
              {inc.createdAt.toISOString()}
              {inc.marketCode ? ` · ${inc.marketCode}` : ""}
            </p>
            <IncidentStatusButtons
              incidentId={inc.id}
              canWrite={canWrite}
            />
          </li>
        ))}
        {items.length === 0 ? (
          <li className="text-[var(--text-muted)]">Žádné otevřené incidenty.</li>
        ) : null}
      </ul>
    </div>
  );
}
