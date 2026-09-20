import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { preparePageMeta } from "@/components/content/page-helpers";
import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";
import { PropertyAuditInquiryForm } from "@/components/marketing/property-audit-inquiry-form";

export const metadata: Metadata = preparePageMeta({
  title: "Domy na klíč",
  description:
    "Nezávazná poptávka domu na klíč nebo katalogové stavby. Transparentní další krok bez falešného katalogu.",
  path: "/domy-na-klic",
});

export default function DomyNaKlicPage() {
  return (
    <StandardPageLayout>
      <PageHeader
        title="Domy na klíč"
        description="Pro zájemce o stavbu nebo katalogový dům. Zatím přijímáme poptávky — nejde o hotový online katalog domů."
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { label: "Domy na klíč" },
        ]}
      />

      <div className="mt-8 grid gap-10 lg:grid-cols-2">
        <div>
          <div className="relative mb-6 aspect-[16/10] overflow-hidden rounded-[var(--radius-card)]">
            <Image
              src="/case-studies/house-after-visualization.png"
              alt=""
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
              priority
            />
          </div>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            Popište lokalitu, rozpočet a preferovaný typ domu. Ozveme se s doplněním
            podkladů. Odeslání není objednávkou stavby ani platbou.
          </p>
          <p className="mt-4 text-sm">
            <Link
              href="/nemovitosti?typ=dum&nabidka=prodej"
              className="font-medium text-[var(--action-accent)] underline-offset-2 hover:underline"
            >
              Prohlédnout domy v katalogu
            </Link>
          </p>
        </div>
        <PropertyAuditInquiryForm
          id="domy-na-klic-poptavka"
          prefill={{ propertyType: "Rodinný dům" }}
        />
      </div>
    </StandardPageLayout>
  );
}
