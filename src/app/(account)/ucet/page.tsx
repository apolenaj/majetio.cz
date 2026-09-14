import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { DecisionWorkspaceDashboard } from "@/components/decision-workspace/decision-workspace-dashboard";
import { GuestFavouritesMergePrompt } from "@/components/favourites/guest-favourites-merge-prompt";
import { LogoutButton } from "@/components/auth/logout-button";
import { InlineAlert } from "@/components/feedback/states";
import { loadDecisionWorkspace } from "@/domains/decision-workspace/service/workspace-snapshot";
import { auth } from "@/lib/auth";
import { buildLoginUrl } from "@/lib/auth/callback-url";
import { isOnboardingPending } from "@/lib/onboarding/actions";

export const metadata: Metadata = {
  title: "Rozhodovací centrum",
  robots: { index: false, follow: false },
};

export default async function UcetPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(buildLoginUrl("/ucet"));
  }

  if (await isOnboardingPending(session.user.id)) {
    redirect("/onboarding");
  }

  let data;
  try {
    data = await loadDecisionWorkspace(session.user.id);
  } catch {
    return (
      <InlineAlert tone="error" title="Nepodařilo se načíst rozhodovací centrum">
        Zkuste stránku obnovit. Pokud problém přetrvá, ozvěte se nám.
      </InlineAlert>
    );
  }

  return (
    <div className="space-y-10">
      <GuestFavouritesMergePrompt />
      <DecisionWorkspaceDashboard data={data} />
      <div className="border-t border-[var(--border-default)] pt-6">
        <LogoutButton />
      </div>
    </div>
  );
}
