import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AccountDashboard } from "@/components/account/account-dashboard";
import { LogoutButton } from "@/components/auth/logout-button";
import { InlineAlert } from "@/components/feedback/states";
import { auth } from "@/lib/auth";
import { buildLoginUrl } from "@/lib/auth/callback-url";
import { loadAccountDashboard } from "@/lib/financial-passport/actions";
import { isOnboardingPending } from "@/lib/onboarding/actions";

export const metadata: Metadata = {
  title: "Můj účet",
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

  const result = await loadAccountDashboard();
  if (!result.ok) {
    return (
      <InlineAlert tone="error" title="Nepodařilo se načíst přehled">
        {result.error}
      </InlineAlert>
    );
  }

  return (
    <div className="space-y-10">
      <AccountDashboard data={result.data} />
      <div className="border-t border-[var(--border-default)] pt-6">
        <LogoutButton />
      </div>
    </div>
  );
}
