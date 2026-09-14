import type { Metadata } from "next";

import { preparePageMeta } from "@/components/content/page-helpers";
import { InlineAlert } from "@/components/feedback/states";
import { Field, TextInput } from "@/components/forms/field";
import { Select } from "@/components/forms/controls";
import { PageHeader } from "@/components/layout/page-layouts";
import { Button } from "@/components/ui/button";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { Grid } from "@/components/ui/layout-primitives";

export const metadata: Metadata = preparePageMeta({
  title: "Analyzovat nemovitost",
  description:
    "Začněte analýzu vložením URL, výběrem z katalogu nebo ručním zadáním. Výpočty se připravují.",
  path: "/analyza",
});

export default function AnalyzaPage() {
  return (
    <Container className="py-10 sm:py-14">
      <PageHeader
        title="Analyzovat nemovitost"
        description="Vyberte, jak chcete začít. První krok je krátký — detaily doplníte později."
        breadcrumbs={[{ href: "/", label: "Domů" }, { label: "Analýza" }]}
      />

      <InlineAlert tone="info" title="Bez falešných výpočtů" className="mb-8">
        Formuláře připravují strukturu. Import URL a investiční engine přijdou v dalších
        fázích.
      </InlineAlert>

      <Grid cols={2} className="mb-10">
        <Card>
          <h2 className="font-display text-xl">Vložit URL nemovitosti</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Vložte odkaz na inzerát. Import dat zatím neprobíhá.
          </p>
          <form className="mt-4 space-y-3">
            <Field id="url" label="URL inzerátu" helperText="Např. odkaz z realitního portálu">
              <TextInput type="url" placeholder="https://" name="url" />
            </Field>
            <Button type="button" disabled title="Import URL se připravuje">
              Načíst údaje (připravujeme)
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="font-display text-xl">Vybrat z Majetio</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Projděte demonstrační katalog a otevřete detail.
          </p>
          <ButtonLink href="/nemovitosti" className="mt-4" variant="secondary">
            Procházet nemovitosti
          </ButtonLink>
        </Card>

        <Card>
          <h2 className="font-display text-xl">Zadat ručně</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Jen základní údaje — další pole doplníte v dalších krocích.
          </p>
          <form className="mt-4 space-y-3">
            <Field id="type" label="Typ nemovitosti" required>
              <Select name="type" defaultValue="apartment">
                <option value="apartment">Byt</option>
                <option value="house">Dům</option>
                <option value="land">Pozemek</option>
              </Select>
            </Field>
            <Field id="city" label="Lokalita" required>
              <TextInput name="city" placeholder="Město nebo městská část" />
            </Field>
            <Field id="price" label="Kupní cena (Kč)" required>
              <TextInput name="price" inputMode="decimal" placeholder="např. 6500000" />
            </Field>
            <Field id="area" label="Plocha (m²)" optional>
              <TextInput name="area" inputMode="decimal" />
            </Field>
            <Button type="button" disabled title="Uložení analýzy se připravuje">
              Spustit základní analýzu (připravujeme)
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="font-display text-xl">Profesionální analýza</h2>
          <p className="mt-2 text-sm text-[var(--text-secondary)]">
            Kompletní analýza s metodikou a verdiktem — viz ceník.
          </p>
          <ButtonLink href="/cenik" className="mt-4">
            Zobrazit ceník
          </ButtonLink>
        </Card>
      </Grid>
    </Container>
  );
}
