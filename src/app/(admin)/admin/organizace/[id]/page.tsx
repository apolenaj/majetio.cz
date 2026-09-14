import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthError } from "@/lib/auth/guards";
import {
  hasPermission,
  requirePermission,
} from "@/domains/administration";
import { getAdminOrganizationDetail } from "@/domains/organizations/admin/org-ops";
import {
  OrgDocAccessButton,
  OrgKycPanel,
} from "@/components/admin/actors-governance-panels";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/feedback/states";

export const metadata: Metadata = {
  title: "Admin · Organization",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminOrgDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let actor;
  try {
    actor = await requirePermission("orgs.read");
  } catch (err) {
    if (err instanceof AuthError) redirect("/ucet?error=forbidden");
    throw err;
  }

  const { id } = await params;
  const { org, error } = await getAdminOrganizationDetail(id);
  if (error) {
    return (
      <InlineAlert tone="warning" title="Org">
        {error}
      </InlineAlert>
    );
  }
  if (!org) {
    return (
      <InlineAlert tone="warning" title="Nenalezeno">
        {id}
      </InlineAlert>
    );
  }

  const canVerify = hasPermission(actor.role, "orgs.verify");

  return (
    <div className="space-y-6">
      <Link
        href="/admin/organizace"
        className="text-xs text-[var(--text-link)] hover:underline"
      >
        ← Organizace
      </Link>
      <PageHeader
        title={org.name}
        description={`${org.type} · ${org.planKey} · market ${org.marketCode}`}
      />

      <div className="grid gap-3 sm:grid-cols-2 text-sm">
        <p>
          Agent KYC:{" "}
          <strong>
            {(org as { kycStatus?: string }).kycStatus ?? "PENDING"}
          </strong>
        </p>
        <p>
          Trust ladder: <strong>{org.verificationStatus}</strong>
        </p>
        <p>IČO: {org.ico ?? "—"}</p>
        <p>Listings: {org._count.properties}</p>
      </div>

      <InlineAlert tone="info" title="Oddělení verifikací">
        Agent/org KYC (tato stránka) ≠ listing verification na Property
        (`listingVerificationStatus`).
      </InlineAlert>

      <OrgKycPanel organizationId={org.id} canVerify={canVerify} />

      <section className="space-y-2">
        <h2 className="font-display text-lg">Protected documents</h2>
        <ul className="space-y-2 text-sm">
          {(
            org as {
              verificationDocuments?: Array<{
                id: string;
                fileName: string;
                sensitivity: string;
                uploadedAt: Date;
              }>;
            }
          ).verificationDocuments?.map((d) => (
            <li
              key={d.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-[var(--border-subtle)] px-3 py-2"
            >
              <span>
                {d.fileName} · {d.sensitivity} ·{" "}
                {d.uploadedAt.toLocaleString("cs-CZ")}
              </span>
              <OrgDocAccessButton documentId={d.id} canVerify={canVerify} />
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="font-display text-lg">Members</h2>
        <ul className="text-sm text-[var(--text-muted)]">
          {org.members.map((m) => (
            <li key={m.id}>
              {m.user.email ?? m.userId} · {m.role}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
