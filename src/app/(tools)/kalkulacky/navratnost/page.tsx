import type { Metadata } from "next";

import { preparePageMeta } from "@/components/content/page-helpers";
import { PaybackCalculator } from "@/components/tools";

export const metadata: Metadata = preparePageMeta({
  title: "Návratnost investice",
  description:
    "Spočítejte orientační návratnost investice do nemovitosti z vlastního kapitálu a ročního čistého zisku.",
  path: "/kalkulacky/navratnost",
});

export default function Page() {
  return <PaybackCalculator />;
}
