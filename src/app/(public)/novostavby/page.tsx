import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { preparePageMeta } from "@/components/content/page-helpers";
import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";

export const metadata: Metadata = preparePageMeta({
  title: "Novostavby a projekty",
  description:
    "Developerské projekty a novostavby. Prohlédněte katalog nebo pošlete poptávku na hledání na míru.",
  path: "/novostavby",
});

export default function NovostavbyPage() {
  return (
    <StandardPageLayout>
      <PageHeader
        title="Novostavby a projekty"
        description="Sekce pro developerské projekty a nové byty. Nejde o fiktivní katalog — napojujeme skutečné nabídky a poptávky."
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { label: "Novostavby" },
        ]}
      />

      <div className="mt-8 grid gap-8 lg:grid-cols-2 lg:items-center">
        <div className="relative aspect-[16/10] overflow-hidden rounded-[var(--radius-card)]">
          <Image
            src="/case-studies/homepage-hero.png"
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 1024px) 100vw, 50vw"
            priority
          />
        </div>
        <div>
          <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
            V katalogu filtrujte byty a domy vhodné jako novostavby. Pokud hledáte
            konkrétní projekt, pošlete nezávaznou poptávku — automaticky nestahujeme
            cizí inzeráty bez oprávnění.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/nemovitosti?typ=byt&nabidka=prodej"
              className="inline-flex h-11 items-center rounded-[var(--radius-lg)] bg-[var(--action-accent)] px-5 text-sm font-medium text-white"
            >
              Prohlédnout katalog
            </Link>
            <Link
              href="/sluzby/hledani-na-zadani"
              className="inline-flex h-11 items-center rounded-[var(--radius-lg)] border border-[var(--border-strong)] px-5 text-sm font-medium"
            >
              Poptat hledání na míru
            </Link>
          </div>
        </div>
      </div>
    </StandardPageLayout>
  );
}
