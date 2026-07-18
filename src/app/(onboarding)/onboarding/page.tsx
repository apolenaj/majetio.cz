import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { OnboardingWizard } from "@/components/onboarding/onboarding-wizard";
import { auth } from "@/lib/auth";
import { buildLoginUrl } from "@/lib/auth/callback-url";
import { loadOnboardingState } from "@/lib/onboarding/actions";

export const metadata: Metadata = {
  title: "Onboarding",
  robots: { index: false, follow: false },
};

export default async function OnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(buildLoginUrl("/onboarding"));
  }

  const result = await loadOnboardingState();
  if (!result.ok) {
    redirect(buildLoginUrl("/onboarding"));
  }

  return <OnboardingWizard initialState={result.state} />;
}
