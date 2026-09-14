import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthError } from "@/lib/auth/guards";
import {
  hasPermission,
  requirePermission,
} from "@/domains/administration";
import { listRenovationCatalogVersions } from "@/domains/renovation/admin/catalog-governance";
import {
  RenovationCatalogActivate,
  RenovationCatalogDraftForm,
} from "@/components/admin/analytics-governance-panels";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/feedback/states";

export const metadata: Metadata = {
  title: "Admin · Renovation Cost Catalog",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminRenovationCatalogPage() {
  let actor;
  try {
    actor = await requirePermission("analytics.models.read");
  } catch (err) {
    if (err instanceof AuthError) redirect("/ucet?error=forbidden");
    throw err;
  }

  const { items, codeVersions, error } = await listRenovationCatalogVersions();
  const canWrite = hasPermission(actor.role, "analytics.models.write");
  const canApprove = hasPermission(actor.role, "analytics.models.approve");

  return (
    <div className="space-y-6">
      <Link href="/admin/analyzy" className="text-xs text-[var(--text-link)] hover:underline">
        ← Analytics hub
      </Link>
      <PageHeader
        title="Renovation Cost Catalog"
        description="Verzovaný katalog (lokace, kvalita). Anomálie při skoku ceny ≥ 300 %."
      />
      {error ? (
        <InlineAlert tone="warning" title="Catalog">
          {error}
        </InlineAlert>
      ) : null}
      <p className="text-xs text-[var(--text-muted)]">
        Code-backed: {codeVersions.join(", ")}
      </p>

      <RenovationCatalogDraftForm canWrite={canWrite} />

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
              {v.isCurrent ? " · CURRENT" : ""} · anomalies {v.anomalyCount}
            </p>
            <RenovationCatalogActivate
              versionId={v.id}
              canApprove={canApprove}
              hasAnomalies={v.anomalyCount > 0}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
