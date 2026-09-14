import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthError } from "@/lib/auth/guards";
import {
  hasPermission,
  requirePermission,
} from "@/domains/administration";
import { listProviderOps } from "@/domains/property-sources/admin/source-ops";
import { SourceProviderPanel } from "@/components/admin/source-provider-panel";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/feedback/states";

export const metadata: Metadata = {
  title: "Admin · Source Management",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminSourcesPage() {
  let actor;
  try {
    actor = await requirePermission("import.read");
  } catch (err) {
    if (err instanceof AuthError) redirect("/ucet?error=forbidden");
    throw err;
  }

  const { items, error } = await listProviderOps();
  const canManage = hasPermission(actor.role, "import.retry");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Source Management"
        description="Provider health (HEALTHY → DISABLED), licence, import stop / frontend hide."
      />
      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/admin/freshness"
          className="text-[var(--text-link)] hover:underline"
        >
          Data Freshness Center
        </Link>
        <Link
          href="/admin/importy"
          className="text-[var(--text-link)] hover:underline"
        >
          Import jobs
        </Link>
      </div>

      {error ? (
        <InlineAlert tone="warning" title="Zdroje">
          {error}
        </InlineAlert>
      ) : null}

      {items.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">
          Žádné PropertySource providery.
        </p>
      ) : (
        <SourceProviderPanel items={items} canManage={canManage} />
      )}
    </div>
  );
}
