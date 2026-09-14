import type { Metadata } from "next";
import { PreparingPage } from "@/components/content/page-helpers";

export const metadata: Metadata = {
  title: "Návratnost investice",
  description: "Struktura kalkulačky „Návratnost investice“. Výpočtová logika přijde ve Fázi 3 — bez falešných výsledků.",
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <PreparingPage
      title="Návratnost investice"
      description="Struktura kalkulačky „Návratnost investice“. Výpočtová logika přijde ve Fázi 3 — bez falešných výsledků."
    />
  );
}
