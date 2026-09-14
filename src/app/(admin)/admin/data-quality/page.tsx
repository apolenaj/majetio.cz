import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthError } from "@/lib/auth/guards";
import {
  hasPermission,
  requirePermission,
} from "@/domains/administration";
import {
  getDataQualityCategoryCounts,
  listDataQualityIssues,
} from "@/domains/data-quality/admin/issues";
import { DataQualityIssuePanel } from "@/components/admin/data-quality-issue-panel";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/feedback/states";

export const metadata: Metadata = {
  title: "Admin · Data Quality Center",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function param(sp: Record<string, string | string[] | undefined>, key: string) {
  const v = sp[key];
  return typeof v === "string" ? v : undefined;
}

export default async function AdminDataQualityPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  let actor;
  try {
    actor = await requirePermission("dataQuality.read");
  } catch (err) {
    if (err instanceof AuthError) redirect("/ucet?error=forbidden");
    throw err;
  }

  const sp = await searchParams;
  const category = param(sp, "category");
  const status = param(sp, "status") ?? "OPEN_ATTENTION";
  const severity = param(sp, "severity");
  const q = param(sp, "q");

  const [{ items, total, error }, counts] = await Promise.all([
    listDataQualityIssues({ category, status, severity, q, take: 40 }),
    getDataQualityCategoryCounts(),
  ]);

  const canResolve = hasPermission(actor.role, "dataQuality.resolve");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Data Quality Center"
        description="MISSING · CONFLICT · ANOMALY · STALE · DUPLICATE — s vysvětlením PROČ, ne jen „Suspicious“."
      />

      <div className="grid gap-3 sm:grid-cols-5">
        {(["MISSING", "CONFLICT", "ANOMALY", "STALE", "DUPLICATE"] as const).map(
          (cat) => (
            <a
              key={cat}
              href={`/admin/data-quality?category=${cat}&status=OPEN_ATTENTION`}
              className="rounded-lg border border-[var(--border-default)] px-3 py-3 hover:bg-[var(--surface-1)]"
            >
              <p className="text-xs uppercase text-[var(--text-muted)]">{cat}</p>
              <p className="mt-1 text-xl font-semibold">
                {(counts[cat] ?? 0).toLocaleString("cs-CZ")}
              </p>
            </a>
          ),
        )}
      </div>

      <form
        method="get"
        className="grid gap-3 rounded-lg border border-[var(--border-default)] p-4 sm:grid-cols-4"
      >
        <label className="text-xs text-[var(--text-muted)]">
          Hledat
          <input
            name="q"
            defaultValue={q ?? ""}
            className="mt-1 w-full rounded border border-[var(--border-default)] bg-[var(--surface-0)] px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-xs text-[var(--text-muted)]">
          Category
          <select
            name="category"
            defaultValue={category ?? ""}
            className="mt-1 w-full rounded border border-[var(--border-default)] bg-[var(--surface-0)] px-2 py-1.5 text-sm"
          >
            <option value="">Vše</option>
            {["MISSING", "CONFLICT", "ANOMALY", "STALE", "DUPLICATE"].map(
              (c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ),
            )}
          </select>
        </label>
        <label className="text-xs text-[var(--text-muted)]">
          Status
          <select
            name="status"
            defaultValue={status}
            className="mt-1 w-full rounded border border-[var(--border-default)] bg-[var(--surface-0)] px-2 py-1.5 text-sm"
          >
            <option value="OPEN_ATTENTION">Open attention</option>
            <option value="OPEN">OPEN</option>
            <option value="IN_REVIEW">IN_REVIEW</option>
            <option value="RESOLVED">RESOLVED</option>
            <option value="FALSE_POSITIVE">FALSE_POSITIVE</option>
          </select>
        </label>
        <label className="text-xs text-[var(--text-muted)]">
          Severity
          <select
            name="severity"
            defaultValue={severity ?? ""}
            className="mt-1 w-full rounded border border-[var(--border-default)] bg-[var(--surface-0)] px-2 py-1.5 text-sm"
          >
            <option value="">Vše</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="WARNING">WARNING</option>
            <option value="INFO">INFO</option>
          </select>
        </label>
        <button
          type="submit"
          className="rounded bg-[var(--text-primary)] px-3 py-1.5 text-sm text-[var(--surface-0)] sm:col-span-4 sm:w-fit"
        >
          Filtrovat
        </button>
      </form>

      {error ? (
        <InlineAlert tone="warning" title="DQ">
          {error}
        </InlineAlert>
      ) : null}

      <p className="text-xs text-[var(--text-muted)]">
        {items.length} zobrazeno · {total} celkem
      </p>

      {items.length === 0 ? (
        <p className="text-sm text-[var(--text-muted)]">Žádné issues.</p>
      ) : (
        <DataQualityIssuePanel items={items} canResolve={canResolve} />
      )}
    </div>
  );
}
