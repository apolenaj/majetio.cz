import type { Metadata } from "next";
import Link from "next/link";

import { LoginForm } from "@/components/auth/auth-forms";
import { PageHeader } from "@/components/layout/page-layouts";
import { Container } from "@/components/ui/container";
import { getSafeCallbackUrl } from "@/lib/auth/callback-url";

export const metadata: Metadata = {
  title: "Přihlášení",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ callbackUrl?: string; error?: string }> };

export default async function PrihlaseniPage({ searchParams }: Props) {
  const params = await searchParams;
  const safeReturn = getSafeCallbackUrl(params.callbackUrl);

  return (
    <Container width="form" className="py-16 sm:py-20">
      <PageHeader
        title="Přihlášení"
        description="Přihlaste se e-mailem a heslem. Po úspěchu vás vrátíme na původní stránku."
      />
      <LoginForm callbackUrl={safeReturn} />
      <p className="mt-6 text-xs text-[var(--text-muted)]">
        Po přihlášení: <code className="text-[0.7rem]">{safeReturn}</code>
        {" · "}
        <Link href="/ochrana-soukromi" className="underline underline-offset-2">
          Ochrana údajů
        </Link>
      </p>
    </Container>
  );
}
