import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { ConsentsPanel } from "@/components/privacy/consents-panel";
import { InlineAlert } from "@/components/feedback/states";
import { auth } from "@/lib/auth";
import { buildLoginUrl } from "@/lib/auth/callback-url";
import { isOnboardingPending } from "@/lib/onboarding/actions";
import { loadConsentsPage } from "@/lib/privacy/consents";

export const metadata: Metadata = {
  title: "Souhlasy",
  description: "Správa souhlasů se zpracováním a předáním dat.",
  robots: { index: false, follow: false },
};

export default async function SouhlasyPage() {
  const session = await auth();
  if (!session?.user?.id) redirect(buildLoginUrl("/ucet/souhlasy"));
  if (await isOnboardingPending(session.user.id)) redirect("/onboarding");

  const result = await loadConsentsPage();
  if (!result.ok) {
    return (
      <InlineAlert tone="error" title="Nepodařilo se načíst souhlasy">
        {result.error}
      </InlineAlert>
    );
  }

  return <ConsentsPanel initial={result.data} />;
}
