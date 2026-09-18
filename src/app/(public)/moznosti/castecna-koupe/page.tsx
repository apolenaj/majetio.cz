import type { Metadata } from "next";

import { preparePageMeta } from "@/components/content/page-helpers";
import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";
import { InlineAlert } from "@/components/feedback/states";
import { ModeInterestForm } from "@/components/marketplace/mode-interest-form";

export const metadata: Metadata = preparePageMeta({
  title: "Částečná koupě a bydlení",
  description:
    "Podíl, nájem za nevlastněnou část a postupný odkup jako oddělené varianty.",
  path: "/moznosti/castecna-koupe",
});

export default function CastecnaKoupePage() {
  return (
    <StandardPageLayout>
      <PageHeader
        title="Částečná koupě a bydlení"
        description="Oddělte spoluvlastnictví, úvěr a postupný odkup. Podíl na ceně není automaticky schválitelná hypotéka."
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { href: "/moznosti", label: "Možnosti" },
          { label: "Částečná koupě" },
        ]}
      />
      <InlineAlert tone="info" title="Nezávazná koordinace" className="mb-6">
        Přijetí návrhu znamená dohodu pokračovat v jednání, nikoli převod vlastnického
        podílu.
      </InlineAlert>
      <p className="mb-4 text-sm text-[var(--text-secondary)]">
        Do zprávy uveďte variantu: podíl / nájem za nevlastněnou část / postupný odkup.
      </p>
      <ModeInterestForm
        mode="PARTIAL_BUY"
        showSharePct
        extraFields={
          <label className="block text-sm font-medium">
            ID nabídky
            <input
              name="propertyId"
              className="mt-1 w-full rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm"
            />
          </label>
        }
      />
    </StandardPageLayout>
  );
}
