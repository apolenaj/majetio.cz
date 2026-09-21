import type { Metadata } from "next";

import { preparePageMeta } from "@/components/content/page-helpers";
import { ToolsHub } from "@/components/tools";

export const metadata: Metadata = preparePageMeta({
  title: "Analýzy a kalkulačky",
  description:
    "Profesionální centrum nástrojů Majetio — výnos, cash flow, financování, rekonstrukce a modelové studie.",
  path: "/analyzy-a-kalkulacky",
});

export default function AnalyzyAKalkulackyPage() {
  return <ToolsHub />;
}
