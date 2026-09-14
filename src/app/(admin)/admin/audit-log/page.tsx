import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { isAdmin } from "@/lib/auth/roles";
import {
  listMonetizationAuditLogs,
  MONETIZATION_AUDIT_ACTIONS,
} from "@/domains/revenue";
import { PageHeader } from "@/components/ui/page-header";
import { track } from "@/lib/analytics/events";

export const metadata: Metadata = {
  title: "Admin · Audit log",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ action?: string }>;
};

export default async function AdminAuditLogPage({ searchParams }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/prihlaseni?callbackUrl=/admin/audit-log");
  }
  if (!session.user.role || !isAdmin(session.user.role)) {
    redirect("/ucet");
  }

  const params = await searchParams;
  const filterAction = params.action?.trim() || null;
  const actions =
    filterAction &&
    (MONETIZATION_AUDIT_ACTIONS as readonly string[]).includes(filterAction)
      ? [filterAction]
      : undefined;

  const rows = await listMonetizationAuditLogs({ take: 100, actions });

  track({
    name: "admin_audit_log_viewed",
    props: {
      row_count_bucket:
        rows.length === 0 ? "0" : rows.length <= 20 ? "1-20" : "21+",
    },
  });

  return (
    <div className="space-y-8">
      <PageHeader
        title="Audit log"
        description="Ceny, manuální přístupy, success fee validace, refundy, reconciliation a fraud blokace (207 / 210)."
      />

      <div className="flex flex-wrap gap-2 text-sm">
        <a
          href="/admin/audit-log"
          className={
            !filterAction
              ? "font-medium underline"
              : "text-[var(--text-secondary)]"
          }
        >
          Vše
        </a>
        {MONETIZATION_AUDIT_ACTIONS.map((action) => (
          <a
            key={action}
            href={`/admin/audit-log?action=${encodeURIComponent(action)}`}
            className={
              filterAction === action
                ? "font-medium underline"
                : "text-[var(--text-secondary)]"
            }
          >
            {action}
          </a>
        ))}
      </div>

      <ul className="space-y-2 text-sm">
        {rows.map((row) => (
          <li
            key={row.id}
            className="rounded-[var(--radius-md)] border border-[var(--border-default)] px-3 py-3"
          >
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="font-medium">{row.action}</span>
              <time className="text-xs text-[var(--text-muted)]">
                {row.createdAt.toISOString()}
              </time>
            </div>
            <p className="mt-1 text-[var(--text-secondary)]">
              {row.entity}
              {row.entityId ? ` · ${row.entityId}` : ""}
              {row.actorId ? ` · actor ${row.actorId.slice(0, 8)}…` : ""}
            </p>
            {row.meta != null ? (
              <pre className="mt-2 overflow-x-auto text-xs text-[var(--text-muted)]">
                {JSON.stringify(row.meta, null, 0)}
              </pre>
            ) : null}
          </li>
        ))}
        {rows.length === 0 ? (
          <li className="text-[var(--text-muted)]">Žádné záznamy.</li>
        ) : null}
      </ul>

      <p className="text-xs text-[var(--text-muted)]">
        Související:{" "}
        <a href="/admin/monetizace" className="underline underline-offset-2">
          Monetizace
        </a>
      </p>
    </div>
  );
}
