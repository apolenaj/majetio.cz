import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { resolveBrokerContext } from "@/domains/organizations/broker-context";
import { listQualifiedBuyerInbox } from "@/domains/crm/qualified-buyer-inbox";
import { QualifiedBuyerBadge } from "@/components/crm/qualified-buyer-badge";
import { QualifiedBuyerInboxActions } from "@/components/broker/qualified-buyer-inbox-actions";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Kvalifikovaní zájemci",
  robots: { index: false, follow: false },
};

export default async function BrokerLeadsInboxPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/prihlaseni?callbackUrl=/profi/leady");

  const ctx = await resolveBrokerContext(
    session.user.id,
    session.user.role ?? "USER",
  );
  if (!ctx.organizationId) redirect("/profi/onboarding");

  const inbox = await listQualifiedBuyerInbox({
    actor: ctx.actor,
    organizationId: ctx.organizationId,
  });

  if (!inbox.ok) {
    return <PageHeader title="Inbox" description={inbox.error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Qualified Buyer inbox"
        description="Měříme response time (SLA). Neveřejný ranking makléřů neexistuje."
      />
      <p className="text-sm text-[var(--text-muted)]">
        publicRankingEnabled={String(inbox.publicRankingEnabled)} · SLA první
        odpovědi
      </p>
      <ul className="space-y-3">
        {inbox.items.map((item) => (
          <li
            key={item.leadId}
            className="rounded-[var(--radius-md)] border border-[var(--border-default)] px-4 py-4"
          >
            <div className="flex flex-wrap items-center gap-2">
              <QualifiedBuyerBadge variant="compact" />
              <span className="text-sm font-medium">
                {item.anonymized.budgetBandLabelCs}
              </span>
              <span className="text-xs text-[var(--text-muted)]">
                {item.status}
              </span>
            </div>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              {item.anonymized.timelineLabelCs ??
                item.anonymized.financingLabelCs}
            </p>
            <p
              className={
                item.slaBreached
                  ? "mt-2 text-xs text-[var(--status-error)]"
                  : "mt-2 text-xs text-[var(--text-muted)]"
              }
            >
              {item.slaBreached
                ? "SLA překročeno"
                : item.firstResponseAt
                  ? `Odpověď za ${Math.round((item.responseTimeMs ?? 0) / 60_000)} min`
                  : "Čeká na první odpověď"}
            </p>
            {item.status === "PENDING_AGENT_REVIEW" || !item.firstResponseAt ? (
              <QualifiedBuyerInboxActions leadId={item.leadId} />
            ) : null}
          </li>
        ))}
        {inbox.items.length === 0 ? (
          <li className="text-sm text-[var(--text-muted)]">Inbox je prázdný.</li>
        ) : null}
      </ul>
    </div>
  );
}
