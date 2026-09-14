import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { resolveBrokerContext } from "@/domains/organizations/broker-context";
import { getAgencyDashboard } from "@/domains/organizations/agency-dashboard";
import { VerificationBadge } from "@/components/crm/verification-badge";
import { QualifiedBuyerBadge } from "@/components/crm/qualified-buyer-badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Profi dashboard",
  robots: { index: false, follow: false },
};

export default async function BrokerDashboardPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/prihlaseni?callbackUrl=/profi");

  const ctx = await resolveBrokerContext(
    session.user.id,
    (session.user as { role?: string }).role as never ?? "USER",
  );

  if (!ctx.organizationId) {
    redirect("/profi/onboarding");
  }

  if (!ctx.membership?.onboardingCompletedAt) {
    redirect("/profi/onboarding");
  }

  const dash = await getAgencyDashboard({
    actor: ctx.actor,
    organizationId: ctx.organizationId,
  });

  if (!dash.ok) {
    return (
      <PageHeader
        title="Dashboard"
        description={dash.error}
      />
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title={dash.organization.name}
        description="Agency dashboard — metriky bez PII anonymních uživatelů."
      />

      <div className="flex flex-wrap items-center gap-3">
        <VerificationBadge status={dash.organization.verificationStatus} />
        <span className="text-sm text-[var(--text-muted)]">
          Plán {dash.organization.planKey} · {dash.listingCount}/
          {dash.organization.listingsLimit} nabídek
          {dash.overLimitCount > 0
            ? ` · ${dash.overLimitCount} OVER_LIMIT`
            : ""}
        </span>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card elevation="flat">
          <p className="text-xs uppercase text-[var(--text-muted)]">Impressions</p>
          <p className="mt-2 text-2xl font-semibold">
            {dash.analytics.totals.impressions}
          </p>
        </Card>
        <Card elevation="flat">
          <p className="text-xs uppercase text-[var(--text-muted)]">Saves</p>
          <p className="mt-2 text-2xl font-semibold">
            {dash.analytics.totals.saves}
          </p>
        </Card>
        <Card elevation="flat">
          <p className="text-xs uppercase text-[var(--text-muted)]">Inquiries</p>
          <p className="mt-2 text-2xl font-semibold">
            {dash.analytics.totals.inquiries}
          </p>
        </Card>
      </div>

      <section aria-labelledby="qbl-heading" className="space-y-3">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 id="qbl-heading" className="font-display text-xl">
              Kvalifikovaní zájemci
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              SLA response time — bez veřejného rankingu makléřů.
              {dash.qualifiedInbox.slaBreachCount > 0
                ? ` · ${dash.qualifiedInbox.slaBreachCount} po SLA`
                : ""}
            </p>
          </div>
          <ButtonLink href="/profi/leady" variant="secondary">
            Inbox
          </ButtonLink>
        </div>
        <ul className="space-y-2">
          {dash.qualifiedInbox.items.slice(0, 5).map((item) => (
            <li
              key={item.leadId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--border-default)] px-4 py-3"
            >
              <div className="flex flex-wrap items-center gap-2">
                <QualifiedBuyerBadge variant="compact" />
                <span className="text-sm text-[var(--text-secondary)]">
                  {item.anonymized.budgetBandLabelCs ?? "Rozpočet známý"}
                </span>
              </div>
              <span
                className={
                  item.slaBreached
                    ? "text-xs text-[var(--status-error)]"
                    : "text-xs text-[var(--text-muted)]"
                }
              >
                {item.slaBreached ? "SLA překročeno" : "V SLA"}
              </span>
            </li>
          ))}
          {dash.qualifiedInbox.items.length === 0 ? (
            <li className="text-sm text-[var(--text-muted)]">
              Zatím žádní kvalifikovaní zájemci.
            </li>
          ) : null}
        </ul>
      </section>

      <p className="text-xs text-[var(--text-muted)]">
        Open pipeline: {dash.openPipelineLeads} · Analytics containsPii=
        {String(dash.analytics.containsPii)} ·{" "}
        <Link href="/profi/analytics" className="underline">
          Listing analytics
        </Link>
        {" · "}
        <Link href="/profi/pipeline" className="underline">
          CRM pipeline
        </Link>
      </p>
    </div>
  );
}
