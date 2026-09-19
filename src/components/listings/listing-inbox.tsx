import { NegotiationManageCard, type NegotiationView } from "@/components/listings/negotiation-manage-card";
import {
  listInquiriesForListing,
  listNegotiationsForListing,
} from "@/domains/listings/negotiations/service";

function toView(row: Awaited<ReturnType<typeof listNegotiationsForListing>>[number]): NegotiationView {
  return {
    id: row.id,
    kind: row.kind,
    status: row.status,
    amountCzk: row.amountCzk,
    currency: row.currency,
    financing: row.financing,
    timeline: row.timeline,
    message: row.message,
    situation: row.situation,
    sharePercent: row.sharePercent,
    shareReference: row.shareReference,
    cashContributionCzk: row.cashContributionCzk,
    proposedTotalPriceCzk: row.proposedTotalPriceCzk,
    purpose: row.purpose,
    hasCoInvestor: row.hasCoInvestor,
    buyerName: row.buyerName,
    buyerEmail: row.buyerEmail,
    buyerPhone: row.buyerPhone,
    noticeStatus: row.noticeStatus,
    createdAt: row.createdAt.toISOString(),
    versions: row.versions.map((version) => ({
      id: version.id,
      actor: version.actor,
      amountCzk: version.amountCzk,
      message: version.message,
      status: version.status,
      createdAt: version.createdAt.toISOString(),
    })),
  };
}

export async function ListingInbox({
  userId,
  propertyId,
}: {
  userId: string;
  propertyId: string;
}) {
  const [inquiries, negotiations] = await Promise.all([
    listInquiriesForListing({ userId, propertyId }),
    listNegotiationsForListing({ userId, propertyId }),
  ]);
  const prices = negotiations.filter((row) => row.kind === "PRICE_OFFER").map(toView);
  const shares = negotiations.filter((row) => row.kind === "CO_PURCHASE").map(toView);

  return (
    <div className="space-y-10">
      <section className="space-y-3">
        <h2 className="font-display text-xl">Dotazy a prohlídky</h2>
        {inquiries.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Zatím žádný dotaz ani žádost o prohlídku.</p>
        ) : (
          <ul className="space-y-3">
            {inquiries.map((inquiry) => (
              <li key={inquiry.id} className="rounded-lg border border-[var(--border-default)] p-4 text-sm">
                <p className="font-medium">{inquiry.buyerName || "Bez jména"}</p>
                <p>{inquiry.buyerEmail}</p>
                {inquiry.buyerPhone ? <p>{inquiry.buyerPhone}</p> : null}
                <p className="mt-2 text-[var(--text-secondary)]">{inquiry.message}</p>
                <p className="mt-2 text-xs text-[var(--text-muted)]">
                  {inquiry.createdAt.toLocaleString("cs-CZ")} · {inquiry.status}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Cenové návrhy</h2>
        <p className="text-sm text-[var(--text-muted)]">
          Vidíte je jen vy jako oprávněný inzerent. Neveřejný cenový práh se sem nevypisuje.
        </p>
        {prices.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Zatím žádný cenový návrh.</p>
        ) : (
          prices.map((item) => <NegotiationManageCard key={item.id} item={item} />)
        )}
      </section>

      <section className="space-y-3">
        <h2 className="font-display text-xl">Zájem o společnou koupi</h2>
        {shares.length === 0 ? (
          <p className="text-sm text-[var(--text-muted)]">Zatím žádná poptávka společné koupě.</p>
        ) : (
          shares.map((item) => <NegotiationManageCard key={item.id} item={item} />)
        )}
      </section>
    </div>
  );
}
