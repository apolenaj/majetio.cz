import type { Metadata } from "next";
import { PreparingPage } from "@/components/content/page-helpers";

export const metadata: Metadata = {
  title: "Investiční příležitosti",
  description: "Přehled demonstračních příležitostí — nejde o aktuální tržní nabídky.",
  robots: { index: true, follow: true },
};

export default function Page() {
  return (
    <PreparingPage
      title="Investiční příležitosti"
      description="Přehled demonstračních příležitostí — nejde o aktuální tržní nabídky."
    />
  );
}
