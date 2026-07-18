import type { Metadata } from "next";
import Link from "next/link";

import { InlineAlert } from "@/components/feedback/states";
import { ButtonLink } from "@/components/ui/button-link";
import { Container } from "@/components/ui/container";
import { confirmEmailChange } from "@/lib/account/settings-actions";

export const metadata: Metadata = {
  title: "Ověření e-mailu",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ token?: string; uid?: string }> };

export default async function OvereniEmailuPage({ searchParams }: Props) {
  const { token, uid } = await searchParams;

  if (!token || !uid) {
    return (
      <Container width="form" className="py-16">
        <h1 className="text-h2">Ověření e-mailu</h1>
        <p className="mt-3 text-sm text-[var(--text-secondary)]">
          Otevřete odkaz z e-mailu pro potvrzení změny adresy. Bez tokenu nelze nic ověřit.
        </p>
        <div className="mt-6">
          <ButtonLink href="/ucet/nastaveni">Zpět do nastavení</ButtonLink>
        </div>
      </Container>
    );
  }

  const result = await confirmEmailChange({ userId: uid, token });

  return (
    <Container width="form" className="py-16 space-y-6">
      <h1 className="text-h2">Ověření e-mailu</h1>
      {result.ok ? (
        <InlineAlert tone="success" title="E-mail byl změněn">
          {result.message}
        </InlineAlert>
      ) : (
        <InlineAlert tone="error" title="Ověření se nepovedlo">
          {result.error}
        </InlineAlert>
      )}
      <div className="flex flex-col gap-3 sm:flex-row">
        <ButtonLink href="/prihlaseni">Přihlásit se</ButtonLink>
        <ButtonLink href="/ucet/nastaveni" variant="secondary">
          Nastavení
        </ButtonLink>
      </div>
      <p className="text-xs text-[var(--text-muted)]">
        <Link href="/ochrana-osobnich-udaju" className="underline-offset-2 hover:underline">
          Ochrana osobních údajů
        </Link>
      </p>
    </Container>
  );
}
