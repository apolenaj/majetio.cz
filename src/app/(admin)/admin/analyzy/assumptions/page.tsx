import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthError } from "@/lib/auth/guards";
import {
  hasPermission,
  requirePermission,
} from "@/domains/administration";
import { listAssumptionVersions } from "@/domains/investment/admin/assumptions-governance";
import {
  AssumptionDraftForm,
  AssumptionVersionActions,
} from "@/components/admin/analytics-governance-panels";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/feedback/states";

export const metadata: Metadata = {
  title: "Admin · Investment Assumptions",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminAssumptionsPage() {
  let actor;
  try {
    actor = await requirePermission("analytics.models.read");
  } catch (err) {
    if (err instanceof AuthError) redirect("/ucet?error=forbidden");
    throw err;
  }

  const { items, error } = await listAssumptionVersions();
  const canWrite = hasPermission(actor.role, "analytics.models.write");
  const canApprove = hasPermission(actor.role, "analytics.models.approve");

  return (
    <div className="space-y-6">
      <Link href="/admin/analyzy" className="text-xs text-[var(--text-link)] hover:underline">
        ← Analytics hub
      </Link>
      <PageHeader
        title="Investment Assumptions"
        description="Vacancy, maintenance, růst — každá změna = nová verze + approval. Historie se nemění."
      />
      {error ? (
        <InlineAlert tone="warning" title="Assumptions">
          {error}
        </InlineAlert>
      ) : null}

      <AssumptionDraftForm canWrite={canWrite} />

      <ul className="space-y-4">
        {items.map((v) => (
          <li
            key={v.id}
            className="space-y-2 rounded-lg border border-[var(--border-default)] p-4"
          >
            <p className="font-medium">
              {v.label}{" "}
              <span className="text-xs text-[var(--text-muted)]">
                {v.versionKey}
              </span>
            </p>
            <p className="text-sm">
              {v.approvalStatus}
              {v.isCurrent ? " · CURRENT" : ""} · from{" "}
              {v.effectiveFrom.toLocaleDateString("cs-CZ")}
            </p>
            {v.changeReason ? (
              <p className="text-xs text-[var(--text-muted)]">{v.changeReason}</p>
            ) : null}
            <AssumptionVersionActions
              versionId={v.id}
              canWrite={canWrite}
              canApprove={canApprove}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
