import type { Metadata } from "next";

import { preparePageMeta } from "@/components/content/page-helpers";
import { PageHeader } from "@/components/layout/page-layouts";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = preparePageMeta({
  title: "Jak to funguje",
  description:
    "Jak probíhá základní a kompletní analýza, odkud bereme data a co Majetio nenahrazuje.",
  path: "/jak-to-funguje",
});

export default function JakToFungujePage() {
  return (
    <Container className="py-12 sm:py-16">
      <PageHeader
        title="Jak Majetio funguje"
        description="Konkrétní kroky — ne jen marketingové fráze."
        breadcrumbs={[{ href: "/", label: "Domů" }, { label: "Jak to funguje" }]}
      />

      <div className="max-w-2xl space-y-8 text-sm leading-relaxed text-[var(--text-secondary)]">
        <section>
          <h2 className="font-display text-xl text-[var(--text-primary)]">Co Majetio řeší</h2>
          <p className="mt-2">
            Pomáhá odpovědět, zda se konkrétní nemovitost vyplatí koupit — pro bydlení i
            investici. Spojuje nabídku s analýzou hodnoty, výnosů, rizik a financování.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl text-[var(--text-primary)]">
            Základní vs. kompletní analýza
          </h2>
          <p className="mt-2">
            Základní analýza dává orientační metriky. Kompletní profesionální analýza
            přidává scénáře, lokalitu, rekonstrukci, rizika a doporučenou nabídkovou cenu.
            Ceny jsou v ceníku z centrální konfigurace.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl text-[var(--text-primary)]">Data a odhady</h2>
          <p className="mt-2">
            Oddělujeme ověřená data, odhady a demonstrační ukázky. Odhad není záruka.
            Předpoklady můžete později upravit ve scénářích.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl text-[var(--text-primary)]">Financování</h2>
          <p className="mt-2">
            Orientační výpočet může vzniknout v Majetio. Hypoteční porovnání a poradenství
            řeší HypotekaJasne.cz — předání dat jen se souhlasem.
          </p>
        </section>
        <section>
          <h2 className="font-display text-xl text-[var(--text-primary)]">Co nenahrazujeme</h2>
          <p className="mt-2">
            Nejsme náhrada za právní služby, technickou inspekci, znalecký odhad ani
            bankovní rozhodnutí. Analýza podporuje rozhodnutí, negarantuje výsledek.
          </p>
        </section>
      </div>

      <div className="mt-10 flex flex-wrap gap-3">
        <ButtonLink href="/analyza">Vyzkoušet analýzu</ButtonLink>
        <ButtonLink href="/nemovitosti" variant="secondary">
          Procházet nemovitosti
        </ButtonLink>
        <ButtonLink href="/cenik" variant="outline">
          Zobrazit ceník
        </ButtonLink>
      </div>
    </Container>
  );
}
