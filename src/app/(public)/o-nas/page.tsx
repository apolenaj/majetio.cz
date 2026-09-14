import type { Metadata } from "next";
import Link from "next/link";

import { preparePageMeta } from "@/components/content/page-helpers";
import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";
import {
  CompanyIdentityPlaceholder,
  DoDontSplit,
} from "@/components/trust/do-dont";
import { ButtonLink } from "@/components/ui/button-link";
import { ABOUT_DO, ABOUT_DONT } from "@/content/trust";

export const metadata: Metadata = preparePageMeta({
  title: "O nás",
  description:
    "Co Majetio dělá a nedělá — analytická platforma, ne realitní kancelář ani znalecký ústav.",
  path: "/o-nas",
});

export default function ONasPage() {
  return (
    <StandardPageLayout>
      <PageHeader
        title="O Majetio"
        description="Transparentně: pomáháme rozhodovat o nemovitostech pomocí dat a modelů. Nejsme banka, znalec ani právní poradce."
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { label: "O nás" },
        ]}
      />

      <div className="mt-10 max-w-3xl space-y-12">
        <section className="space-y-3">
          <h2 className="font-display text-h2 text-[var(--text-primary)]">
            Proč existujeme
          </h2>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            Koupě bytu nebo domu je velké rozhodnutí. Majetio spojuje nabídku s
            modelovaným odhadem, scénáři výnosu a limity — abyste viděli, co je
            data, co je předpoklad a co je jen orientace.
          </p>
        </section>

        <DoDontSplit doItems={ABOUT_DO} dontItems={ABOUT_DONT} />

        <CompanyIdentityPlaceholder />

        <section className="space-y-3">
          <h2 className="font-display text-h2 text-[var(--text-primary)]">
            Důvěra a dokumenty
          </h2>
          <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
            <li>
              <Link
                href="/duvera-a-bezpecnost"
                className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
              >
                Důvěra a bezpečnost
              </Link>
            </li>
            <li>
              <Link
                href="/metodika"
                className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
              >
                Metodika
              </Link>
            </li>
            <li>
              <Link
                href="/ochrana-soukromi"
                className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
              >
                Ochrana soukromí
              </Link>
            </li>
            <li>
              <Link
                href="/podminky"
                className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
              >
                Podmínky
              </Link>
            </li>
            <li>
              <Link
                href="/slovnik"
                className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
              >
                Slovník
              </Link>
            </li>
          </ul>
        </section>

        <div className="flex flex-wrap gap-3">
          <ButtonLink href="/jak-to-funguje">Jak to funguje</ButtonLink>
          <ButtonLink href="/kontakt" variant="secondary">
            Kontakt
          </ButtonLink>
        </div>
      </div>
    </StandardPageLayout>
  );
}
