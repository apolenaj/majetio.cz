import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { resolveBrokerContext } from "@/domains/organizations/broker-context";
import { PageHeader } from "@/components/ui/page-header";
import { BrokerOnboardingForm } from "@/components/broker/broker-onboarding-form";

export const metadata: Metadata = {
  title: "Broker onboarding",
  robots: { index: false, follow: false },
};

export default async function BrokerOnboardingPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/prihlaseni?callbackUrl=/profi/onboarding");

  const ctx = await resolveBrokerContext(
    session.user.id,
    session.user.role ?? "USER",
  );

  if (ctx.membership?.onboardingCompletedAt) {
    redirect("/profi");
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Onboarding makléře"
        description="Založte organizaci a profil. Odznak ověření uvidíte až po ověření identity/organizace Majetiem — ne automaticky."
      />
      <BrokerOnboardingForm
        existingOrganizationId={ctx.organizationId}
        displayName={ctx.membership?.displayName ?? session.user.name ?? ""}
      />
    </div>
  );
}
