import type { Metadata } from "next";
import Link from "next/link";

import { ForgotPasswordForm } from "@/components/auth/auth-forms";
import { PageHeader } from "@/components/layout/page-layouts";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Zapomenuté heslo",
  robots: { index: false, follow: false },
};

export default function ZapomenuteHesloPage() {
  return (
    <Container width="form" className="py-16 sm:py-20">
      <PageHeader
        title="Zapomenuté heslo"
        description="Zadejte e-mail. Pokud účet existuje, připravíme odkaz pro obnovení hesla."
      />
      <ForgotPasswordForm />
      <p className="mt-6 text-sm text-[var(--text-secondary)]">
        <Link href="/prihlaseni" className="underline underline-offset-2">
          Zpět na přihlášení
        </Link>
      </p>
    </Container>
  );
}
