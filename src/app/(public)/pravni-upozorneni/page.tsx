import type { Metadata } from "next";
import { LegalPage, preparePageMeta } from "@/components/content/page-helpers";

export const metadata: Metadata = preparePageMeta({
  title: "Právní upozornění",
  description: "Omezení odpovědnosti a upozornění k analýzám.",
  path: "/pravni-upozorneni",
});

export default function Page() {
  return (
    <LegalPage title="Právní upozornění" description="Omezení odpovědnosti a upozornění k analýzám.">
      <p>
        Text této stránky bude doplněn právním týmem před spuštěním produkčních služeb.
        Záměrně zde neuvádíme fiktivní znění podmínek.
      </p>
      <p>Struktura stránky: červenec 2026.</p>
    </LegalPage>
  );
}
