import type { Metadata } from "next";
import Link from "next/link";

import { preparePageMeta } from "@/components/content/page-helpers";
import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";
import { PropertyAuditInquiryForm } from "@/components/marketing/property-audit-inquiry-form";
import { CompanyIdentityPlaceholder } from "@/components/trust/do-dont";
import { ExternalLink } from "@/components/trust/external-link";
import { COMPANY_PLACEHOLDER } from "@/content/trust";
import { InlineAlert } from "@/components/feedback/states";

export const metadata: Metadata = preparePageMeta({
  title: "Kontakt",
  description:
    "Nezávazná poptávka posouzení nemovitosti, podpora a soukromí — bez fiktivních firemních údajů.",
  path: "/kontakt",
});

export default function KontaktPage() {
  return (
    <StandardPageLayout>
      <PageHeader
        title="Kontakt"
        description="Nezávazně pošlete nemovitost k posouzení, nebo napište na provozní e-mail. Firemní IČO neuvádíme, dokud není oficiálně zveřejněné."
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { label: "Kontakt" },
        ]}
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <PropertyAuditInquiryForm id="kontakt-posoudit" />

        <div className="max-w-2xl space-y-8">
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
              předmětem „Soukromí“. Popisujeme konkrétní kontroly v{" "}
              <Link
                href="/ochrana-soukromi"
                className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
              >
                ochraně soukromí
              </Link>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-h3 text-[var(--text-primary)]">
              Provozovatel
            </h2>
            <CompanyIdentityPlaceholder />
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-h3 text-[var(--text-primary)]">
              HypotekaJasne.cz
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Financování řešíme přes partnera. Osobní údaje do URL neposíláme.{" "}
              <ExternalLink href="https://hypotekajasne.cz">
                hypotekajasne.cz
              </ExternalLink>
            </p>
          </section>
        </div>
      </div>
    </StandardPageLayout>
  );
}
