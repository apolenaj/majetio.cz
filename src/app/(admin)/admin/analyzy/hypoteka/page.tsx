import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthError } from "@/lib/auth/guards";
import {
  hasPermission,
  requirePermission,
} from "@/domains/administration";
import { getMortgageFeedHealth } from "@/domains/financing/admin/mortgage-ops";
import { MortgageOpsPanel } from "@/components/admin/analytics-governance-panels";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/feedback/states";

export const metadata: Metadata = {
  title: "Admin · HypotekaJasne Ops",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminHypotekaPage() {
  let actor;
  try {
    actor = await requirePermission("analytics.models.read");
  } catch (err) {
    if (err instanceof AuthError) redirect("/ucet?error=forbidden");
    throw err;
  }

  const { health, reviewQueue, error } = await getMortgageFeedHealth();
  const canWrite = hasPermission(actor.role, "analytics.models.write");
  const canApprove = hasPermission(actor.role, "analytics.models.approve");

  return (
    <div className="space-y-6">
      <Link href="/admin/analyzy" className="text-xs text-[var(--text-link)] hover:underline">
        ← Analytics hub
      </Link>
      <PageHeader
        title="Mortgage Operations · HypotekaJasne"
        description="Zdraví feedu sazeb. Při anomálii zablokuj auto-publish a vyžádej admin review."
      />
      {error ? (
        <InlineAlert tone="warning" title="Mortgage">
          {error}
        </InlineAlert>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["ACTIVE", health.activeOffers],
          ["REVIEW_REQUIRED", health.reviewRequiredOffers],
          ["STALE", health.staleOffers],
          ["INACTIVE", health.inactiveOffers],
        ].map(([label, n]) => (
          <div
            key={String(label)}
            className="rounded-lg border border-[var(--border-default)] px-3 py-3"
          >
            <p className="text-xs text-[var(--text-muted)]">{label}</p>
            <p className="mt-1 text-xl font-semibold">{n}</p>
          </div>
        ))}
      </div>

      {!health.autoPublishEnabled ? (
        <InlineAlert tone="warning" title="Auto-publish blocked">
          {health.blockedReason ?? "Feed publish je pozastaven."}
        </InlineAlert>
      ) : null}

      <MortgageOpsPanel
        autoPublishEnabled={health.autoPublishEnabled}
        canApprove={canApprove}
        canWrite={canWrite}
        reviewQueue={reviewQueue}
      />
    </div>
  );
}
