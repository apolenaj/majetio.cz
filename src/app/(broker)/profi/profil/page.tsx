import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { resolveBrokerContext } from "@/domains/organizations/broker-context";
import { getBrokerProfile } from "@/domains/organizations/broker-onboarding";
import { VerificationBadge } from "@/components/crm/verification-badge";
import { BrokerProfileEditForm } from "@/components/broker/broker-profile-edit-form";
import { PageHeader } from "@/components/ui/page-header";
import { Card } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Broker profil",
  robots: { index: false, follow: false },
};

export default async function BrokerProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/prihlaseni?callbackUrl=/profi/profil");

  const ctx = await resolveBrokerContext(
    session.user.id,
    session.user.role ?? "USER",
  );
  if (!ctx.organizationId) redirect("/profi/onboarding");

  const profile = await getBrokerProfile({
    actor: ctx.actor,
    organizationId: ctx.organizationId,
  });
  if (!profile.ok) {
    return <PageHeader title="Profil" description={profile.error} />;
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profil makléře"
        description="Veřejný profil a stav ověření. Odznak = ověřená identita/organizace, ne marketingový claim."
      />
      <Card elevation="flat" className="space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <h2 className="font-display text-xl">
            {profile.membership.displayName ?? session.user.name}
          </h2>
          <VerificationBadge
            status={profile.organization.verificationStatus}
          />
        </div>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-[var(--text-muted)]">Organizace</dt>
            <dd>{profile.organization.name}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Plán</dt>
            <dd>{profile.organization.planKey}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">Telefon</dt>
            <dd>{profile.membership.phonePublic ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-[var(--text-muted)]">IČO</dt>
            <dd>{profile.organization.ico ?? "—"}</dd>
          </div>
        </dl>
        {profile.membership.bio ? (
          <p className="text-sm text-[var(--text-secondary)]">
            {profile.membership.bio}
          </p>
        ) : null}
        {!profile.verificationBadge ? (
          <p className="text-sm text-[var(--text-muted)]">
            Odznak ověření se zobrazí až po ověření identity nebo organizace
            Majetiem (UNVERIFIED = bez odznaku). Self-service ověření není
            možné.
          </p>
        ) : null}
      </Card>

      <BrokerProfileEditForm
        organizationId={ctx.organizationId}
        initialDisplayName={profile.membership.displayName ?? ""}
        initialPhone={profile.membership.phonePublic ?? ""}
        initialBio={profile.membership.bio ?? ""}
      />
    </div>
  );
}
