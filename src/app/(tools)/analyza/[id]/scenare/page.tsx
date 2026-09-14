import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { EntitlementPaywall } from "@/components/entitlements/entitlement-paywall";
import { PageHeader } from "@/components/layout/page-layouts";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { assertFeatureAccess } from "@/domains/entitlements";
import { auth } from "@/lib/auth";
import { buildLoginUrl } from "@/lib/auth/callback-url";
import { prisma } from "@/lib/db";

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return {
    title: "Analýza · scénáře",
    description: "Plné investiční scénáře — gated FULL_SCENARIOS.",
    robots: { index: false, follow: false },
    alternates: { canonical: `/analyza/${id}/scenare` },
  };
}

/**
 * FULL_SCENARIOS gate — EntitlementService.assertFeatureAccess.
 * Free users see paywall; Buyer Pass / Deep Analysis / Investor Pro unlock.
 */
export default async function AnalysisScenariosPage({ params }: Props) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(buildLoginUrl(`/analyza/${(await params).id}/scenare`));
  }
  const { id } = await params;

  const analysis = await prisma.propertyAnalysis.findUnique({
    where: { id },
    select: { id: true, propertyId: true, userId: true },
  });

  const access = await assertFeatureAccess({
    userId: session.user.id,
    feature: "FULL_SCENARIOS",
    propertyId: analysis?.propertyId ?? null,
  });

  if (!access.allowed) {
    return (
      <Container className="py-10">
        <PageHeader
          title="Scénáře"
          description="Plné scénáře jsou součástí Deep Analysis, Buyer Pass nebo Investor Pro."
          breadcrumbs={[
            { href: "/analyza", label: "Analýza" },
            { href: `/analyza/${id}`, label: id },
            { label: "Scénáře" },
          ]}
        />
        <div className="mt-8">
          <EntitlementPaywall result={access} />
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-10">
      <PageHeader
        title="Scénáře"
        description={`Přístup povolen (${access.source}). Výpočty scénářů se připravují.`}
        breadcrumbs={[
          { href: "/analyza", label: "Analýza" },
          { href: `/analyza/${id}`, label: id },
          { label: "Scénáře" },
        ]}
      />
      <Card className="mt-8 space-y-2 p-6">
        <p className="text-sm text-[var(--text-secondary)]">
          Entitlement feature <code>FULL_SCENARIOS</code> je aktivní
          {access.entitlementId ? ` (${access.entitlementId})` : ""}.
        </p>
        <p className="text-sm text-[var(--text-muted)]">
          Detailní výstupy scénářů se napojí na investment engine — gate je
          připravený.
        </p>
      </Card>
    </Container>
  );
}
