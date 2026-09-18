import Link from "next/link";
import { redirect } from "next/navigation";

import { PageHeader } from "@/components/layout/page-layouts";
import { EmptyState } from "@/components/feedback/states";
import { ButtonLink } from "@/components/ui/button-link";
import { auth } from "@/lib/auth";
import { listSellerListings } from "@/domains/listings/seller/seller-listing-service";

export default async function MojeNabidkyPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/prihlaseni?callbackUrl=/ucet/nabidky");
  }

  const listings = await listSellerListings(session.user.id);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Moje nabídky"
        description="Koncepty, publikované inzeráty a přijaté poptávky."
        actions={
          <ButtonLink href="/pridat-nemovitost" size="sm">
            Přidat nemovitost
          </ButtonLink>
        }
      />

      {!listings.length ? (
        <EmptyState
          title="Zatím žádné nabídky"
          description="Vložte první nemovitost — uloží se jako koncept, publikaci spustíte až budete připraveni."
          action={
            <ButtonLink href="/pridat-nemovitost">Přidat nemovitost</ButtonLink>
          }
        />
      ) : (
        <ul className="divide-y divide-[var(--border-default)] rounded-lg border border-[var(--border-default)]">
          {listings.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-4">
              <div>
                <Link
                  href={`/ucet/nabidky/${item.id}`}
                  className="font-medium text-[var(--text-primary)] underline-offset-2 hover:underline"
                >
                  {item.title}
                </Link>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {item.status} · {item.publicCity ?? "—"} · poptávek:{" "}
                  {item._count.inquiries}
                </p>
              </div>
              <div className="flex gap-2 text-sm">
                {item.status === "ACTIVE" ? (
                  <Link
                    href={`/nemovitosti/${item.slug}`}
                    className="text-[var(--text-secondary)] underline-offset-2 hover:underline"
                  >
                    Veřejný detail
                  </Link>
                ) : null}
                <Link
                  href={`/ucet/nabidky/${item.id}`}
                  className="text-[var(--action-primary)] underline-offset-2 hover:underline"
                >
                  Upravit
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}

      <p className="text-sm text-[var(--text-secondary)]">
        <Link href="/ucet/poptavky" className="underline underline-offset-2">
          Přijaté poptávky
        </Link>
      </p>
    </div>
  );
}
