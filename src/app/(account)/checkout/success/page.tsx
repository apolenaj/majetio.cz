import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { CheckoutStepProgress } from "@/components/checkout/checkout-step-progress";
import { InlineAlert } from "@/components/feedback/states";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button-link";
import { formatMoneyFromMinor } from "@/config/commerce";
import { getOrderForUser } from "@/domains/orders/service/create-order";
import { auth } from "@/lib/auth";
import { buildLoginUrl } from "@/lib/auth/callback-url";

export const metadata: Metadata = {
  title: "Platba dokončena | Majetio",
  robots: { index: false, follow: false },
};

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect(buildLoginUrl("/checkout"));
  const { orderId } = await searchParams;
  if (!orderId) {
    return (
      <Container className="py-10">
        <InlineAlert tone="warning" title="Chybí objednávka">
          Odkaz neobsahuje orderId.
        </InlineAlert>
      </Container>
    );
  }

  const order = await getOrderForUser({
    userId: session.user.id,
    orderId,
  });
  if (!order) {
    return (
      <Container className="py-10">
        <InlineAlert tone="warning" title="Objednávka nenalezena">
          Nemáte přístup k této objednávce (IDOR ochrana).
        </InlineAlert>
      </Container>
    );
  }

  const entitlement = order.entitlements.find((e) => e.status === "ACTIVE");
  const pending = order.entitlements.find((e) => e.status === "PENDING_GRANT");
  const paid = order.status === "PAID";

  const currentStep = entitlement
    ? "success"
    : pending
      ? "entitlement"
      : paid
        ? "confirmation"
        : "payment";

  return (
    <Container className="space-y-6 py-10">
      <CheckoutStepProgress
        current={currentStep}
        completedThrough={
          entitlement ? "success" : paid ? "confirmation" : undefined
        }
      />

      <Card className="space-y-3 p-6">
        <h1 className="font-display text-2xl text-[var(--text-primary)]">
          {paid ? "Platba úspěšná" : `Stav: ${order.status}`}
        </h1>
        <p className="text-sm text-[var(--text-secondary)]">
          Objednávka {order.id} · verze ceny {order.priceVersionKey} ·{" "}
          {formatMoneyFromMinor(order.amountGrossMinor, order.currency)} (DPH{" "}
          {formatMoneyFromMinor(order.amountVatMinor, order.currency)}) ·{" "}
          {order.currency}
        </p>
        {paid ? (
          <InlineAlert tone="info" title="Potvrzení platby">
            Webhook potvrdil platbu. Historická cena zůstává na této objednávce
            (priceVersionKey {order.priceVersionKey}).
          </InlineAlert>
        ) : null}
        {entitlement ? (
          <InlineAlert tone="info" title="Přístup aktivován">
            Entitlement k produktu {entitlement.productKey} je aktivní.
          </InlineAlert>
        ) : null}
        {pending ? (
          <InlineAlert tone="warning" title="Přístup se dokončuje">
            Platba prošla, aktivace přístupu probíhá na pozadí (PENDING_GRANT).
            Systém to znovu zkusí přes retry / reconcile skript.
          </InlineAlert>
        ) : null}
        {!entitlement && !pending && paid ? (
          <InlineAlert tone="warning" title="Přístup se připravuje">
            Platba je potvrzená; entitlement ještě není vidět. Zkuste obnovit
            stránku za chvíli.
          </InlineAlert>
        ) : null}
        <div className="flex flex-wrap gap-2 pt-2">
          <ButtonLink href="/ucet/objednavky" variant="secondary">
            Moje objednávky
          </ButtonLink>
          <ButtonLink href="/analyza" variant="outline">
            Pokračovat k analýze
          </ButtonLink>
        </div>
        <p className="text-xs text-[var(--text-muted)]">
          <Link href="/cenik" className="underline">
            Ceník
          </Link>
        </p>
      </Card>
    </Container>
  );
}
