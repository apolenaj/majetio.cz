import type { Metadata } from "next";
import Link from "next/link";

import { preparePageMeta } from "@/components/content/page-helpers";
import { InlineAlert } from "@/components/feedback/states";
import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";
import {
  TrustCenterNav,
  TrustCenterSectionBlock,
} from "@/components/trust/trust-center";
import { TRUST_CENTER_SECTIONS } from "@/content/trust";

export const metadata: Metadata = preparePageMeta({
  title: "Důvěra a bezpečnost",
  description:
    "Zdroje dat, metodika, soukromí, bezpečnostní kontroly a responsible disclosure — faktická tvrzení, ne absolutní slogany.",
  path: "/duvera-a-bezpecnost",
});

export default function DuveraABezpecnostPage() {
  return (
    <StandardPageLayout>
      <PageHeader
        title="Důvěra a bezpečnost"
        description="Fakta o tom, jak pracujeme s daty a přístupem. Popisujeme kontroly (HTTPS, oprávnění, audit) — ne absolutní marketingové slogany."
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { label: "Důvěra a bezpečnost" },
        ]}
      />

      <InlineAlert tone="info" title="Bez false certainty">
        Bezpečnost je soubor konkrétních kontrol (HTTPS, oprávnění, audit). Žádný
        systém není bez rizika — chyby hlaste přes responsible disclosure.
      </InlineAlert>

      <div className="mt-10 grid gap-10 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-12">
        <TrustCenterNav
          sections={TRUST_CENTER_SECTIONS}
          className="lg:sticky lg:top-24 lg:self-start"
        />
        <div className="space-y-10">
          {TRUST_CENTER_SECTIONS.map((section) => (
            <TrustCenterSectionBlock key={section.id} section={section} />
          ))}

          <nav
            aria-label="Související"
            className="flex flex-wrap gap-4 text-sm"
          >
            <Link
              href="/o-nas"
              className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
            >
              O nás
            </Link>
            <Link
              href="/ucet/soukromi"
              className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
            >
              Privacy Center
            </Link>
            <Link
              href="/slovnik"
              className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
            >
              Slovník pojmů
            </Link>
          </nav>
        </div>
      </div>
    </StandardPageLayout>
  );
}
