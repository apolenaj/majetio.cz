import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { resolveBrokerContext } from "@/domains/organizations/broker-context";
import { getOrganizationListingAnalytics } from "@/domains/listing-analytics";
import { PageHeader } from "@/components/ui/page-header";

export const metadata: Metadata = {
  title: "Listing analytics",
  robots: { index: false, follow: false },
};

export default async function BrokerAnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/prihlaseni?callbackUrl=/profi/analytics");

  const ctx = await resolveBrokerContext(
    session.user.id,
    session.user.role ?? "USER",
  );
  if (!ctx.organizationId) redirect("/profi/onboarding");

  const analytics = await getOrganizationListingAnalytics({
    actor: ctx.actor,
    organizationId: ctx.organizationId,
  });

  if (!analytics.ok) {
    return <PageHeader title="Analytics" description={analytics.error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Listing analytics"
        description="Impressions, saves, inquiries — agregáty bez PII anonymních uživatelů."
      />
      <p className="text-sm text-[var(--text-muted)]">
        containsPii={String(analytics.containsPii)} · Celkem:{" "}
        {analytics.totals.impressions} impressions / {analytics.totals.saves}{" "}
        saves / {analytics.totals.inquiries} inquiries
      </p>
      <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--border-default)]">
        <table className="w-full min-w-[480px] text-left text-sm">
          <thead className="bg-[var(--background-secondary)] text-[var(--text-muted)]">
            <tr>
              <th className="px-4 py-3 font-medium">Nemovitost</th>
              <th className="px-4 py-3 font-medium">Impressions</th>
              <th className="px-4 py-3 font-medium">Saves</th>
              <th className="px-4 py-3 font-medium">Inquiries</th>
            </tr>
          </thead>
          <tbody>
            {analytics.rows.map((row) => (
              <tr
                key={row.propertyId}
                className="border-t border-[var(--border-default)]"
              >
                <td className="px-4 py-3">{row.title ?? row.slug ?? row.propertyId}</td>
                <td className="px-4 py-3">{row.impressions}</td>
                <td className="px-4 py-3">{row.saves}</td>
                <td className="px-4 py-3">{row.inquiries}</td>
              </tr>
            ))}
            {analytics.rows.length === 0 ? (
              <tr>
                <td
                  colSpan={4}
                  className="px-4 py-6 text-[var(--text-muted)]"
                >
                  Zatím žádná data.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
