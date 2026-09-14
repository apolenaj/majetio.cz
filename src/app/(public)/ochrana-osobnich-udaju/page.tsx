import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

import { preparePageMeta } from "@/components/content/page-helpers";

export const metadata: Metadata = preparePageMeta({
  title: "Ochrana osobních údajů",
  description: "Jak zpracováváme osobní údaje.",
  path: "/ochrana-osobnich-udaju",
});

export default function OchranaOsobnichUdajuRedirect() {
  permanentRedirect("/ochrana-soukromi");
}
