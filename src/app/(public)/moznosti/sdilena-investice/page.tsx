import type { Metadata } from "next";
import Link from "next/link";

import { preparePageMeta } from "@/components/content/page-helpers";
import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";
import { InlineAlert } from "@/components/feedback/states";
import { ModeInterestForm } from "@/components/marketplace/mode-interest-form";

export const metadata: Metadata = preparePageMeta({
  title: "Sdílená investice",
  description:
    "Hledání spoluinvestorů — deklarovaný zájem, čekací listina, bez přijímání peněz bez právního modelu.",
  path: "/moznosti/sdilena-investice",
});

export default function SdilenaInvesticePage() {
  return (
    <StandardPageLayout>
      <PageHeader
        title="Sdílená investice"
        description="Cílová částka a dostupné podíly na konkrétní nabídce. Deklarovaný zájem ≠ vybrané peníze ≠ vlastnictví."
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { href: "/moznosti", label: "Možnosti" },
          { label: "Sdílená investice" },
        ]}
      />
      <InlineAlert tone="warning" title="Bez převodu vlastnictví" className="mb-6">
        Systém nevytváří vlastnictví ani právní účinky z procent. Peníze investorů
        nepřijímáme bez schváleného transakčního modelu. Překročení 100 % jde na čekací
        listinu.
      </InlineAlert>
      <p className="text-sm text-[var(--text-secondary)]">
        Publikujte nabídku v{" "}
        <Link href="/pridat-nemovitost" className="underline underline-offset-2">
          Přidat nemovitost
        </Link>
        , zkopírujte ID z `/ucet/nabidky/[id]` a zaznamenejte zájem.
      </p>
      <ModeInterestForm
        mode="SHARED_INVESTMENT"
        showSharePct
        extraFields={
          <label className="block text-sm font-medium">
            ID nabídky
            <input
              name="propertyId"
              required
              className="mt-1 w-full rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm"
            />
          </label>
        }
      />
    </StandardPageLayout>
  );
}
