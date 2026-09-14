import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PrivacyCenterPanel } from "@/components/privacy/privacy-center-panel";
import { InlineAlert } from "@/components/feedback/states";
import { auth } from "@/lib/auth";
import { buildLoginUrl } from "@/lib/auth/callback-url";
import { prisma } from "@/lib/db";
import { isOnboardingPending } from "@/lib/onboarding/actions";
import { loadConsentsPage } from "@/lib/privacy/consents";
import { listUserConsentRecords } from "@/domains/privacy/consent-records-service";

export const metadata: Metadata = {
  title: "Privacy Center",
  description: "Správa soukromí, souhlasů, exportu dat a výmazu účtu.",
  robots: { index: false, follow: false },
};

export default async function PrivacyCenterPage() {
  const session = await auth();
  if (!session?.user?.id) redirect(buildLoginUrl("/ucet/soukromi"));
  if (await isOnboardingPending(session.user.id)) redirect("/onboarding");

  const [consentsResult, records, user] = await Promise.all([
    loadConsentsPage(),
    listUserConsentRecords(session.user.id),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true, deletionRequestedAt: true },
    }),
  ]);

  if (!consentsResult.ok || !user) {
    return (
      <InlineAlert tone="error" title="Nelze načíst Privacy Center">
        {consentsResult.ok ? "Účet nenalezen." : consentsResult.error}
      </InlineAlert>
    );
  }

  return (
    <PrivacyCenterPanel
      initial={{
        consents: consentsResult.data,
        email: user.email,
        deletionRequestedAt: user.deletionRequestedAt?.toISOString() ?? null,
        records: records.map((r) => ({
          id: r.id,
          purpose: r.purpose,
          recipient: r.recipient,
          sharedScope: r.sharedScope,
          version: r.version,
          granted: r.granted && !r.revokedAt,
          grantedAt: r.grantedAt?.toISOString() ?? null,
          revokedAt: r.revokedAt?.toISOString() ?? null,
          createdAt: r.createdAt.toISOString(),
        })),
      }}
    />
  );
}
