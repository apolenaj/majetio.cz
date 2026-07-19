"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { track } from "@/lib/analytics/events";

export type DetailSectionId =
  | "prehled"
  | "ekonomika"
  | "scenare"
  | "financovani"
  | "rizika"
  | "lokalita"
  | "historie"
  | "zdroje"
  | "alternativa";

export const DETAIL_SECTIONS: { id: DetailSectionId; label: string }[] = [
  { id: "prehled", label: "Přehled" },
  { id: "ekonomika", label: "Ekonomika" },
  { id: "scenare", label: "Scénáře" },
  { id: "financovani", label: "Financování" },
  { id: "rizika", label: "Rizika" },
  { id: "lokalita", label: "Lokalita" },
  { id: "historie", label: "Historie" },
  { id: "zdroje", label: "Zdroje" },
  { id: "alternativa", label: "Alternativy" },
];

/**
 * Sticky in-page section navigation for Decision Cockpit.
 */
export function PropertyDetailSectionNav({
  sections = DETAIL_SECTIONS,
}: {
  sections?: { id: DetailSectionId; label: string }[];
}) {
  const [active, setActive] = React.useState<string>(sections[0]?.id ?? "prehled");

  React.useEffect(() => {
    const nodes = sections
      .map((s) => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (nodes.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);
        const top = visible[0]?.target.id;
        if (top) setActive(top);
      },
      { rootMargin: "-20% 0px -55% 0px", threshold: [0.1, 0.35, 0.6] },
    );
    for (const n of nodes) observer.observe(n);
    return () => observer.disconnect();
  }, [sections]);

  return (
    <nav
      aria-label="Sekce detailu nemovitosti"
      className="sticky top-16 z-20 -mx-4 mb-6 border-y border-[var(--border-default)] bg-[color-mix(in_srgb,var(--surface-primary)_92%,transparent)] px-4 py-2 backdrop-blur-md sm:-mx-0 sm:rounded-[var(--radius-md)] sm:border"
    >
      <ul className="flex gap-1 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sections.map((s) => (
          <li key={s.id} className="shrink-0">
            <a
              href={`#${s.id}`}
              className={cn(
                "inline-flex h-9 items-center rounded-[var(--radius-sm)] px-3 text-sm font-medium transition-colors",
                active === s.id
                  ? "bg-[var(--action-primary)] text-[var(--text-inverse)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--background-secondary)] hover:text-[var(--text-primary)]",
              )}
              onClick={() => {
                track({
                  name: "property_detail_section_nav",
                  props: { section: s.id },
                });
              }}
            >
              {s.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
