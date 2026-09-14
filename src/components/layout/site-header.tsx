"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { ChevronDown, Menu, X } from "lucide-react";

import { Logo } from "@/components/brand/logo";
import type { MarketSelectorOption } from "@/components/i18n/market-selector-types";
import {
  HeaderLocaleControls,
} from "@/components/i18n/header-locale-controls";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import {
  MEGA_KALKULACKY,
  MEGA_NEMOVITOSTI,
  NAV_PRIMARY,
} from "@/config/navigation";
import { track } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

type MegaKey = "nemovitosti" | "kalkulacky" | null;

const DEFAULT_MARKETS: MarketSelectorOption[] = [
  {
    marketCode: "CZ",
    displayNameLocal: "Česko",
    displayNameEn: "Czech Republic",
    enabled: true,
    launchStatus: "LIVE",
    publiclyActive: true,
  },
];

const navLinkClass = (active: boolean) =>
  cn(
    "inline-flex items-center gap-1 whitespace-nowrap rounded-md px-1 py-2 text-sm transition-colors",
    active
      ? "font-medium text-[var(--text-primary)]"
      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
  );

export function SiteHeader({
  marketCode = "CZ",
  locale = "cs-CZ",
  currency = "CZK",
  markets = DEFAULT_MARKETS,
  locales = ["cs-CZ", "en-GB"],
}: {
  marketCode?: string;
  locale?: string;
  currency?: string;
  markets?: MarketSelectorOption[];
  locales?: readonly string[];
} = {}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mega, setMega] = useState<MegaKey>(null);
  const [menuPath, setMenuPath] = useState(pathname);
  const megaRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  // Close overlays on navigation (React-recommended: adjust state during render).
  if (menuPath !== pathname) {
    setMenuPath(pathname);
    setMobileOpen(false);
    setMega(null);
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
      if (e.key === "Escape") {
        setMega(null);
        setMobileOpen(false);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function openMega(key: MegaKey) {
    setMega(key);
    if (key) track({ name: "mega_menu_opened", props: { menu: key } });
  }

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[var(--border-default)] bg-[color-mix(in_srgb,var(--background-primary)_92%,white)] backdrop-blur-sm">
      <Container
        width="dashboard"
        className="flex w-full items-center justify-between gap-4 px-6 py-4"
      >
        {/* Left — logo */}
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
            <Logo variant="dark" size="md" />
          </Link>
        </div>

        {/* Center — primary nav */}
        <nav
          className="hidden items-center gap-6 xl:flex"
          aria-label="Hlavní navigace"
          ref={megaRef}
        >
          {NAV_PRIMARY.map((item) => {
            const active =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            if (item.hasMega && item.href === "/nemovitosti") {
              return (
                <button
                  key={item.href}
                  type="button"
                  className={navLinkClass(active || mega === "nemovitosti")}
                  aria-expanded={mega === "nemovitosti"}
                  aria-haspopup="true"
                  onClick={() =>
                    openMega(mega === "nemovitosti" ? null : "nemovitosti")
                  }
                  onMouseEnter={() => openMega("nemovitosti")}
                >
                  <span className="whitespace-nowrap">{item.label}</span>
                  <ChevronDown className="size-3.5 shrink-0 opacity-70" aria-hidden />
                </button>
              );
            }
            if (item.hasMega && item.href === "/kalkulacky") {
              return (
                <button
                  key={item.href}
                  type="button"
                  className={navLinkClass(active || mega === "kalkulacky")}
                  aria-expanded={mega === "kalkulacky"}
                  aria-haspopup="true"
                  onClick={() =>
                    openMega(mega === "kalkulacky" ? null : "kalkulacky")
                  }
                  onMouseEnter={() => openMega("kalkulacky")}
                >
                  <span className="whitespace-nowrap">{item.label}</span>
                  <ChevronDown className="size-3.5 shrink-0 opacity-70" aria-hidden />
                </button>
              );
            }
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
                <span className="whitespace-nowrap">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Right — locale, auth, CTA (desktop) + mobile controls */}
        <div className="flex shrink-0 items-center gap-4">
          <div className="hidden items-center gap-4 xl:flex">
            <HeaderLocaleControls
              marketCode={marketCode}
              locale={locale}
              currency={currency}
              markets={markets}
              locales={locales}
            />
            <ButtonLink
              href="/prihlaseni"
              variant="ghost"
              size="sm"
              className="h-auto whitespace-nowrap px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Přihlásit se
            </ButtonLink>
            <ButtonLink
              href="/analyza"
              variant="primary"
              size="sm"
              className="h-auto whitespace-nowrap rounded-lg px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-[background-color,box-shadow] duration-[var(--duration-fast)] hover:bg-[var(--action-primary-hover)] hover:shadow-md"
              onClick={() =>
                track({
                  name: "primary_cta_clicked",
                  props: {
                    label: "Analyzovat nemovitost",
                    href: "/analyza",
                    location: "header",
                  },
                })
              }
            >
              Analyzovat nemovitost
            </ButtonLink>
          </div>

          <div className="flex items-center gap-3 xl:hidden">
            <ButtonLink
              href="/analyza"
              variant="primary"
              size="sm"
              className="hidden h-auto whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium text-white shadow-sm sm:inline-flex"
            >
              Analyzovat
            </ButtonLink>
            <button
              type="button"
              className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg text-[var(--text-primary)] transition-colors hover:bg-[var(--background-secondary)]"
              aria-expanded={mobileOpen}
              aria-controls={menuId}
              aria-label={mobileOpen ? "Zavřít menu" : "Otevřít menu"}
              onClick={() => setMobileOpen((v) => !v)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </Container>

      {mega === "nemovitosti" ? (
        <div
          className="absolute inset-x-0 top-full z-50 border-b border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-overlay)]"
          onMouseLeave={() => setMega(null)}
        >
          <Container className="grid gap-8 py-8 md:grid-cols-3">
            <MegaColumn title="Hledat" links={[...MEGA_NEMOVITOSTI.search]} />
            <MegaColumn title="Podle strategie" links={[...MEGA_NEMOVITOSTI.strategies]} />
            <MegaColumn title="Nástroje" links={[...MEGA_NEMOVITOSTI.tools]} />
          </Container>
        </div>
      ) : null}

      {mega === "kalkulacky" ? (
        <div
          className="absolute inset-x-0 top-full z-50 border-b border-[var(--border-default)] bg-[var(--surface-primary)] shadow-[var(--shadow-overlay)]"
          onMouseLeave={() => setMega(null)}
        >
          <Container className="py-8">
            <p className="text-overline text-[var(--text-muted)]">Kalkulačky</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {MEGA_KALKULACKY.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="block rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--background-secondary)]"
                    onClick={() => setMega(null)}
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-xs text-[var(--text-muted)]">
              Výpočtová logika se připravuje — stránky ukazují strukturu nástroje.
            </p>
          </Container>
        </div>
      ) : null}

      <div
        id={menuId}
        role="dialog"
        aria-modal="true"
        aria-label="Mobilní menu"
        hidden={!mobileOpen}
        className={cn(
          "fixed inset-x-0 top-16 bottom-0 z-50 overflow-y-auto border-t border-[var(--border-default)] bg-[var(--background-primary)] xl:hidden",
          mobileOpen ? "block" : "hidden",
        )}
      >
        <Container className="flex flex-col gap-1 py-4 pb-24">
          <nav aria-label="Mobilní navigace" className="flex flex-col gap-1">
          {NAV_PRIMARY.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-[var(--radius-md)] px-3 py-3 text-base whitespace-nowrap text-[var(--text-primary)] hover:bg-[var(--surface-primary)]"
              onClick={() => setMobileOpen(false)}
            >
              {item.label}
            </Link>
          ))}
          </nav>
          <div className="mt-4 space-y-2 border-t border-[var(--border-default)] pt-4">
            <p className="px-3 text-overline text-[var(--text-muted)]">Nemovitosti</p>
            {MEGA_NEMOVITOSTI.search.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="block rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--text-secondary)]"
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </Link>
            ))}
          </div>
          <div className="mt-2 flex flex-col gap-3 border-t border-[var(--border-default)] pt-4">
            <HeaderLocaleControls
              marketCode={marketCode}
              locale={locale}
              currency={currency}
              markets={markets}
              locales={locales}
            />
            <ButtonLink
              href="/prihlaseni"
              variant="secondary"
              className="whitespace-nowrap"
              onClick={() => setMobileOpen(false)}
            >
              Přihlásit se
            </ButtonLink>
            <ButtonLink
              href="/analyza"
              variant="primary"
              className="h-auto whitespace-nowrap rounded-lg px-5 py-2.5 text-white shadow-sm"
              onClick={() => setMobileOpen(false)}
            >
              Analyzovat nemovitost
            </ButtonLink>
          </div>
        </Container>
      </div>
    </header>
  );
}

function MegaColumn({
  title,
  links,
}: {
  title: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <p className="text-overline text-[var(--text-muted)]">{title}</p>
      <ul className="mt-3 space-y-1">
        {links.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className="block rounded-[var(--radius-md)] px-2 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--background-secondary)]"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
