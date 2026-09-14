import type { Metadata } from "next";

import { preparePageMeta } from "@/components/content/page-helpers";
import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";
import {
  ExternalLink,
  OrganicVsSponsoredSplit,
} from "@/components/trust/external-link";
import { InlineAlert } from "@/components/feedback/states";

export const metadata: Metadata = preparePageMeta({
  title: "Partneři",
  description:
    "Organické informace vs. sponzorované odkazy — jasné oddělení od Majetio skóre.",
  path: "/partneri",
});

export default function PartneriPage() {
  return (
    <StandardPageLayout>
      <PageHeader
        title="Partneři"
        description="Majetio není realitní kancelář. Partneři (např. financování) jsou oddělení od organického skóre a valuace."
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { label: "Partneři" },
        ]}
      />

      <InlineAlert tone="info" title="Komerční integrita">
        Placené nebo partnerské odkazy označujeme jako sponzorované. Neovlivňují
        Majetio skóre ani modelovaný odhad.
      </InlineAlert>

      <div className="mt-10">
        <OrganicVsSponsoredSplit
          organic={
            <ul className="list-disc space-y-2 pl-5 text-sm text-[var(--text-secondary)]">
              <li>
                Metodika a skóre — veřejná dokumentace na{" "}
                <a
                  href="/metodika"
                  className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
                >
                  /metodika
                </a>
                .
              </li>
              <li>
                Katalog zdrojů —{" "}
                <a
                  href="/zdroje-dat"
                  className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
                >
                  /zdroje-dat
                </a>
                .
              </li>
            </ul>
          }
          sponsored={
            <ul className="space-y-3 text-sm">
              <li>
                <ExternalLink
                  href="https://www.hypotekajasne.cz"
                  sponsored
                >
                  HypotekaJasne.cz — hypoteční produkt partnera
                </ExternalLink>
              </li>
            </ul>
          }
        />
      </div>
    </StandardPageLayout>
  );
}
