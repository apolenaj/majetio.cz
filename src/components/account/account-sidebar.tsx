"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ACCOUNT_NAV } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function AccountSidebar() {
  const pathname = usePathname();

  return (
    <nav aria-label="Navigace účtu" className="sticky top-24 space-y-1">
      <p className="mb-3 text-overline text-[var(--text-muted)]">Můj účet</p>
      {ACCOUNT_NAV.map((item) => {
        const active =
          item.href === "/ucet" ? pathname === "/ucet" : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "block rounded-[var(--radius-md)] px-3 py-2 text-sm transition-colors",
              active
                ? "bg-[color-mix(in_srgb,var(--action-primary)_10%,white)] font-medium text-[var(--action-primary)]"
                : "text-[var(--text-secondary)] hover:bg-[var(--surface-primary)] hover:text-[var(--text-primary)]",
            )}
            aria-current={active ? "page" : undefined}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
