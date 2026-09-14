import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { AuthError } from "@/lib/auth/guards";
import { requirePermission } from "@/domains/administration";
import { listImportJobs } from "@/domains/property-sources/admin/import-ops";
import { PageHeader } from "@/components/ui/page-header";
import { InlineAlert } from "@/components/feedback/states";

export const metadata: Metadata = {
  title: "Admin · Import Operations",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function param(sp: Record<string, string | string[] | undefined>, key: string) {
  const v = sp[key];
  return typeof v === "string" ? v : undefined;
}

export default async function AdminImportsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  try {
    await requirePermission("import.read");
  } catch (err) {
    if (err instanceof AuthError) redirect("/ucet?error=forbidden");
    throw err;
  }

  const sp = await searchParams;
  const status = param(sp, "status");
  const provider = param(sp, "provider");
  const { items, error } = await listImportJobs({ status, provider, take: 50 });

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Operations Center"
        description="QUEUED · RUNNING · COMPLETED_WITH_WARNINGS · FAILED — summary + drilldown failed records."
      />

      <form method="get" className="flex flex-wrap gap-3">
        <select
          name="status"
          defaultValue={status ?? ""}
          className="rounded border border-[var(--border-default)] bg-[var(--surface-0)] px-2 py-1.5 text-sm"
        >
          <option value="">Všechny stavy</option>
          {[
            "QUEUED",
            "RUNNING",
            "SUCCEEDED",
            "COMPLETED_WITH_WARNINGS",
            "FAILED",
            "CANCELLED",
          ].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
        <input
          name="provider"
          defaultValue={provider ?? ""}
          placeholder="provider"
          className="rounded border border-[var(--border-default)] bg-[var(--surface-0)] px-2 py-1.5 text-sm"
        />
        <button
          type="submit"
          className="rounded bg-[var(--text-primary)] px-3 py-1.5 text-sm text-[var(--surface-0)]"
        >
          Filtrovat
        </button>
      </form>

      {error ? (
        <InlineAlert tone="warning" title="Importy">
          {error}
        </InlineAlert>
      ) : null}

      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--border-default)] text-[var(--text-muted)]">
              <th className="py-2 pr-3 font-medium">Job</th>
              <th className="py-2 pr-3 font-medium">Status</th>
              <th className="py-2 pr-3 font-medium">Processed</th>
              <th className="py-2 pr-3 font-medium">OK</th>
              <th className="py-2 pr-3 font-medium">Rejected</th>
              <th className="py-2 pr-3 font-medium">Skipped</th>
            </tr>
          </thead>
          <tbody>
            {items.map((job) => (
              <tr
                key={job.id}
                className="border-b border-[var(--border-subtle)]"
              >
                <td className="py-2 pr-3">
                  <Link
                    href={`/admin/importy/${job.id}`}
                    className="font-medium text-[var(--text-link)] hover:underline"
                  >
                    {job.provider}
                  </Link>
                  <p className="text-xs text-[var(--text-muted)]">
                    {job.idempotencyKey}
                  </p>
                </td>
                <td className="py-2 pr-3">{job.opsStatus}</td>
                <td className="py-2 pr-3">{job.processedCount}</td>
                <td className="py-2 pr-3">{job.successCount}</td>
                <td className="py-2 pr-3">{job.rejectedCount}</td>
                <td className="py-2 pr-3">{job.skippedCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {items.length === 0 ? (
          <p className="mt-4 text-sm text-[var(--text-muted)]">
            Žádné import joby.
          </p>
        ) : null}
      </div>
    </div>
  );
}
