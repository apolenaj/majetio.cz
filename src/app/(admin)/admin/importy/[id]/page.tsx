import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthError } from "@/lib/auth/guards";
import {
  hasPermission,
  requirePermission,
} from "@/domains/administration";
import { getImportJobDetail } from "@/domains/property-sources/admin/import-ops";
import { ImportRetryButton } from "@/components/admin/import-retry-button";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/feedback/states";

export const metadata: Metadata = {
  title: "Admin · Import job",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminImportJobDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  let actor;
  try {
    actor = await requirePermission("import.read");
  } catch (err) {
    if (err instanceof AuthError) redirect("/ucet?error=forbidden");
    throw err;
  }

  const { id } = await params;
  const { detail, error } = await getImportJobDetail(id);

  if (error) {
    return (
      <InlineAlert tone="warning" title="Import">
        {error}
      </InlineAlert>
    );
  }
  if (!detail) {
    return (
      <InlineAlert tone="warning" title="Nenalezeno">
        Job {id} neexistuje.
      </InlineAlert>
    );
  }

  const canRetry = hasPermission(actor.role, "import.retry");
  const showRetry =
    detail.opsStatus === "FAILED" ||
    detail.opsStatus === "COMPLETED_WITH_WARNINGS";

  return (
    <div className="space-y-6">
      <Link
        href="/admin/importy"
        className="text-xs text-[var(--text-link)] hover:underline"
      >
        ← Import list
      </Link>
      <PageHeader
        title={`Import · ${detail.provider}`}
        description={`${detail.opsStatus} · ${detail.sourceType} · ${detail.idempotencyKey}`}
      />

      <div className="grid gap-3 sm:grid-cols-4">
        {[
          ["Processed", detail.processedCount],
          ["Success", detail.successCount],
          ["Rejected / errors", detail.rejectedCount],
          ["Skipped", detail.skippedCount],
        ].map(([label, value]) => (
          <div
            key={String(label)}
            className="rounded-lg border border-[var(--border-default)] px-3 py-3"
          >
            <p className="text-xs text-[var(--text-muted)]">{label}</p>
            <p className="mt-1 text-xl font-semibold">{value}</p>
          </div>
        ))}
      </div>

      {showRetry ? (
        <ImportRetryButton jobId={detail.id} canRetry={canRetry} />
      ) : null}

      <section className="space-y-2">
        <h2 className="font-display text-lg">Failed records</h2>
        {detail.failedItems.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">
            Žádné FAILED items (zkontrolujte errors JSON).
          </p>
        ) : (
          <ul className="space-y-2 text-sm">
            {detail.failedItems.map((item) => (
              <li
                key={item.id}
                className="rounded border border-[var(--border-subtle)] px-3 py-2"
              >
                <p className="font-medium">
                  {item.externalPropertyId ?? item.idempotencyKey}
                </p>
                <p className="text-xs text-[var(--text-muted)]">
                  {item.errorMessage ?? "—"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {detail.errors.length > 0 ? (
        <section className="space-y-2">
          <h2 className="font-display text-lg">Error summary</h2>
          <ul className="space-y-1 text-xs text-[var(--text-muted)]">
            {detail.errors.slice(0, 40).map((e, i) => (
              <li key={`${e.at ?? i}-${e.message.slice(0, 24)}`}>
                {e.at ?? "—"} · {e.externalPropertyId ?? e.itemIdempotencyKey ?? "—"} ·{" "}
                {e.message}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
