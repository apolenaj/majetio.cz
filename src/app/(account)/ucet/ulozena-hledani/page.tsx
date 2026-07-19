import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SavedSearchesPanel } from "@/components/account/saved-searches-panel";
import { InlineAlert } from "@/components/feedback/states";
import { listSavedSearches } from "@/domains/saved-searches/service/actions";
import { auth } from "@/lib/auth";
import { buildLoginUrl } from "@/lib/auth/callback-url";
import { isOnboardingPending } from "@/lib/onboarding/actions";

export const metadata: Metadata = {
  title: "Uložená hledání",
  robots: { index: false, follow: false },
};

export default async function UlozenaHledaniPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(buildLoginUrl("/ucet/ulozena-hledani"));
  }
  if (await isOnboardingPending(session.user.id)) {
    redirect("/onboarding");
  }

  const result = await listSavedSearches();
  if (!result.ok) {
    return (
      <InlineAlert tone="error" title="Nepodařilo se načíst uložená hledání">
        {result.error}
      </InlineAlert>
    );
  }

  return <SavedSearchesPanel initialItems={result.items} />;
}
