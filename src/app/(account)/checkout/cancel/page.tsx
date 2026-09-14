import type { Metadata } from "next";
import Link from "next/link";

import { CheckoutStepProgress } from "@/components/checkout/checkout-step-progress";
import { Container } from "@/components/ui/container";
import { InlineAlert } from "@/components/feedback/states";
import { ButtonLink } from "@/components/ui/button-link";

export const metadata: Metadata = {
  title: "Platba zrušena | Majetio",
  robots: { index: false, follow: false },
};

export default async function CheckoutCancelPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const { orderId } = await searchParams;
  return (
    <Container className="space-y-4 py-10">
      <CheckoutStepProgress current="payment" />
      <InlineAlert tone="warning" title="Platba byla zrušena nebo selhala">
        Entitlement nevznikl (195). Objednávku můžete zkusit znovu.
        {orderId ? ` (orderId: ${orderId})` : ""}
      </InlineAlert>
      <ButtonLink href="/checkout" variant="secondary">
        Zkusit znovu
      </ButtonLink>
      <p className="text-sm">
        <Link href="/ucet/objednavky" className="underline">
          Moje objednávky
        </Link>
      </p>
    </Container>
  );
}
