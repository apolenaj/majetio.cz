import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";

import { MortgageLeadDetailCard } from "@/components/financing/mortgage-lead-detail-card";
import { InlineAlert } from "@/components/feedback/states";
import { auth } from "@/lib/auth";
import { buildLoginUrl } from "@/lib/auth/callback-url";
import { loadMortgageLeadDetail } from "@/lib/financing/mortgage-leads-actions";
import { isOnboardingPending } from "@/lib/onboarding/actions";

type Props = { params: Promise<{ correlationId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { correlationId } = await params;
  return {
    title: `Financování · ${correlationId.slice(0, 12)}`,
    robots: { index: false, follow: false },
  };
}

export default async function FinancovaniDetailPage({ params }: Props) {
  const { correlationId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect(buildLoginUrl(`/ucet/financovani/${correlationId}`));
  }
  if (await isOnboardingPending(session.user.id)) redirect("/onboarding");

  const result = await loadMortgageLeadDetail(correlationId);
  if (!result.ok) {
    if (result.error.includes("nenalezen")) notFound();
    return (
      <InlineAlert tone="error" title="Nepodařilo se načíst detail">
        {result.error}
      </InlineAlert>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/ucet/financovani"
          className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          ← Zpět na financování
        </Link>
        <h1 className="mt-2 text-h2 text-[var(--text-primary)]">Stav financování</h1>
      </div>
      <MortgageLeadDetailCard lead={result.data} />
    </div>
  );
}
