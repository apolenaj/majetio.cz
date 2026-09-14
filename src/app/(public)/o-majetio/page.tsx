import type { Metadata } from "next";
import { permanentRedirect } from "next/navigation";

import { preparePageMeta } from "@/components/content/page-helpers";

export const metadata: Metadata = preparePageMeta({
  title: "O Majetio",
  description: "O platformě Majetio.",
  path: "/o-majetio",
});

/** Canonical company page is /o-nas. */
export default function OMajetioRedirect() {
  permanentRedirect("/o-nas");
}
