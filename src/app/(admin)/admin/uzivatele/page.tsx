import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthError } from "@/lib/auth/guards";
import {
  requirePermission,
  roleHasPermission,
} from "@/domains/administration";
import { listAdminUsers } from "@/domains/users/admin/user-ops";
import {
  adminTableSkip,
  parseAdminTableState,
} from "@/lib/admin/url-table-state";
import { AdminManualEntitlementsPanel } from "@/components/admin/admin-manual-entitlements-panel";
import { AdminUsersDataTable } from "@/components/admin/admin-users-data-table";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/feedback/states";

export const metadata: Metadata = {
  title: "Admin · Uživatelé",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  let actor;
  try {
    actor = await requirePermission("users.read");
  } catch (err) {
    if (err instanceof AuthError) redirect("/ucet?error=forbidden");
    throw err;
  }

  const sp = await searchParams;
  const table = parseAdminTableState(sp, {
    defaultSort: "createdAt",
    defaultOrder: "desc",
    filterKeys: ["q", "status"],
  });

  const { items, total, error } = await listAdminUsers({
    q: table.filters.q,
    status: table.filters.status,
    take: table.pageSize,
    skip: adminTableSkip(table),
    sort: table.sort,
    order: table.order,
  });

  return (
    <div className="admin-dense space-y-6">
      <PageHeader
        title="Uživatelé"
        description="Dense tabulka · URL filtry/sort/page · bulk s důvodem · CSV sanitizace."
      />

      <form method="get" className="flex flex-wrap gap-2 text-sm" role="search">
        <label className="sr-only" htmlFor="users-q">
          Hledat
        </label>
        <input
          id="users-q"
          name="q"
          defaultValue={table.filters.q ?? ""}
          placeholder="email / jméno / id"
          className="h-9 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-2"
        />
        <label className="sr-only" htmlFor="users-status">
          Status
        </label>
        <select
          id="users-status"
          name="status"
          defaultValue={table.filters.status ?? ""}
          className="h-9 rounded-[var(--radius-sm)] border border-[var(--border-default)] bg-[var(--surface-primary)] px-2"
        >
          <option value="">Všechny stavy</option>
          <option value="ACTIVE">ACTIVE</option>
          <option value="SUSPENDED">SUSPENDED</option>
          <option value="DELETION_REQUESTED">DELETION_REQUESTED</option>
        </select>
        {table.sort ? (
          <input type="hidden" name="sort" value={table.sort} />
        ) : null}
        {table.order !== "desc" ? (
          <input type="hidden" name="order" value={table.order} />
        ) : null}
        {table.pageSize !== 25 ? (
          <input type="hidden" name="pageSize" value={String(table.pageSize)} />
        ) : null}
        <button
          type="submit"
          className="h-9 rounded-[var(--radius-sm)] bg-[var(--action-primary)] px-3 text-[var(--text-inverse)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
        >
          Filtrovat
        </button>
      </form>

      {error ? (
        <InlineAlert tone="warning" title="Users">
          {error}
        </InlineAlert>
      ) : null}

      <AdminUsersDataTable
        items={items}
        total={total}
        state={table}
        canSuspend={roleHasPermission(actor.role, "users.suspend")}
      />

      <section className="space-y-3">
        <h2 className="font-display text-lg">Manuální entitlements</h2>
        <AdminManualEntitlementsPanel />
      </section>
    </div>
  );
}
