import type { Metadata } from "next";

import { preparePageMeta } from "@/components/content/page-helpers";
import { ComparisonWorkspace } from "@/components/comparisons/comparison-workspace";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-layouts";
import { comparisonConfig } from "@/config/comparison";
import { auth } from "@/lib/auth";
import { loadFinancialPassport } from "@/lib/financial-passport/actions";

export const metadata: Metadata = preparePageMeta({
  title: "Porovnání nemovitostí",
  description:
    "Porovnejte cenu, výnos, financování a rizika až čtyř nemovitostí v jednom přehledu.",
  path: "/porovnani",
});

function parseSlugs(raw: string | string[] | undefined): string[] {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return [];
  return value
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, comparisonConfig.maxProperties);
}

export default async function PorovnaniPage({
  searchParams,
}: {
  searchParams: Promise<{ ids?: string | string[] }>;
}) {
  const params = await searchParams;
  const slugs = parseSlugs(params.ids);

  const session = await auth();
  let passport = null;
  if (session?.user?.id) {
    const loaded = await loadFinancialPassport();
    if (loaded.ok) passport = loaded.state;
  }

  return (
    <Container className="py-12 sm:py-16">
      <PageHeader
        title="Porovnání nemovitostí"
        description={`Až ${comparisonConfig.maxProperties} nemovitostí — režimy Přehled, Vlastní bydlení, Investice a Financování. Chybějící data nikdy jako nula.`}
        breadcrumbs={[{ href: "/", label: "Domů" }, { label: "Porovnání" }]}
      />
      <ComparisonWorkspace initialSlugs={slugs} passport={passport} />
    </Container>
  );
}
