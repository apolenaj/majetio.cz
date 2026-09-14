import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { MortgageLeadsPanel } from "@/components/account/mortgage-leads-panel";
import { InlineAlert } from "@/components/feedback/states";
import { auth } from "@/lib/auth";
import { buildLoginUrl } from "@/lib/auth/callback-url";
import { loadMortgageLeadsPage } from "@/lib/financing/mortgage-leads-actions";
import { isOnboardingPending } from "@/lib/onboarding/actions";

export const metadata: Metadata = {
  title: "Financování",
  description: "Sledování stavu požadavků na posouzení financování.",
  robots: { index: false, follow: false },
};

export default async function FinancovaniPage() {
  const session = await auth();
  if (!session?.user?.id) redirect(buildLoginUrl("/ucet/financovani"));
  if (await isOnboardingPending(session.user.id)) redirect("/onboarding");

  const result = await loadMortgageLeadsPage();
  if (!result.ok) {
    return (
      <InlineAlert tone="error" title="Nepodařilo se načíst financování">
        {result.error}
      </InlineAlert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h2 text-[var(--text-primary)]">Financování</h1>
        <p className="mt-2 max-w-2xl text-sm text-[var(--text-secondary)]">
          Přehled požadavků předaných partnerovi HypotekaJasne. Majetio neposkytuje
          úvěr — zde vidíte skutečný stav zpracování, ne schválení hypotéky.
        </p>
      </div>
      <MortgageLeadsPanel leads={result.data.leads} />
    </div>
  );
}
