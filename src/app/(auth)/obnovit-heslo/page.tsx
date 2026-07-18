import type { Metadata } from "next";
import Link from "next/link";

import { ResetPasswordForm } from "@/components/auth/auth-forms";
import { InlineAlert } from "@/components/feedback/states";
import { PageHeader } from "@/components/layout/page-layouts";
import { Container } from "@/components/ui/container";

export const metadata: Metadata = {
  title: "Obnovit heslo",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ token?: string; email?: string }>;
};

export default async function ObnovitHesloPage({ searchParams }: Props) {
  const { token, email } = await searchParams;
  const valid = Boolean(token && email);

  return (
    <Container width="form" className="py-16 sm:py-20">
      <PageHeader
        title="Obnovit heslo"
        description="Nastavte nové heslo. Odkaz je jednorázový a časově omezený."
      />
      {!valid ? (
        <InlineAlert tone="error" title="Neplatný odkaz">
          Odkaz pro obnovení hesla chybí nebo je neúplný.{" "}
          <Link href="/zapomenute-heslo" className="underline underline-offset-2">
            Požádat o nový
          </Link>
        </InlineAlert>
      ) : (
        <ResetPasswordForm email={email!} token={token!} />
      )}
    </Container>
  );
}
