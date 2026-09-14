import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthError } from "@/lib/auth/guards";
import { requirePermission } from "@/domains/administration";
import { listAdminOrganizations } from "@/domains/organizations/admin/org-ops";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/feedback/states";

export const metadata: Metadata = {
  title: "Admin · Organizace",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function param(sp: Record<string, string | string[] | undefined>, key: string) {
  const v = sp[key];
  return typeof v === "string" ? v : undefined;
}

export default async function AdminOrgsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  try {
    await requirePermission("orgs.read");
  } catch (err) {
    if (err instanceof AuthError) redirect("/ucet?error=forbidden");
    throw err;
  }

  const sp = await searchParams;
  const { items, error } = await listAdminOrganizations({
    kycStatus: param(sp, "kyc"),
    take: 50,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Organizace (B2B)"
        description="Makléři, RK, developeři — legal/plan/listings. Agent KYC ≠ listing verification."
      />

      <form method="get" className="flex gap-3">
        <select
          name="kyc"
          defaultValue={param(sp, "kyc") ?? ""}
          className="rounded border border-[var(--border-default)] bg-[var(--surface-0)] px-2 py-1.5 text-sm"
        >
          <option value="">KYC vše</option>
          <option value="PENDING">PENDING</option>
          <option value="VERIFIED">VERIFIED</option>
          <option value="REJECTED">REJECTED</option>
        </select>
        <button
          type="submit"
          className="rounded bg-[var(--text-primary)] px-3 py-1.5 text-sm text-[var(--surface-0)]"
        >
          Filtrovat
        </button>
      </form>

      {error ? (
        <InlineAlert tone="warning" title="Orgs">
          {error}
        </InlineAlert>
      ) : null}

      <ul className="space-y-3">
        {items.map((o) => (
          <li
            key={o.id}
            className="rounded-lg border border-[var(--border-default)] px-4 py-3"
          >
            <Link
              href={`/admin/organizace/${o.id}`}
              className="font-medium text-[var(--text-link)] hover:underline"
            >
              {o.name}
            </Link>
            <p className="text-xs text-[var(--text-muted)]">
              {o.type} · plan {o.planKey}/{o.planStatus} · KYC {o.kycStatus} ·
              trust {o.verificationStatus} · IČO {o.ico ?? "—"} ·{" "}
              {o.listingsCount} listings · {o.marketCode}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
