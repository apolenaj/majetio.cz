import type { Metadata } from "next";
import Link from "next/link";

import { preparePageMeta } from "@/components/content/page-helpers";
import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";
import {
  MethodologySectionBody,
  MethodologyToc,
} from "@/components/methodology/methodology-blocks";
import { ContextualDisclaimer, MethodologyLink } from "@/components/trust";
import { InlineAlert } from "@/components/feedback/states";
import {
  METHODOLOGY_REVALIDATE_SECONDS,
  METHODOLOGY_SECTIONS,
} from "@/content/methodology/hub";
import {
  buildMethodologyFaqJsonLd,
  buildMethodologyHubJsonLd,
} from "@/lib/seo/methodology-jsonld";

export const revalidate = METHODOLOGY_REVALIDATE_SECONDS;

export const metadata: Metadata = preparePageMeta({
  title: "Metodika",
  description:
    "Jak Majetio počítá modelované odhady, IRR, NOI, hypotéky, ARV, Maximum Offer a skóre — včetně limitů a role AI.",
  path: "/metodika",
});

export default function MetodikaHubPage() {
  const hubLd = buildMethodologyHubJsonLd();
  const faqLd = buildMethodologyFaqJsonLd();

  return (
    <StandardPageLayout>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(hubLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqLd) }}
      />

      <PageHeader
        title="Metodika Majetio"
        description="Transparentní popis modelů: odkud bereme vstupy, co počítáme a kde končí jistota. Modelovaný odhad není univerzální pravda."
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { label: "Metodika" },
        ]}
      />

      <InlineAlert tone="info" title="Bez false certainty">
        Nepoužíváme formulace typu „skutečná hodnota je…“. Správně: modelovaný
        odhad, orientační rozpětí, nabídková cena.
      </InlineAlert>

      <p className="mt-4 text-sm">
        <Link
          href="/metodika/verze"
          className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
        >
          Aktuální verze metodiky a historie
        </Link>
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-12">
        <MethodologyToc
          sections={METHODOLOGY_SECTIONS}
          className="lg:sticky lg:top-24 lg:self-start"
        />

        <div className="space-y-16">
          {METHODOLOGY_SECTIONS.map((section) => (
            <div
              key={section.slug}
              id={section.slug}
              className="scroll-mt-24 border-b border-[var(--border-default)] pb-16 last:border-b-0"
            >
              <p className="mb-4 text-[var(--text-caption)]">
                <Link
                  href={`/metodika/${section.slug}`}
                  className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
                >
                  Otevřít samostatnou stránku sekce
                </Link>
              </p>
              <MethodologySectionBody section={section} headingLevel="h2" />
            </div>
          ))}

          <ContextualDisclaimer context="general">
            <p>
              Tato metodika popisuje software a modely Majetio. Nenahrazuje
              právní, daňové ani investiční poradenství. AI shrnutí nesmí
              generovat právní fakta — viz sekci{" "}
              <Link
                href="/metodika/ai-a-vysvetlitelnost"
                className="font-medium text-[var(--text-link)] underline-offset-2 hover:underline"
              >
                AI a vysvětlitelnost
              </Link>
              .
            </p>
            <p className="mt-2 flex flex-wrap gap-3">
              <MethodologyLink topic="data-sources" />
              <MethodologyLink topic="valuation" />
              <MethodologyLink topic="yield" />
            </p>
          </ContextualDisclaimer>
        </div>
      </div>
    </StandardPageLayout>
  );
}
