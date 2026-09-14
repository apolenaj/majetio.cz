import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FavouritesWorkspace } from "@/components/favourites/favourites-workspace";
import { InlineAlert } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-layouts";
import { listFavouritesAction } from "@/domains/favourites/server/actions";
import { auth } from "@/lib/auth";
import { buildLoginUrl } from "@/lib/auth/callback-url";
import { isOnboardingPending } from "@/lib/onboarding/actions";

export const metadata: Metadata = {
  title: "Oblíbené nemovitosti",
  robots: { index: false, follow: false },
};

export default async function OblibenePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(buildLoginUrl("/ucet/oblibene"));
  }
  if (await isOnboardingPending(session.user.id)) {
    redirect("/onboarding");
  }

  const result = await listFavouritesAction({
    page: 1,
    sort: "recently_saved",
  });
  if (!result.ok) {
    return (
      <InlineAlert tone="error" title="Nepodařilo se načíst oblíbené">
        {result.error}
      </InlineAlert>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Oblíbené nemovitosti"
        description="Uložené nabídky a užší výběr — aktuální cena, změna od uložení a stav rozhodování."
        metadata={
          <p className="text-sm text-[var(--text-muted)]">
            {result.counts.all} aktivních
            {result.counts.shortlist > 0
              ? ` · ${result.counts.shortlist} ve výběru`
              : ""}
            {result.counts.archived > 0
              ? ` · ${result.counts.archived} v archivu`
              : ""}
          </p>
        }
      />
      <FavouritesWorkspace
        initialItems={result.items}
        initialPage={result.page}
        initialHasMore={result.hasMore}
        initialTotal={result.total}
        initialCounts={result.counts}
        initialCollections={result.collections}
        initialSort="recently_saved"
      />
    </div>
  );
}
