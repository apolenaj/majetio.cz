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
import {
  OPERATOR_IDENTITY,
  OPERATOR_IDENTITY_BLOCKERS,
} from "@/content/operator-identity";
import { COMPANY_PLACEHOLDER } from "@/content/trust";
import { InlineAlert } from "@/components/feedback/states";

export const metadata: Metadata = preparePageMeta({
  title: "Kontakt",
  description:
    "Nezávazná poptávka posouzení nemovitosti a kontaktní údaje provozovatele.",
  path: "/kontakt",
});

export default function KontaktPage() {
  return (
    <StandardPageLayout>
      <PageHeader
        title="Kontakt"
        description="Nezávazně pošlete nemovitost k posouzení, nebo napište na provozní e-mail."
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { label: "Kontakt" },
        ]}
      />

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <PropertyAuditInquiryForm id="kontakt-posoudit" />

        <div className="max-w-2xl space-y-8">
          <InlineAlert
            tone="warning"
            title="Identita provozovatele není kompletní"
          >
            V kódu je publikovaný e-mail{" "}
            <strong>{OPERATOR_IDENTITY.contactEmailPublished}</strong>, ale
            doručitelnost schránky ani obchodní údaje (IČO, sídlo) nejsou v tomto
            repozitáři doložené. Samotné uvedení adresy není důkaz funkčnosti.
          </InlineAlert>

          <section className="space-y-3">
            <h2 className="font-display text-h3 text-[var(--text-primary)]">
              Co ještě chybí k důvěryhodnému kontaktu
            </h2>
            <ul className="list-disc space-y-1 pl-5 text-sm text-[var(--text-secondary)]">
              {OPERATOR_IDENTITY_BLOCKERS.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-h3 text-[var(--text-primary)]">
              Provozní e-mail
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Záměr kontaktu:{" "}
              <a
                href={`mailto:${COMPANY_PLACEHOLDER.contactEmail}`}
                className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
              >
                {COMPANY_PLACEHOLDER.contactEmail}
              </a>
              . Security:{" "}
              <a
                href={`mailto:${COMPANY_PLACEHOLDER.securityEmail}`}
                className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
              >
                {COMPANY_PLACEHOLDER.securityEmail}
              </a>
              .
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="font-display text-h3 text-[var(--text-primary)]">
              Soukromí
            </h2>
            <p className="text-sm text-[var(--text-secondary)]">
              Podrobnosti zpracování údajů:{" "}
              <Link
                href="/ochrana-soukromi"
                className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
              >
                ochrana soukromí
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
              Financování lze řešit s partnerem až po analýze.{" "}
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
