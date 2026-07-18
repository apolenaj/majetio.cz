import type { Metadata } from "next";

import { InlineAlert } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-layouts";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { preparePageMeta } from "@/components/content/page-helpers";
import { validateListingUrl } from "@/lib/listing-url";

export const metadata: Metadata = preparePageMeta({
  title: "Nová analýza",
  description:
    "Pokračujte v analýze nemovitosti. Import URL se připravuje — údaje doplníte ručně.",
  path: "/analyza/nova",
});

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export default async function Page({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const source = firstParam(params.source);
  const rawListingUrl = firstParam(params.listingUrl);
  const validated = rawListingUrl ? validateListingUrl(rawListingUrl) : null;
  const listingUrl = validated?.ok ? validated.url : undefined;

  return (
    <Container className="py-12 sm:py-16" width="form">
      <PageHeader
        title="Nová analýza"
        description="První krok je hotový. V další fázi doplníte detaily nemovitosti a spustíte výpočet."
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { href: "/analyza", label: "Analýza" },
          { label: "Nová" },
        ]}
      />

      {source === "url" && listingUrl ? (
        <InlineAlert tone="info" title="Odkaz přijat" className="mb-6">
          Uložili jsme odkaz na inzerát pro další krok. Automatický import dat zatím
          neprobíhá — údaje doplníte ručně, jakmile bude formulář připravený.
          <p className="mt-2 break-all text-[var(--text-primary)]">{listingUrl}</p>
        </InlineAlert>
      ) : null}

      {source === "url" && rawListingUrl && !listingUrl ? (
        <InlineAlert tone="warning" title="Odkaz nelze použít" className="mb-6">
          Adresa neprošla validací. Vraťte se na homepage a vložte veřejný HTTPS odkaz
          z podporovaného realitního portálu, nebo pokračujte ručním zadáním.
        </InlineAlert>
      ) : null}

      {source === "manual" ? (
        <InlineAlert tone="info" title="Ruční zadání" className="mb-6">
          Vybrali jste ruční vstup. Formulář s typem, lokalitou a cenou doplníme v další
          fázi — záměrně zde zatím nejsou falešné výpočty.
        </InlineAlert>
      ) : null}

      {!source ? (
        <InlineAlert tone="info" title="Připravujeme" className="mb-6">
          Vstup do nové analýzy má připravenou strukturu. Import URL a výpočty se doplní
          v dalších fázích.
        </InlineAlert>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <ButtonLink href="/analyza">Zpět na analýzu</ButtonLink>
        <ButtonLink href="/#rychla-analyza" variant="secondary">
          Změnit vstup na homepage
        </ButtonLink>
      </div>
    </Container>
  );
}
