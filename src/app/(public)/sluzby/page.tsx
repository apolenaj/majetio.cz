import type { Metadata } from "next";
import Link from "next/link";

import { preparePageMeta } from "@/components/content/page-helpers";
import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";

export const metadata: Metadata = preparePageMeta({
  title: "Služby",
  description:
    "Příprava inzerátu, analýza před koupí a hledání nemovitosti na zadání — s jasnou cenou a rozsahem.",
  path: "/sluzby",
});

const SERVICES = [
  {
    href: "/sluzby/priprava-inzeratu",
    title: "Příprava inzerátu",
    text: "Text, struktura a pořadí fotografií. Zveřejnění zvlášť.",
  },
  {
    href: "/sluzby/analyza-pred-koupi",
    title: "Analýza před koupí",
    text: "Ekonomika, scénáře, rizika a další ověření.",
  },
  {
    href: "/sluzby/hledani-na-zadani",
    title: "Hledání na zadání",
    text: "30denní projekt a posouzení až pěti kandidátů.",
  },
] as const;

export default function SluzbyHubPage() {
  return (
    <StandardPageLayout>
      <PageHeader
        title="Služby"
        description="Doplňkové služby k katalogu nemovitostí. Každá má jasný rozsah a cenu na ceníku."
        breadcrumbs={[{ href: "/", label: "Domů" }, { label: "Služby" }]}
      />
      <ul className="grid gap-4 md:grid-cols-3">
        {SERVICES.map((service) => (
          <li key={service.href}>
            <Link
              href={service.href}
              className="block h-full rounded-[var(--radius-lg)] border border-[var(--border-default)] p-5 hover:border-[var(--border-strong)]"
            >
              <h2 className="font-display text-xl text-[var(--text-primary)]">
                {service.title}
              </h2>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">{service.text}</p>
            </Link>
          </li>
        ))}
      </ul>
      <p className="mt-8 text-sm text-[var(--text-muted)]">
        Kompletní ceny:{" "}
        <Link href="/cenik" className="underline underline-offset-2">
          ceník
        </Link>
        .
      </p>
    </StandardPageLayout>
  );
}
