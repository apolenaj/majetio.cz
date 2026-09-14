import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";

import { ComparisonWorkspace } from "@/components/comparisons/comparison-workspace";
import { InlineAlert } from "@/components/feedback/states";
import { Container } from "@/components/ui/container";
import { PageHeader } from "@/components/layout/page-layouts";
import { getComparisonViewModelAction } from "@/domains/comparisons/server/actions";
import { auth } from "@/lib/auth";
import { buildLoginUrl } from "@/lib/auth/callback-url";
import { loadFinancialPassport } from "@/lib/financial-passport/actions";

export const metadata: Metadata = {
  title: "Uložené porovnání",
  robots: { index: false, follow: false },
};

export default async function PorovnaniDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(buildLoginUrl(`/porovnani/${id}`));
  }

  const result = await getComparisonViewModelAction({
    comparisonId: id,
    mode: "overview",
    usePassport: true,
  });

  if (!result.ok) {
    if (result.error.includes("nenalezeno")) notFound();
    return (
      <Container className="py-12">
        <InlineAlert tone="error" title="Nepodařilo se načíst porovnání">
          {result.error}
        </InlineAlert>
      </Container>
    );
  }

  let passport = null;
  const loaded = await loadFinancialPassport();
  if (loaded.ok) passport = loaded.state;

  return (
    <Container className="py-12 sm:py-16">
      <PageHeader
        title={result.view.name?.trim() || "Uložené porovnání"}
        description="Canonical ComparisonViewModel — stejné metriky jako u rychlého porovnání."
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { href: "/porovnani", label: "Porovnání" },
          { label: result.view.name?.trim() || "Detail" },
        ]}
      />
      <ComparisonWorkspace
        comparisonId={id}
        initialView={result.view}
        initialSlugs={result.view.properties.map((p) => p.slug)}
        passport={passport}
      />
    </Container>
  );
}
