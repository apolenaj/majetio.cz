import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-layouts";
import { InlineAlert } from "@/components/feedback/states";
import { ButtonLink } from "@/components/ui/button-link";
import { formatMoneyFromMinor } from "@/config/commerce";
import { listMyOrdersAction } from "@/domains/orders/server/actions";
import { auth } from "@/lib/auth";
import { buildLoginUrl } from "@/lib/auth/callback-url";
import { isOnboardingPending } from "@/lib/onboarding/actions";

export const metadata: Metadata = {
  title: "Objednávky",
  robots: { index: false, follow: false },
};

const STATUS_CS: Record<string, string> = {
  PENDING: "Čeká",
  AWAITING_PAYMENT: "Čeká na platbu",
  PAID: "Zaplaceno",
  CANCELLED: "Zrušeno",
  REFUNDED: "Refundováno",
  PARTIALLY_REFUNDED: "Částečně refundováno",
  CHARGEBACK: "Chargeback",
};

export default async function UcetObjednavkyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect(buildLoginUrl("/ucet/objednavky"));
  if (await isOnboardingPending(session.user.id)) redirect("/onboarding");

  const result = await listMyOrdersAction();
  if (!result.ok) {
    return (
      <InlineAlert tone="error" title="Objednávky">
        {result.error}
      </InlineAlert>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Objednávky"
        description="Historie plateb — stará objednávka drží cenu z doby nákupu (price version)."
        metadata={
          <ButtonLink href="/checkout?product=full_analysis" size="sm" variant="secondary">
            Nová objednávka
          </ButtonLink>
        }
      />

      <InlineAlert tone="info" title="Předplatné a obnova">
        <p>
          Předplatné se <strong>neobnovuje automaticky</strong> bez výslovného
          souhlasu při obnově. Jednorázové produkty (např. analýza) nejsou
          recurring charge.
        </p>
        <p className="mt-2">
          Chcete-li ukončit další obnovu nebo řešit refundaci, napište na{" "}
          <a
            className="underline underline-offset-2"
            href="mailto:podpora@majetio.cz?subject=Zru%C5%A1en%C3%AD%20obnovy%20p%C5%99edplatn%C3%A9ho"
          >
            podpora@majetio.cz
          </a>{" "}
          s předmětem „Zrušení obnovy“ — bez skrytých kroků a bez nutnosti volat.
          Pravidla obnovy:{" "}
          <a className="underline underline-offset-2" href="/cenik">
            ceník
          </a>
          .
        </p>
      </InlineAlert>

      {result.orders.length === 0 ? (
        <InlineAlert tone="info" title="Zatím žádné objednávky">
          Kompletní analýzu objednáte v pokladně.
        </InlineAlert>
      ) : (
        <ul className="space-y-3">
          {result.orders.map((o) => (
            <li
              key={o.id}
              className="rounded-[var(--radius-md)] border border-[var(--border-default)] p-4 text-sm"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <p className="font-medium text-[var(--text-primary)]">
                  {o.productKey} · {STATUS_CS[o.status] ?? o.status}
                </p>
                <p>
                  {formatMoneyFromMinor(o.amountGrossMinor, o.currency)}
                </p>
              </div>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                Verze ceny {o.priceVersionKey} · netto{" "}
                {formatMoneyFromMinor(o.amountNetMinor, o.currency)} + DPH{" "}
                {formatMoneyFromMinor(o.amountVatMinor, o.currency)} (
                {(o.vatRateBp / 100).toFixed(0)} %)
                {o.promoCodeSnapshot ? ` · promo ${o.promoCodeSnapshot}` : ""}
              </p>
              <p className="mt-1 text-xs text-[var(--text-muted)]">
                {o.createdAt.toISOString().slice(0, 10)} ·{" "}
                <a
                  className="underline"
                  href={`/checkout/success?orderId=${o.id}`}
                >
                  Detail
                </a>
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
