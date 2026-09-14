import type { Metadata } from "next";
import { PreparingPage } from "@/components/content/page-helpers";

export const metadata: Metadata = {
  title: "Majetio skóre",
  description: "Jak skládáme orientační skóre a kdy ho nelze spočítat.",
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <PreparingPage
      title="Majetio skóre"
      description="Jak skládáme orientační skóre a kdy ho nelze spočítat."
    />
  );
}
