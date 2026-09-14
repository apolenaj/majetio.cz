import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { resolveBrokerContext } from "@/domains/organizations/broker-context";
import {
  listAccessibleLeads,
  LEAD_STATUS_LABELS_CS,
} from "@/domains/crm/pipeline";
import { formatCzkFromMinor } from "@/config/commerce";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "CRM pipeline",
  robots: { index: false, follow: false },
};

/**
 * Broker CRM pipeline (142–145, 185) — expected value is internal only.
 */
export default async function BrokerPipelinePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/prihlaseni?callbackUrl=/profi/pipeline");

  const ctx = await resolveBrokerContext(
    session.user.id,
    session.user.role ?? "USER",
  );
  if (!ctx.organizationId) redirect("/profi/onboarding");

  const leads = await listAccessibleLeads({
    actor: {
      userId: session.user.id,
      role: (session.user.role ?? "USER") as never,
    },
    marketCode: ctx.marketCode,
    take: 40,
  });

  const orgLeads = leads.filter(
    (l) => l.organizationId === ctx.organizationId,
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="CRM pipeline"
        description="Owner, next action a expected value (interní forecast — ne realized revenue)."
      />
      <ul className="space-y-3">
        {orgLeads.map((lead) => (
          <li key={lead.id}>
            <Card elevation="flat" className="space-y-2 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium">
                  {lead.type} · {LEAD_STATUS_LABELS_CS[lead.status] ?? lead.status}
                </p>
                <p className="text-xs text-[var(--text-muted)]">{lead.id}</p>
              </div>
              <dl className="grid gap-1 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-[var(--text-muted)]">Owner</dt>
                  <dd>{lead.ownerUserId ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">Next action</dt>
                  <dd>
                    {lead.nextActionType ?? "—"}
                    {lead.nextActionDueAt
                      ? ` · ${new Date(lead.nextActionDueAt).toLocaleDateString("cs-CZ")}`
                      : ""}
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">
                    Expected value (interní)
                  </dt>
                  <dd>
                    {lead.expectedValueMinor != null
                      ? formatCzkFromMinor(lead.expectedValueMinor)
                      : "—"}
                    <span className="ml-1 text-xs text-[var(--text-muted)]">
                      ≠ revenue
                    </span>
                  </dd>
                </div>
                <div>
                  <dt className="text-[var(--text-muted)]">Next note</dt>
                  <dd className="text-[var(--text-secondary)]">
                    {lead.nextActionNote ?? "—"}
                  </dd>
                </div>
              </dl>
            </Card>
          </li>
        ))}
        {orgLeads.length === 0 ? (
          <li className="text-sm text-[var(--text-muted)]">
            Zatím žádné CRM leady v této organizaci.
          </li>
        ) : null}
      </ul>
    </div>
  );
}
