import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SellerListingForm } from "@/components/listings/seller-listing-form";
import { preparePageMeta } from "@/components/content/page-helpers";
import {
  PageHeader,
  StandardPageLayout,
} from "@/components/layout/page-layouts";
import { InlineAlert } from "@/components/feedback/states";
import { auth } from "@/lib/auth";

export const metadata: Metadata = preparePageMeta({
  title: "Přidat nemovitost",
  description:
    "Vložte nabídku prodeje nebo pronájmu — koncept, fotografie a publikace do katalogu Majetio.",
  path: "/pridat-nemovitost",
  noIndex: true,
});

export default async function PridatNemovitostPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/prihlaseni?callbackUrl=/pridat-nemovitost");
  }

  return (
    <StandardPageLayout>
      <PageHeader
        title="Přidat nemovitost"
        description="Uložte koncept, doplňte fotografie a publikujte, až bude nabídka kompletní. Data se při chybě neztratí."
        breadcrumbs={[
          { href: "/", label: "Domů" },
          { href: "/ucet/nabidky", label: "Moje nabídky" },
          { label: "Nová nabídka" },
        ]}
      />
      <InlineAlert tone="info" title="Bez platby předem ≠ zdarma" className="mb-8">
        Vložení nabídky nevyžaduje platbu předem. Odměna portálu se sjednává podle balíčku
        success-fee a vzniká až po doloženém uzavření a potvrzení — ne při odeslání
        poptávky.
      </InlineAlert>
      <SellerListingForm mode="create" />
    </StandardPageLayout>
  );
}
