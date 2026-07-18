import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { SettingsPanel } from "@/components/account/settings-panel";
import { InlineAlert } from "@/components/feedback/states";
import { auth } from "@/lib/auth";
import { buildLoginUrl } from "@/lib/auth/callback-url";
import { loadSettingsPage } from "@/lib/account/settings-actions";
import { isOnboardingPending } from "@/lib/onboarding/actions";

export const metadata: Metadata = {
  title: "Nastavení účtu",
  robots: { index: false, follow: false },
};

export default async function NastaveniPage() {
  const session = await auth();
  if (!session?.user?.id) redirect(buildLoginUrl("/ucet/nastaveni"));
  if (await isOnboardingPending(session.user.id)) redirect("/onboarding");

  const result = await loadSettingsPage();
  if (!result.ok) {
    return (
      <InlineAlert tone="error" title="Nepodařilo se načíst nastavení">
        {result.error}
      </InlineAlert>
    );
  }

  return <SettingsPanel initial={result.data} />;
}
