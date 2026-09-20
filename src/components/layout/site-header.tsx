"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { Menu, X } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { NAV_PRIMARY, NAV_PRIMARY_CTA } from "@/config/navigation";
import { track } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

const navLinkClass = (active: boolean) =>
  cn(
    "inline-flex items-center whitespace-nowrap rounded-md px-1 py-2 text-sm transition-colors",
    active
      ? "font-medium text-[var(--text-primary)]"
      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
  );

function isActivePath(pathname: string, href: string): boolean {
  if (href.startsWith("/#")) return false;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader(_props: {
  marketCode?: string;
  locale?: string;
  currency?: string;
  markets?: unknown;
  locales?: readonly string[];
} = {}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [menuPath, setMenuPath] = useState(pathname);
  const menuId = useId();

  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMobileOpen(false);
  }

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMobileOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-default)] bg-white">
      <Container
        width="marketing"
        className="flex h-16 w-full items-center justify-between gap-4 px-4 sm:px-6 lg:px-10"
      >
        <div className="flex shrink-0 items-center">
          <Link
            href="/"
            className="flex shrink-0 items-center rounded-sm focus-visible:outline-none"
            onClick={() =>
              track({
                name: "navigation_item_clicked",
                props: { label: "Logo", href: "/" },
              })
            }
          >
            <Logo variant="dark" size="sm" />
          </Link>
        </div>

        <nav
          className="hidden items-center gap-5 xl:flex"
          aria-label="Hlavní navigace"
        >
          {NAV_PRIMARY.map((item) => {
            const active = isActivePath(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={navLinkClass(active)}
                aria-current={active ? "page" : undefined}
                onClick={() =>
                  track({
                    name: "navigation_item_clicked",
                    props: { label: item.label, href: item.href },
                  })
                }
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex shrink-0 items-center gap-3">
          <ButtonLink
            href={NAV_PRIMARY_CTA.href}
            variant="primary"
            size="sm"
            className="hidden h-auto whitespace-nowrap rounded-[4px] bg-[var(--action-accent)] px-4 py-2 text-sm font-medium text-white hover:bg-[var(--action-accent-hover)] xl:inline-flex"
            onClick={() =>
              track({
                name: "primary_cta_clicked",
                props: {
                  label: NAV_PRIMARY_CTA.label,
                  href: NAV_PRIMARY_CTA.href,
                  location: "header",
                },
              })
            }
          >
            {NAV_PRIMARY_CTA.label}
          </ButtonLink>

          <button
            type="button"
            className="inline-flex size-10 items-center justify-center rounded-md text-[var(--text-primary)] xl:hidden"
            aria-expanded={mobileOpen}
            aria-controls={menuId}
            aria-label={mobileOpen ? "Zavřít menu" : "Otevřít menu"}
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </Container>

      {mobileOpen ? (
        <div
          id={menuId}
          className="border-t border-[var(--border-default)] bg-white xl:hidden"
        >
          <Container className="flex flex-col gap-1 px-6 py-4">
            {NAV_PRIMARY.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="rounded-md px-2 py-3 text-base text-[var(--text-primary)]"
                onClick={() => setMobileOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href={NAV_PRIMARY_CTA.href}
              className="mt-2 inline-flex h-11 items-center justify-center rounded-[4px] bg-[var(--action-primary)] px-4 text-sm font-medium text-white"
              onClick={() => setMobileOpen(false)}
            >
              {NAV_PRIMARY_CTA.label}
            </Link>
          </Container>
        </div>
      ) : null}
    </header>
  );
}
