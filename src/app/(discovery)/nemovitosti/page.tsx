import type { Metadata } from "next";

import { InlineAlert } from "@/components/feedback/states";
import { EmptyState } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-layouts";
import { PropertyCard } from "@/components/property/property-card";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { Grid } from "@/components/ui/layout-primitives";
import { TextInput } from "@/components/forms/field";
import { Select } from "@/components/forms/controls";
import { preparePageMeta } from "@/components/content/page-helpers";
import { DEMO_PROPERTIES } from "@/content/demo-properties";

export const metadata: Metadata = preparePageMeta({
  title: "Nemovitosti",
  description:
    "Procházejte demonstrační nabídky Majetio. Filtry a katalog se připravují — nejde o živý trh.",
  path: "/nemovitosti",
});

type Props = { searchParams: Promise<{ typ?: string; q?: string }> };

export default async function NemovitostiPage({ searchParams }: Props) {
  const params = await searchParams;
  let items = DEMO_PROPERTIES;
  if (params.typ === "byt") {
    items = items.filter((p) => p.href.includes("byt") || p.disposition?.includes("+kk"));
  } else if (params.typ === "dum") {
    items = items.filter((p) => p.href.includes("dum") || (p.disposition?.includes("+1") ?? false));
  }

  return (
    <Container className="py-10 sm:py-14">
      <PageHeader
        title="Nemovitosti"
        description="Demonstrační katalog pro ověření navigace a filtrů. Nejde o aktuální tržní nabídky."
        breadcrumbs={[{ href: "/", label: "Domů" }, { label: "Nemovitosti" }]}
        badge={<Badge tone="premium">Demo data</Badge>}
        actions={
          <ButtonLink href="/analyza" size="sm">
            Analyzovat nemovitost
          </ButtonLink>
        }
      />

      <InlineAlert tone="warning" title="Demonstrační nabídky" className="mb-8">
        Zobrazené nemovitosti slouží k ověření informační architektury. Nejsou aktuální
        inzeráty z trhu.
      </InlineAlert>

      <form className="mb-8 grid gap-3 rounded-[var(--radius-card)] border border-[var(--border-default)] bg-[var(--surface-primary)] p-4 sm:grid-cols-[1fr_12rem_auto]">
        <TextInput
          name="q"
          placeholder="Hledat lokalitu nebo název (demo)"
          defaultValue={params.q}
          aria-label="Hledat nemovitosti"
        />
        <Select name="typ" defaultValue={params.typ ?? ""} aria-label="Typ nemovitosti">
          <option value="">Všechny typy</option>
          <option value="byt">Byty</option>
          <option value="dum">Rodinné domy</option>
          <option value="pozemek">Pozemky</option>
        </Select>
        <ButtonLink href="/nemovitosti" variant="secondary" className="justify-center">
          Reset filtrů
        </ButtonLink>
      </form>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 text-sm text-[var(--text-secondary)]">
        <p>
          Nalezeno: <strong className="font-metric text-[var(--text-primary)]">{items.length}</strong>{" "}
          (demo)
        </p>
        <p>Řazení: připravujeme</p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Nebyly nalezeny žádné nemovitosti odpovídající zadaným filtrům"
          description="Upravte cenu, lokalitu nebo investiční kritéria."
          action={
            <ButtonLink href="/nemovitosti" variant="secondary">
              Zobrazit všechny demo nabídky
            </ButtonLink>
          }
        />
      ) : (
        <Grid cols={3}>
          {items.map((property) => (
            <PropertyCard key={property.href} property={property} />
          ))}
        </Grid>
      )}
    </Container>
  );
}
