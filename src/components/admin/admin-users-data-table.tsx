"use client";

import * as React from "react";
import Link from "next/link";

import type { AdminUserListItem } from "@/domains/users/admin/user-ops";
import type { AdminTableState } from "@/lib/admin/url-table-state";
import {
  AdminBulkActionBar,
  AdminDataTable,
  AdminDryRunPreviewPanel,
  AdminSortHeader,
  AdminTableEmpty,
  AdminTablePagination,
  AdminTBody,
  AdminTD,
  AdminTH,
  AdminTHead,
  AdminTR,
} from "@/components/admin/data-table";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/feedback/states";
import {
  adminBulkSuspendUsersAction,
  adminExportUsersCsvAction,
} from "@/domains/users/server/admin-actions";

function downloadCsv(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function AdminUsersDataTable(props: {
  items: AdminUserListItem[];
  total: number;
  state: AdminTableState;
  canSuspend: boolean;
}) {
  const pathname = "/admin/uzivatele";
  const [selected, setSelected] = React.useState<string[]>([]);
  const [exportPreview, setExportPreview] = React.useState<{
    rowCount: number;
    headers: string[];
    sampleRows: string[][];
    warnings: string[];
  } | null>(null);
  const [exportError, setExportError] = React.useState<string | null>(null);

  const allIds = props.items.map((u) => u.id);
  const allSelected =
    allIds.length > 0 && allIds.every((id) => selected.includes(id));

  function toggleAll() {
    setSelected(allSelected ? [] : allIds);
  }

  function toggleOne(id: string) {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  async function previewExport() {
    setExportError(null);
    const result = await adminExportUsersCsvAction({
      ids: selected.length ? selected : undefined,
      q: props.state.filters.q,
      status: props.state.filters.status,
      dryRun: true,
    });
    if (!result.ok) {
      setExportError(result.error);
      setExportPreview(null);
      return;
    }
    if (result.dryRun) setExportPreview(result.preview);
  }

  async function downloadExport() {
    setExportError(null);
    const result = await adminExportUsersCsvAction({
      ids: selected.length ? selected : undefined,
      q: props.state.filters.q,
      status: props.state.filters.status,
      dryRun: false,
    });
    if (!result.ok) {
      setExportError(result.error);
      return;
    }
    if (!result.dryRun) downloadCsv(result.filename, result.csv);
  }

  if (props.total === 0) {
    return (
      <AdminTableEmpty
        title="Žádní uživatelé"
        description="Upravte filtr q / status nebo vytvořte účet."
      />
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="secondary" onClick={() => void previewExport()}>
          Export preview
        </Button>
        <Button type="button" size="sm" onClick={() => void downloadExport()}>
          Stáhnout CSV
        </Button>
        <p className="text-xs text-[var(--text-muted)]">
          CSV je sanitizované proti formula injection (= + - @).
        </p>
      </div>

      {exportError ? (
        <InlineAlert tone="warning" title="Export">
          {exportError}
        </InlineAlert>
      ) : null}

      {exportPreview ? (
        <AdminDryRunPreviewPanel
          title="CSV export · dry-run"
          summary={`${exportPreview.rowCount} řádků · ukázka prvních ${exportPreview.sampleRows.length}`}
          rows={exportPreview.headers.map((h, i) => ({
            label: h,
            value: exportPreview.sampleRows[0]?.[i] ?? "—",
          }))}
          warnings={exportPreview.warnings}
        />
      ) : null}

      <AdminDataTable caption="Seznam uživatelů">
        <AdminTHead>
          <AdminTR>
            <AdminTH>
              <input
                type="checkbox"
                checked={allSelected}
                onChange={toggleAll}
                aria-label="Vybrat všechny na stránce"
              />
            </AdminTH>
            <AdminSortHeader
              label="User"
              column="email"
              pathname={pathname}
              state={props.state}
            />
            <AdminSortHeader
              label="Role"
              column="role"
              pathname={pathname}
              state={props.state}
            />
            <AdminSortHeader
              label="Status"
              column="accountStatus"
              pathname={pathname}
              state={props.state}
            />
            <AdminSortHeader
              label="Created"
              column="createdAt"
              pathname={pathname}
              state={props.state}
            />
          </AdminTR>
        </AdminTHead>
        <AdminTBody>
          {props.items.map((u) => {
            const isSelected = selected.includes(u.id);
            return (
              <AdminTR key={u.id} selected={isSelected}>
                <AdminTD>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleOne(u.id)}
                    aria-label={`Vybrat ${u.email ?? u.id}`}
                  />
                </AdminTD>
                <AdminTD>
                  <Link
                    href={`/admin/uzivatele/${u.id}`}
                    className="font-medium text-[var(--text-link)] hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
                  >
                    {u.email ?? u.id}
                  </Link>
                  <p className="text-[length:var(--admin-table-font)] text-[var(--text-muted)]">
                    {u.name}
                  </p>
                </AdminTD>
                <AdminTD>{u.role}</AdminTD>
                <AdminTD>{u.accountStatus}</AdminTD>
                <AdminTD align="right">
                  {u.createdAt.toISOString().slice(0, 10)}
                </AdminTD>
              </AdminTR>
            );
          })}
        </AdminTBody>
      </AdminDataTable>

      <AdminTablePagination
        pathname={pathname}
        state={props.state}
        total={props.total}
      />

      {props.canSuspend ? (
        <AdminBulkActionBar
          selectedIds={selected}
          onClear={() => setSelected([])}
          actions={[
            {
              id: "suspend",
              label: "Suspendovat vybrané",
              supportsDryRun: true,
              run: async ({ ids, reason, confirmToken, dryRun }) => {
                const result = await adminBulkSuspendUsersAction({
                  ids,
                  reason,
                  confirmToken,
                  dryRun,
                });
                if (!result.ok) return { ok: false, error: result.error };
                return { ok: true, message: result.message };
              },
            },
          ]}
        />
      ) : null}
    </div>
  );
}
