import type { Metadata } from "next";

import { InvestmentYieldCalculator } from "@/components/calculators";
import { preparePageMeta } from "@/components/content/page-helpers";
import { YieldCalculator } from "@/components/tools";
import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";
import { getSessionUser } from "@/lib/auth/guards";

export const metadata: Metadata = preparePageMeta({
  title: "Investiční výnos",
  description:
    "Hrubý, efektivní a čistý výnos, NOI a cash-on-cash ze sdíleného modelu Majetio.",
  path: "/kalkulacky/investicni-vynos",
});

export default async function InvesticniVynosPage({
  searchParams,
}: {
  searchParams: Promise<{ model?: string }>;
}) {
  const params = await searchParams;
  if (params.model === "pokrocily") {
    const user = await getSessionUser();
    return (
      <StandardPageLayout>
        <PageHeader
          title="Pokročilý investiční model"
          description="Scénáře, citlivost a projekce nad investičním enginem. Stejná anuitní rodina, detailnější předpoklady."
          breadcrumbs={[
            { href: "/", label: "Domů" },
            { href: "/kalkulacky", label: "Kalkulačky" },
            { href: "/kalkulacky/investicni-vynos", label: "Investiční výnos" },
            { label: "Pokročilý model" },
          ]}
        />
        <InvestmentYieldCalculator isAuthenticated={Boolean(user?.id)} />
      </StandardPageLayout>
    );
  }

  return <YieldCalculator />;
}
