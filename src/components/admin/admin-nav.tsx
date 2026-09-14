"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { ADMIN_NAV_SECTIONS } from "@/config/navigation";
import { roleHasPermission } from "@/domains/administration/rbac/roles";
import type { PermissionKey } from "@/domains/administration/rbac/permissions";
import { cn } from "@/lib/utils";

export function AdminNav(props: { role: string }) {
  const pathname = usePathname() || "/admin";

  const sections = ADMIN_NAV_SECTIONS.map((section) => ({
    ...section,
    items: section.items.filter((item) =>
      roleHasPermission(props.role, item.permission as PermissionKey),
    ),
  })).filter((s) => s.items.length > 0);

  return (
    <nav aria-label="Administrace" className="space-y-5">
      {sections.map((section) => (
        <div key={section.id}>
          <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            {section.label}
          </p>
          <ul className="space-y-0.5">
            {section.items.map((item) => {
              const active =
                item.href === "/admin"
                  ? pathname === "/admin"
                  : pathname === item.href ||
                    pathname.startsWith(`${item.href}/`);
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={cn(
                      "block rounded-[var(--radius-md)] px-3 py-2 text-sm",
                      active
                        ? "bg-[var(--surface-primary)] font-medium text-[var(--text-primary)]"
                        : "text-[var(--text-secondary)] hover:bg-[var(--surface-primary)] hover:text-[var(--text-primary)]",
                    )}
                    aria-current={active ? "page" : undefined}
                  >
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}
