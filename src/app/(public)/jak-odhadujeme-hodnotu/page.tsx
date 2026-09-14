import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

import { preparePageMeta } from "@/components/content/page-helpers";

export const metadata: Metadata = preparePageMeta({
  title: "Jak odhadujeme hodnotu",
  description:
    "Comparables, úpravy, interval p20–p80 a confidence — jak Majetio modeluje hodnotu bytu.",
  path: "/jak-odhadujeme-hodnotu",
});

/** Canonical content lives under Methodology Hub. */
export default function JakOdhadujemeHodnotuPage() {
  permanentRedirect("/metodika/odhad-hodnoty");
}
