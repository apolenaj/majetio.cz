import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthError } from "@/lib/auth/guards";
import { requirePermission } from "@/domains/administration";
import { listModerationQueue } from "@/domains/properties/admin/list";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/feedback/states";

export const metadata: Metadata = {
  title: "Admin · Moderation queue",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

export default async function AdminModerationQueuePage() {
  try {
    await requirePermission("property.moderate");
  } catch (err) {
    if (err instanceof AuthError) redirect("/ucet?error=forbidden");
    throw err;
  }

  const { items, error } = await listModerationQueue({ take: 60 });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Moderation queue"
        description="Private / agent listings ve stavu PENDING_REVIEW. APPROVE · REJECT · REQUEST_CHANGES."
      />
      <Link
        href="/admin/nemovitosti"
        className="text-xs text-[var(--text-link)] hover:underline"
      >
        ← Property list
      </Link>

      {error ? (
        <InlineAlert tone="warning" title="Queue">
          {error}
        </InlineAlert>
      ) : null}

      <p className="text-xs text-[var(--text-muted)]">{items.length} položek</p>

      <ul className="space-y-3">
        {items.map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-baseline justify-between gap-2 rounded-lg border border-[var(--border-default)] px-4 py-3"
          >
            <div>
              <Link
                href={`/admin/nemovitosti/${row.id}`}
                className="font-medium text-[var(--text-link)] hover:underline"
              >
                {row.title}
              </Link>
              <p className="text-xs text-[var(--text-muted)]">
                {row.marketCode} · {row.publicCity ?? "—"} · DQ critical{" "}
                {row.criticalDqCount}
                {row.askingPrice != null
                  ? ` · ${row.askingPrice.toLocaleString("cs-CZ")} ${row.currency}`
                  : ""}
              </p>
            </div>
            <span className="text-xs text-[var(--text-muted)]">{row.status}</span>
          </li>
        ))}
      </ul>
      {items.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">Fronta je prázdná.</p>
      ) : null}
    </div>
  );
}
