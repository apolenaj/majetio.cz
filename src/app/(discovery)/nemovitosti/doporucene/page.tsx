import type { Metadata } from "next";
import { PreparingPage } from "@/components/content/page-helpers";

export const metadata: Metadata = {
  title: "Doporučené nemovitosti",
  description: "Doporučení podle finančního profilu se připravuje.",
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <PreparingPage
      title="Doporučené nemovitosti"
      description="Doporučení podle finančního profilu se připravuje."
    />
  );
}
