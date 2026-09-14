import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

import { preparePageMeta } from "@/components/content/page-helpers";

export const metadata: Metadata = preparePageMeta({
  title: "Obchodní podmínky",
  description: "Podmínky užívání služeb Majetio.",
  path: "/obchodni-podminky",
});

export default function ObchodniPodminkyRedirect() {
  permanentRedirect("/podminky");
}
