import type { Metadata } from "next";
import { PreparingPage } from "@/components/content/page-helpers";

export const metadata: Metadata = {
  title: "Cash flow",
  description: "Struktura kalkulačky „Cash flow“. Výpočtová logika přijde ve Fázi 3 — bez falešných výsledků.",
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <PreparingPage
      title="Cash flow"
      description="Struktura kalkulačky „Cash flow“. Výpočtová logika přijde ve Fázi 3 — bez falešných výsledků."
    />
  );
}
