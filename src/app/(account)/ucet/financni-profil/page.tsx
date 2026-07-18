import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { FinancialPassportForm } from "@/components/financial-passport/passport-form";
import { InlineAlert } from "@/components/feedback/states";
import { auth } from "@/lib/auth";
import { buildLoginUrl } from "@/lib/auth/callback-url";
import { loadFinancialPassport } from "@/lib/financial-passport/actions";
import { isOnboardingPending } from "@/lib/onboarding/actions";

export const metadata: Metadata = {
  title: "Finanční pas",
  robots: { index: false, follow: false },
};

export default async function FinancniProfilPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(buildLoginUrl("/ucet/financni-profil"));
  }

  if (await isOnboardingPending(session.user.id)) {
    redirect("/onboarding");
  }

  const result = await loadFinancialPassport();
  if (!result.ok) {
    return (
      <InlineAlert tone="error" title="Nepodařilo se načíst Finanční pas">
        {result.error}
      </InlineAlert>
    );
  }

  return <FinancialPassportForm initialState={result.state} />;
}
