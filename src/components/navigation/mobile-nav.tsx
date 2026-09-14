"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Building2, Columns2, Heart, LayoutDashboard, User } from "lucide-react";

import { cn } from "@/lib/utils";

const APP_NAV = [
  { href: "/ucet", label: "Přehled", icon: LayoutDashboard, match: (p: string) => p === "/ucet" },
  {
    href: "/nemovitosti",
    label: "Nemovitosti",
    icon: Building2,
    match: (p: string) => p.startsWith("/nemovitosti"),
  },
  {
    href: "/porovnani",
    label: "Porovnání",
    icon: Columns2,
    match: (p: string) => p.startsWith("/porovnani") || p === "/ucet/porovnani",
  },
  {
    href: "/ucet/oblibene",
    label: "Oblíbené",
    icon: Heart,
    match: (p: string) => p.startsWith("/ucet/oblibene"),
  },
  {
    href: "/ucet/nastaveni",
    label: "Účet",
    icon: User,
    match: (p: string) =>
      p.startsWith("/ucet") &&
      p !== "/ucet" &&
      !p.startsWith("/ucet/oblibene") &&
      p !== "/ucet/porovnani",
  },
] as const;

export function MobileBottomNavigation({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Mobilní aplikace"
      className={cn(
        "fixed inset-x-0 bottom-0 z-[40] border-t border-[var(--border-default)] bg-[var(--surface-primary)] pb-[env(safe-area-inset-bottom)] lg:hidden",
        className,
      )}
    >
      <ul className="grid grid-cols-5">
        {APP_NAV.map((item) => {
          const Icon = item.icon;
          const active = item.match(pathname);
          return (
            <li key={`${item.label}-${item.href}`}>
              <Link
                href={item.href}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-1 px-1 text-[0.65rem] font-medium",
                  active ? "text-[var(--action-primary)]" : "text-[var(--text-muted)]",
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-5" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function StickyMobileCTALink({
  label,
  href,
  className,
}: {
  label: string;
  href: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-[35] border-t border-[var(--border-default)] bg-[var(--surface-primary)] p-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] lg:hidden",
        className,
      )}
    >
      <a
        href={href}
        className="inline-flex h-12 w-full items-center justify-center rounded-[var(--radius-md)] bg-[var(--action-primary)] text-sm font-medium text-[var(--text-inverse)]"
      >
        {label}
      </a>
    </div>
  );
}

/** @deprecated Import from `@/components/comparisons/compare-tray` */
export { CompareTray, CompareTrayLegacy } from "@/components/comparisons/compare-tray";

