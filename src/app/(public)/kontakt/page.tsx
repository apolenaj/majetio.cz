import type { Metadata } from "next";
import Link from "next/link";

import { preparePageMeta } from "@/components/content/page-helpers";
import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";
import { CompanyIdentityPlaceholder } from "@/components/trust/do-dont";
import { ExternalLink } from "@/components/trust/external-link";
import { COMPANY_PLACEHOLDER } from "@/content/trust";
import { InlineAlert } from "@/components/feedback/states";

export const metadata: Metadata = preparePageMeta({
  title: "Kontakt",
  description: "Jak nás kontaktovat — podpora, soukromí a security disclosure.",
  path: "/kontakt",
});

export default function KontaktPage() {
  return (
    <StandardPageLayout>
      <PageHeader
        title="Kontakt"
        description="Pište na uvedené adresy. Firemní údaje (IČO) doplní provozovatel — neuvádíme fiktivní čísla."
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { label: "Kontakt" },
        ]}
      />

      <div className="mt-10 max-w-2xl space-y-8">
        <InlineAlert tone="info" title="Bez falešných kontaktů">
          Dokud nejsou zveřejněny oficiální údaje, používejte e-mailové aliasy
          níže jako provozní záměr — ne jako ověřenou schránku třetí strany.
        </InlineAlert>

        <section className="space-y-3">
          <h2 className="font-display text-h3 text-[var(--text-primary)]">
            Podpora produktu
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Dotazy k účtu, analýzám a předplatnému:{" "}
            <a
              href={`mailto:${COMPANY_PLACEHOLDER.contactEmail}`}
              className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
            >
              {COMPANY_PLACEHOLDER.contactEmail}
            </a>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-h3 text-[var(--text-primary)]">
            Soukromí a osobní údaje
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Žádosti o přístup / výmaz: Privacy Center v účtu, nebo e-mail výše s
            předmětem „Soukromí“. Neuvádíme marketingový claim „GDPR compliant“ —
            popisujeme konkrétní kontroly v{" "}
            <Link
              href="/ochrana-soukromi"
              className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
            >
              ochraně soukromí
            </Link>
            .
          </p>
          <p>
            <Link
              href="/ucet/soukromi"
              className="text-sm font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
            >
              Otevřít Privacy Center
            </Link>
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="font-display text-h3 text-[var(--text-primary)]">
            Bezpečnostní hlášení
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Responsible disclosure:{" "}
            <a
              href={`mailto:${COMPANY_PLACEHOLDER.securityEmail}`}
              className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
            >
              {COMPANY_PLACEHOLDER.securityEmail}
            </a>
          </p>
          <p>
            <Link
              href="/duvera-a-bezpecnost#responsible-disclosure"
              className="text-sm font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
            >
              Postup nahlášení →
            </Link>
          </p>
        </section>

        <CompanyIdentityPlaceholder />

        <section className="space-y-2">
          <h2 className="font-display text-h3 text-[var(--text-primary)]">
            Partner financování
          </h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Hypoteční produkt poskytuje partner — ne Majetio. Externí odkaz:
          </p>
          <ExternalLink href="https://www.hypotekajasne.cz">
            HypotekaJasne.cz
          </ExternalLink>
        </section>
      </div>
    </StandardPageLayout>
  );
}
