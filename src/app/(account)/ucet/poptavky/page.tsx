import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-layouts";
import { EmptyState } from "@/components/feedback/states";
import { auth } from "@/lib/auth";
import { listSellerInquiries } from "@/domains/listings/seller/seller-listing-service";

export default async function PoptavkyPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/prihlaseni?callbackUrl=/ucet/poptavky");
  }

  const inquiries = await listSellerInquiries(session.user.id);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Přijaté poptávky"
        description="Zájemci z detailu nabídky. Izolováno podle vašich nabídek — cizí poptávky neuvidíte."
      />

      {!inquiries.length ? (
        <EmptyState
          title="Žádné poptávky"
          description="Jakmile někdo odešle zájem z detailu vaší publikované nabídky, objeví se zde."
        />
      ) : (
        <ul className="space-y-4">
          {inquiries.map((inq) => (
            <li
              key={inq.id}
              className="rounded-lg border border-[var(--border-default)] p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link
                  href={`/nemovitosti/${inq.property.slug}`}
                  className="font-medium underline-offset-2 hover:underline"
                >
                  {inq.property.title}
                </Link>
                <span className="text-xs text-[var(--text-muted)]">
                  {inq.createdAt.toLocaleString("cs-CZ")} · {inq.status}
                </span>
              </div>
              <p className="mt-2 text-sm text-[var(--text-secondary)]">
                {inq.buyerName || "Anonymní zájemce"}
                {inq.buyerEmail ? ` · ${inq.buyerEmail}` : ""}
                {inq.buyerPhone ? ` · ${inq.buyerPhone}` : ""}
              </p>
              {inq.message ? (
                <p className="mt-3 text-sm text-[var(--text-primary)]">
                  {inq.message}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
