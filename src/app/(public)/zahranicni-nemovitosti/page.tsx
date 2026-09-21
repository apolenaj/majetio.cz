import type { Metadata } from "next";

import { preparePageMeta } from "@/components/content/page-helpers";
import { ForeignPropertiesHub } from "@/components/foreign-properties/foreign-properties-views";

export const metadata: Metadata = preparePageMeta({
  title: "Zahraniční nemovitosti",
  description:
    "Nemovitosti za hranicemi — cena v lokální měně, orientační CZK, účel a specifika místního trhu.",
  path: "/zahranicni-nemovitosti",
});

export default function ZahranicniNemovitostiPage() {
  return <ForeignPropertiesHub />;
}
