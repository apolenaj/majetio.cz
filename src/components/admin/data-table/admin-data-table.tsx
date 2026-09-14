import * as React from "react";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { Spinner, EmptyState } from "@/components/feedback/states";
import {
  type AdminTableState,
  buildAdminTableHref,
  toggleSortOrder,
} from "@/lib/admin/url-table-state";

export function AdminDataTable({
  caption,
  children,
  className,
}: {
  caption: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "admin-dense w-full overflow-x-auto rounded-[var(--radius-sm)] border border-[var(--border-default)]",
        className,
      )}
    >
      <table className="w-full min-w-[36rem] border-collapse text-left text-[length:var(--admin-table-font)]">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function AdminTHead({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <thead
      className={cn(
        "bg-[var(--background-secondary)] text-[var(--text-muted)]",
        className,
      )}
    >
      {children}
    </thead>
  );
}

export function AdminTBody({ children }: { children: React.ReactNode }) {
  return <tbody className="bg-[var(--surface-primary)]">{children}</tbody>;
}

export function AdminTR({
  children,
  className,
  selected,
  ...props
}: React.HTMLAttributes<HTMLTableRowElement> & { selected?: boolean }) {
  return (
    <tr
      className={cn(
        "border-t border-[var(--border-subtle)] hover:bg-[color-mix(in_srgb,var(--background-secondary)_55%,transparent)]",
        selected &&
          "bg-[color-mix(in_srgb,var(--status-info)_10%,transparent)]",
        className,
      )}
      {...props}
    >
      {children}
    </tr>
  );
}

export function AdminTH({
  children,
  className,
  align = "left",
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <th
      scope="col"
      className={cn(
        "sticky top-0 z-[1] px-[var(--admin-cell-px)] py-[var(--admin-cell-py)] font-medium whitespace-nowrap",
        align === "right" && "text-right",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </th>
  );
}

export function AdminTD({
  children,
  className,
  align = "left",
}: {
  children?: React.ReactNode;
  className?: string;
  align?: "left" | "right" | "center";
}) {
  return (
    <td
      className={cn(
        "px-[var(--admin-cell-px)] py-[var(--admin-cell-py)] text-[var(--text-primary)]",
        align === "right" && "text-right tabular-nums",
        align === "center" && "text-center",
        className,
      )}
    >
      {children}
    </td>
  );
}

export function AdminSortHeader(props: {
  label: string;
  column: string;
  pathname: string;
  state: AdminTableState;
}) {
  const next = toggleSortOrder(props.state.sort, props.state.order, props.column);
  const href = buildAdminTableHref(props.pathname, props.state, {
    sort: next.sort,
    order: next.order,
    page: 1,
  });
  const active = props.state.sort === props.column;
  const ariaSort = active
    ? props.state.order === "asc"
      ? ("ascending" as const)
      : ("descending" as const)
    : ("none" as const);

  return (
    <th
      scope="col"
      aria-sort={ariaSort}
      className="sticky top-0 z-[1] px-[var(--admin-cell-px)] py-[var(--admin-cell-py)] font-medium whitespace-nowrap"
    >
      <Link
        href={href}
        className="inline-flex items-center gap-1 rounded-sm text-[var(--text-secondary)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
      >
        {props.label}
        <span aria-hidden className="text-[var(--text-muted)]">
          {active ? (props.state.order === "asc" ? "↑" : "↓") : "↕"}
        </span>
      </Link>
    </th>
  );
}

export function AdminTablePagination(props: {
  pathname: string;
  state: AdminTableState;
  total: number;
}) {
  const totalPages = Math.max(
    1,
    Math.ceil(props.total / props.state.pageSize),
  );
  const page = Math.min(props.state.page, totalPages);
  const from = props.total === 0 ? 0 : (page - 1) * props.state.pageSize + 1;
  const to = Math.min(page * props.state.pageSize, props.total);

  const prevHref =
    page > 1
      ? buildAdminTableHref(props.pathname, props.state, { page: page - 1 })
      : null;
  const nextHref =
    page < totalPages
      ? buildAdminTableHref(props.pathname, props.state, { page: page + 1 })
      : null;

  return (
    <nav
      className="flex flex-wrap items-center justify-between gap-2 text-xs text-[var(--text-secondary)]"
      aria-label="Stránkování tabulky"
    >
      <p>
        {props.total === 0
          ? "Žádné záznamy"
          : `${from}–${to} z ${props.total}`}
      </p>
      <div className="flex items-center gap-2">
        {prevHref ? (
          <Link
            href={prevHref}
            className="rounded border border-[var(--border-default)] px-2 py-1 hover:bg-[var(--background-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            rel="prev"
          >
            Předchozí
          </Link>
        ) : (
          <span className="rounded border border-transparent px-2 py-1 text-[var(--text-muted)]">
            Předchozí
          </span>
        )}
        <span className="tabular-nums">
          {page}/{totalPages}
        </span>
        {nextHref ? (
          <Link
            href={nextHref}
            className="rounded border border-[var(--border-default)] px-2 py-1 hover:bg-[var(--background-secondary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            rel="next"
          >
            Další
          </Link>
        ) : (
          <span className="rounded border border-transparent px-2 py-1 text-[var(--text-muted)]">
            Další
          </span>
        )}
      </div>
    </nav>
  );
}

export function AdminTableLoading({ label = "Načítání" }: { label?: string }) {
  return (
    <div
      className="flex items-center justify-center gap-2 border border-dashed border-[var(--border-default)] px-4 py-10 text-sm text-[var(--text-muted)]"
      role="status"
    >
      <Spinner label={label} />
      <span>{label}…</span>
    </div>
  );
}

export function AdminTableEmpty({
  title = "Žádná data",
  description = "Upravte filtry nebo zkuste to později.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <EmptyState
      title={title}
      description={description}
      className="border border-dashed border-[var(--border-default)]"
    />
  );
}
