import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthError } from "@/lib/auth/guards";
import {
  hasPermission,
  requirePermission,
} from "@/domains/administration";
import {
  buildPricingPreview,
  listPricingPlansAdmin,
} from "@/domains/commerce/admin/pricing-governance";
import { PricingGovernanceForms } from "@/components/admin/actors-governance-panels";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/feedback/states";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Admin · Pricing Governance",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminPricingPage() {
  let actor;
  try {
    actor = await requirePermission("pricing.read");
  } catch (err) {
    if (err instanceof AuthError) redirect("/ucet?error=forbidden");
    throw err;
  }

  const { items, error } = await listPricingPlansAdmin();
  const canWrite = hasPermission(actor.role, "pricing.write");
  const canApprove = hasPermission(actor.role, "pricing.approve");
  const draft = items.find((p) => p.status === "DRAFT");

  let preview = null as ReturnType<typeof buildPricingPreview> | null;
  if (draft) {
    const full = await prisma.pricingPlan.findUnique({
      where: { id: draft.id },
    });
    if (full) {
      preview = buildPricingPreview(full);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pricing Governance"
        description="Nová verze + effective date + preview + draft → active. Historické sold prices se nemění."
      />
      {error ? (
        <InlineAlert tone="warning" title="Pricing">
          {error}
        </InlineAlert>
      ) : null}

      {preview ? (
        <InlineAlert tone="info" title="Preview (selected draft)">
          {preview.headline} · effective {preview.effectiveFromIso}
          {preview.warnings.length
            ? ` · ${preview.warnings.join(" · ")}`
            : ""}
        </InlineAlert>
      ) : null}

      <PricingGovernanceForms
        canWrite={canWrite}
        canApprove={canApprove}
        draftPlanId={draft?.id}
      />

      <div className="overflow-x-auto">
        <table className="w-full min-w-[48rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)] text-[var(--text-muted)]">
              <th className="py-2 pr-3 font-medium">Plan</th>
              <th className="py-2 pr-3 font-medium">Version</th>
              <th className="py-2 pr-3 font-medium">Status</th>
              <th className="py-2 pr-3 font-medium">Price</th>
              <th className="py-2 pr-3 font-medium">Effective</th>
            </tr>
          </thead>
          <tbody>
            {items.map((p) => (
              <tr key={p.id} className="border-b border-[var(--border-subtle)]">
                <td className="py-2 pr-3">
                  {p.name}
                  <p className="text-xs text-[var(--text-muted)]">
                    {p.key} · {p.marketCode}
                  </p>
                </td>
                <td className="py-2 pr-3">{p.versionKey}</td>
                <td className="py-2 pr-3">{p.status}</td>
                <td className="py-2 pr-3">
                  {(p.priceGrossMinor / 100).toLocaleString("cs-CZ")}{" "}
                  {p.currency}
                </td>
                <td className="py-2 pr-3">
                  {p.activeFrom.toLocaleDateString("cs-CZ")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
