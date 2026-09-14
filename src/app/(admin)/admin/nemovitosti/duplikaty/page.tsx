import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthError } from "@/lib/auth/guards";
import { requirePermission } from "@/domains/administration";
import { listDuplicateCandidates } from "@/domains/properties/admin/duplicates";
import { DuplicateReviewPanel } from "@/components/admin/duplicate-review-panel";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/feedback/states";

export const metadata: Metadata = {
  title: "Admin · Duplicate Review Center",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminDuplicatesPage() {
  try {
    await requirePermission("property.merge");
  } catch (err) {
    if (err instanceof AuthError) redirect("/ucet?error=forbidden");
    throw err;
  }

  const { items, error } = await listDuplicateCandidates({
    status: "PENDING",
    take: 40,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Duplicate Review Center"
        description="Candidate pairs · evidence · merge preview. Merge never hard-deletes — sources + audit + revert foundation."
      />
      <Link
        href="/admin/nemovitosti"
        className="text-xs text-[var(--text-link)] hover:underline"
      >
        ← Property list
      </Link>

      {error ? (
        <InlineAlert tone="warning" title="Duplikáty">
          {error}
        </InlineAlert>
      ) : null}

      {items.length === 0 && !error ? (
        <p className="text-sm text-[var(--text-muted)]">
          Žádní PENDING kandidáti.
        </p>
      ) : (
        <DuplicateReviewPanel items={items} />
      )}
    </div>
  );
}
