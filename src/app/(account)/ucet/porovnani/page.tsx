import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { EmptyState, InlineAlert } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-layouts";
import { ButtonLink } from "@/components/ui/button-link";
import { Card } from "@/components/ui/card";
import {
  listUserComparisonsAction,
} from "@/domains/comparisons/server/actions";
import { auth } from "@/lib/auth";
import { buildLoginUrl } from "@/lib/auth/callback-url";
import { formatDateTime } from "@/lib/format";
import { isOnboardingPending } from "@/lib/onboarding/actions";

export const metadata: Metadata = {
  title: "Moje porovnání",
  robots: { index: false, follow: false },
};

export default async function UcetPorovnaniPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(buildLoginUrl("/ucet/porovnani"));
  }
  if (await isOnboardingPending(session.user.id)) {
    redirect("/onboarding");
  }

  const result = await listUserComparisonsAction();
  if (!result.ok) {
    return (
      <InlineAlert tone="error" title="Nepodařilo se načíst porovnání">
        {result.error}
      </InlineAlert>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Moje porovnání"
        description="Uložená porovnání z účtu. Rychlý výběr z katalogu najdete na /porovnani."
        actions={
          <ButtonLink href="/porovnani" variant="secondary" size="sm">
            Nové porovnání
          </ButtonLink>
        }
      />

      {result.items.length === 0 ? (
        <EmptyState
          title="Zatím nemáte uložené porovnání"
          description="Přidejte nemovitosti do porovnání v katalogu a uložte sestavu (až 4 položky)."
          action={
            <ButtonLink href="/nemovitosti" variant="secondary">
              Procházet nemovitosti
            </ButtonLink>
          }
        />
      ) : (
        <ul className="space-y-3">
          {result.items.map((item) => (
            <li key={item.id}>
              <Card className="p-4">
                <Link
                  href={`/porovnani/${item.id}`}
                  className="font-display text-lg text-[var(--text-primary)] hover:underline"
                >
                  {item.name?.trim() || "Bez názvu"}
                </Link>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  {item.propertyCount} nemovitostí · upraveno{" "}
                  {formatDateTime(item.updatedAt)}
                </p>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
