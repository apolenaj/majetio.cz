import type { Metadata } from "next";

import { InvestmentYieldCalculator } from "@/components/calculators";
import { preparePageMeta } from "@/components/content/page-helpers";
import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";
import { getSessionUser } from "@/lib/auth/guards";

export const metadata: Metadata = preparePageMeta({
  title: "Investiční výnos",
  description:
    "Spočítejte hrubý a čistý výnos, cash flow a porovnejte konzervativní i optimistický scénář. Základní mód pro rychlý odhad, pokročilý pro detailní vstupy.",
  path: "/kalkulacky/investicni-vynos",
});

export default async function InvesticniVynosPage() {
  const user = await getSessionUser();

  return (
    <StandardPageLayout>
      <PageHeader
        title="Investiční výnos"
        description="Zadejte cenu, kapitál, úrok a nájem. Výsledky se přepočítávají okamžitě — bez falešných nul za chybějící data."
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { href: "/kalkulacky", label: "Kalkulačky" },
          { label: "Investiční výnos" },
        ]}
      />
      <InvestmentYieldCalculator isAuthenticated={Boolean(user?.id)} />
    </StandardPageLayout>
  );
}
