import type { Metadata } from "next";

import { preparePageMeta } from "@/components/content/page-helpers";
import { RenovationCalculator } from "@/components/tools";

export const metadata: Metadata = preparePageMeta({
  title: "Rekonstrukce",
  description:
    "Odhadněte rozpočet rekonstrukce, rezervu a celkový orientační náklad podle typu prací a plochy.",
  path: "/kalkulacky/rekonstrukce",
});

export default function Page() {
  return <RenovationCalculator />;
}
