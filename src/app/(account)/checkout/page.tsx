import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CheckoutWizard } from "@/components/checkout/checkout-wizard";
import { Container } from "@/components/ui/container";
import { formatCzkFromMinor } from "@/config/commerce";
import { listActivePricingPlans } from "@/domains/commerce";
import { isCatalogProductCheckoutAllowed } from "@/domains/commerce/product-availability";
import { auth } from "@/lib/auth";
import { buildLoginUrl } from "@/lib/auth/callback-url";

export const metadata: Metadata = {
  title: "Pokladna | Majetio",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{ product?: string; analysisId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(buildLoginUrl("/checkout"));
  }
  const params = await searchParams;
  const plans = await listActivePricingPlans();
  const products = plans
    .filter((p) => p.priceGrossMinor >= 0)
    .filter((p) => isCatalogProductCheckoutAllowed(p.key))
    .map((p) => ({
      key: p.key,
      name: p.name,
      priceLabel:
        p.priceGrossMinor === 0
          ? "Zdarma"
          : formatCzkFromMinor(p.priceGrossMinor),
    }));

  const initialKey = params.product ?? "full_analysis";
  const safeInitial =
    products.some((p) => p.key === initialKey) &&
    isCatalogProductCheckoutAllowed(initialKey)
      ? initialKey
      : (products[0]?.key ?? "full_analysis");

  return (
    <Container className="py-10">
      <CheckoutWizard
        defaultEmail={session.user.email}
        defaultName={session.user.name}
        initialProductKey={safeInitial}
        analysisId={params.analysisId ?? null}
        products={products}
      />
    </Container>
  );
}
