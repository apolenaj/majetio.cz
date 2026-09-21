import type { Metadata } from "next";

import { preparePageMeta } from "@/components/content/page-helpers";
import { CashFlowCalculator } from "@/components/tools";

export const metadata: Metadata = preparePageMeta({
  title: "Cash flow",
  description:
    "Spočítejte příjmy, náklady a měsíční bilanci investiční nemovitosti. Orientační cash-flow kalkulačka Majetio.",
  path: "/kalkulacky/cash-flow",
});

export default function Page() {
  return <CashFlowCalculator />;
}
