import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthError } from "@/lib/auth/guards";
import { requirePermission } from "@/domains/administration";
import { listAdminProperties } from "@/domains/properties/admin/list";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/feedback/states";

export const metadata: Metadata = {
  title: "Admin · Nemovitosti",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function param(sp: Record<string, string | string[] | undefined>, key: string) {
  const v = sp[key];
  return typeof v === "string" ? v : undefined;
}

export default async function AdminPropertiesPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  try {
    await requirePermission("property.read");
  } catch (err) {
    if (err instanceof AuthError) redirect("/ucet?error=forbidden");
    throw err;
  }

  const sp = await searchParams;
  const q = param(sp, "q");
  const marketCode = param(sp, "market");
  const status = param(sp, "status");
  const freshness = param(sp, "freshness");
  const visibility = param(sp, "visibility");
  const hasCriticalDq = param(sp, "dq") === "critical";
  const valuation = param(sp, "valuation");

  const { items, total, error } = await listAdminProperties({
    q,
    marketCode,
    status,
    freshness,
    visibility,
    hasCriticalDq: hasCriticalDq || undefined,
    take: 50,
  });

  const filtered =
    valuation === "yes"
      ? items.filter((i) => i.hasValuation)
      : valuation === "no"
        ? items.filter((i) => !i.hasValuation)
        : items;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Property Operations"
        description="Canonical listings, data quality a lifecycle — ne CRUD katalog."
      />

      <div className="flex flex-wrap gap-3 text-sm">
        <Link
          href="/admin/nemovitosti/moderace"
          className="text-[var(--text-link)] underline-offset-2 hover:underline"
        >
          Moderation queue
        </Link>
        <Link
          href="/admin/nemovitosti/duplikaty"
          className="text-[var(--text-link)] underline-offset-2 hover:underline"
        >
          Duplicate Review Center
        </Link>
      </div>

      <form
        method="get"
        className="grid gap-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-1)] p-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <label className="block text-xs text-[var(--text-muted)]">
          Hledat
          <input
            name="q"
            defaultValue={q ?? ""}
            placeholder="title, slug, city, id"
            className="mt-1 w-full rounded border border-[var(--border-default)] bg-[var(--surface-0)] px-2 py-1.5 text-sm text-[var(--text-primary)]"
          />
        </label>
        <label className="block text-xs text-[var(--text-muted)]">
          Market
          <input
            name="market"
            defaultValue={marketCode ?? ""}
            placeholder="CZ"
            className="mt-1 w-full rounded border border-[var(--border-default)] bg-[var(--surface-0)] px-2 py-1.5 text-sm"
          />
        </label>
        <label className="block text-xs text-[var(--text-muted)]">
          Status
          <select
            name="status"
            defaultValue={status ?? ""}
            className="mt-1 w-full rounded border border-[var(--border-default)] bg-[var(--surface-0)] px-2 py-1.5 text-sm"
          >
            <option value="">Vše</option>
            {[
              "DRAFT",
              "PENDING_REVIEW",
              "ACTIVE",
              "REJECTED",
              "SUSPENDED",
              "ARCHIVED",
              "UNAVAILABLE",
            ].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs text-[var(--text-muted)]">
          Freshness
          <select
            name="freshness"
            defaultValue={freshness ?? ""}
            className="mt-1 w-full rounded border border-[var(--border-default)] bg-[var(--surface-0)] px-2 py-1.5 text-sm"
          >
            <option value="">Vše</option>
            <option value="FRESH">FRESH</option>
            <option value="STALE">STALE</option>
            <option value="UNAVAILABLE">UNAVAILABLE</option>
          </select>
        </label>
        <label className="block text-xs text-[var(--text-muted)]">
          Visibility
          <select
            name="visibility"
            defaultValue={visibility ?? ""}
            className="mt-1 w-full rounded border border-[var(--border-default)] bg-[var(--surface-0)] px-2 py-1.5 text-sm"
          >
            <option value="">Vše</option>
            <option value="PUBLIC">PUBLIC</option>
            <option value="PRIVATE">PRIVATE</option>
            <option value="ACCOUNT_ONLY">ACCOUNT_ONLY</option>
          </select>
        </label>
        <label className="block text-xs text-[var(--text-muted)]">
          Data quality
          <select
            name="dq"
            defaultValue={hasCriticalDq ? "critical" : ""}
            className="mt-1 w-full rounded border border-[var(--border-default)] bg-[var(--surface-0)] px-2 py-1.5 text-sm"
          >
            <option value="">Vše</option>
            <option value="critical">Jen CRITICAL open</option>
          </select>
        </label>
        <label className="block text-xs text-[var(--text-muted)]">
          Valuation
          <select
            name="valuation"
            defaultValue={valuation ?? ""}
            className="mt-1 w-full rounded border border-[var(--border-default)] bg-[var(--surface-0)] px-2 py-1.5 text-sm"
          >
            <option value="">Vše</option>
            <option value="yes">Má valuation</option>
            <option value="no">Bez valuation</option>
          </select>
        </label>
        <div className="flex items-end">
          <button
            type="submit"
            className="rounded bg-[var(--text-primary)] px-3 py-1.5 text-sm text-[var(--surface-0)]"
          >
            Filtrovat
          </button>
        </div>
      </form>

      {error ? (
        <InlineAlert tone="warning" title="List">
          {error}
        </InlineAlert>
      ) : null}

      <p className="text-xs text-[var(--text-muted)]">
        {filtered.length} zobrazeno · {total} celkem (DB filtr)
      </p>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[56rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)] text-[var(--text-muted)]">
              <th className="py-2 pr-3 font-medium">Title</th>
              <th className="py-2 pr-3 font-medium">Market</th>
              <th className="py-2 pr-3 font-medium">Status</th>
              <th className="py-2 pr-3 font-medium">Fresh</th>
              <th className="py-2 pr-3 font-medium">Price</th>
              <th className="py-2 pr-3 font-medium">DQ</th>
              <th className="py-2 pr-3 font-medium">Val</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr
                key={row.id}
                className="border-b border-[var(--border-subtle)] align-top"
              >
                <td className="py-2 pr-3">
                  <Link
                    href={`/admin/nemovitosti/${row.id}`}
                    className="font-medium text-[var(--text-link)] hover:underline"
                  >
                    {row.title}
                  </Link>
                  <p className="text-xs text-[var(--text-muted)]">
                    {row.publicCity ?? "—"} · {row.slug}
                    {row.isDemo ? " · demo" : ""}
                  </p>
                </td>
                <td className="py-2 pr-3">{row.marketCode}</td>
                <td className="py-2 pr-3">{row.status}</td>
                <td className="py-2 pr-3">{row.freshness}</td>
                <td className="py-2 pr-3">
                  {row.askingPrice != null
                    ? `${row.askingPrice.toLocaleString("cs-CZ")} ${row.currency}`
                    : "—"}
                </td>
                <td className="py-2 pr-3">
                  {row.criticalDqCount > 0 ? (
                    <span className="text-[var(--status-danger)]">
                      {row.criticalDqCount}
                    </span>
                  ) : (
                    "0"
                  )}
                </td>
                <td className="py-2 pr-3">{row.hasValuation ? "yes" : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            Žádné nemovitosti pro daný filtr.
          </p>
        ) : null}
      </div>
    </div>
  );
}
