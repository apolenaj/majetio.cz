import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { CheckoutWizard } from "@/components/checkout/checkout-wizard";
import { Container } from "@/components/ui/container";
import { formatCzkFromMinor } from "@/config/commerce";
import { listActivePricingPlans } from "@/domains/commerce";
import { isCatalogProductCheckoutAllowed } from "@/domains/commerce/product-availability";
import { auth } from "@/lib/auth";
import { buildLoginUrl } from "@/lib/auth/callback-url";
import { prisma } from "@/lib/db";
import { formatCzk } from "@/lib/format";

export const metadata: Metadata = {
  title: "Pokladna | Majetio",
  robots: { index: false, follow: false },
};

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: Promise<{
    product?: string;
    analysisId?: string;
    propertyId?: string;
  }>;
}) {
  const params = await searchParams;
  const callbackQuery = new URLSearchParams();
  if (params.product) callbackQuery.set("product", params.product);
  if (params.analysisId) callbackQuery.set("analysisId", params.analysisId);
  if (params.propertyId) callbackQuery.set("propertyId", params.propertyId);
  const callbackPath = `/checkout${callbackQuery.toString() ? `?${callbackQuery}` : ""}`;

  const session = await auth();
  if (!session?.user?.id) {
    redirect(buildLoginUrl(callbackPath));
  }
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

  let propertySummary: {
    title: string;
    locality: string;
    priceLabel: string | null;
    photoUrl: string | null;
  } | null = null;
  let propertyId: string | null = null;
  if (params.propertyId) {
    const property = await prisma.property.findUnique({
      where: { id: params.propertyId },
      include: { media: { where: { isPrimary: true }, take: 1 } },
    });
    if (
      property &&
      !property.isDemo &&
      property.status === "ACTIVE" &&
      property.visibility === "PUBLIC"
    ) {
      propertyId = property.id;
      propertySummary = {
        title: property.title,
        locality:
          property.publicLabel ||
          [property.publicDistrict, property.publicCity].filter(Boolean).join(", ") ||
          "Neuvedeno",
        priceLabel:
          property.askingPrice != null ? formatCzk(property.askingPrice) : null,
        photoUrl: property.media[0]?.url ?? null,
      };
    }
  }

  return (
    <Container className="py-10">
      <CheckoutWizard
        defaultEmail={session.user.email}
        defaultName={session.user.name}
        initialProductKey={safeInitial}
        analysisId={params.analysisId ?? null}
        propertyId={propertyId}
        propertySummary={propertySummary}
        products={products}
      />
    </Container>
  );
}
