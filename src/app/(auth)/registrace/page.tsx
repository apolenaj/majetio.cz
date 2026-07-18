import type { Metadata } from "next";

import { RegisterForm } from "@/components/auth/auth-forms";
import { PageHeader } from "@/components/layout/page-layouts";
import { Container } from "@/components/ui/container";
import { getSafeCallbackUrl } from "@/lib/auth/callback-url";

export const metadata: Metadata = {
  title: "Registrace",
  robots: { index: false, follow: false },
};

type Props = { searchParams: Promise<{ callbackUrl?: string }> };

export default async function RegistracePage({ searchParams }: Props) {
  const { callbackUrl } = await searchParams;
  const safeReturn = getSafeCallbackUrl(callbackUrl);

  return (
    <Container width="form" className="py-16 sm:py-20">
      <PageHeader
        title="Registrace"
        description="Stačí e-mail, heslo a nutný souhlas. Roli účtu nastavuje systém — nelze ji zvolit ve formuláři."
      />
      <RegisterForm callbackUrl={safeReturn} />
    </Container>
  );
}
