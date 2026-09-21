import type { Metadata } from "next";

import { preparePageMeta } from "@/components/content/page-helpers";
import { MaxOfferCalculator } from "@/components/tools";

export const metadata: Metadata = preparePageMeta({
  title: "Maximální nabídková cena",
  description:
    "Zjistěte, jakou maximální cenu dává smysl nabídnout při cílovém čistém výnosu a odhadu nájmu.",
  path: "/kalkulacky/maximalni-nabidkova-cena",
});

export default function Page() {
  return <MaxOfferCalculator />;
}
