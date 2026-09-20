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
      <InlineAlert tone="info" title="Cena zveřejnění" className="mb-8">
        Běžná inzerce má pevnou cenu za období zveřejnění — není podmíněná procentní
        provizí z prodeje. Aktuální balíčky najdete na{" "}
        <a href="/cenik#inzerce" className="underline underline-offset-2">
          ceníku
        </a>
        . Koncept můžete uložit dřív, než dokončíte platbu nebo firemní předplatné.
      </InlineAlert>
      <SellerListingForm mode="create" />
    </StandardPageLayout>
  );
}
