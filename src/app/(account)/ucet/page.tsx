import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { LogoutButton } from "@/components/auth/logout-button";
import { auth } from "@/lib/auth";
import { buildLoginUrl } from "@/lib/auth/callback-url";

export const metadata: Metadata = {
  title: "Můj účet",
  robots: { index: false, follow: false },
};

/**
 * Minimal protected account landing — onboarding / financial passport come in later parts.
 * Middleware + server session check (defense in depth).
 */
export default async function UcetPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect(buildLoginUrl("/ucet"));
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-h2 text-[var(--text-primary)]">Můj účet</h1>
        <p className="mt-2 text-sm text-[var(--text-secondary)]">
          Jste přihlášeni jako {session.user.email}. Tato stránka je záměrně prázdná — další
          funkce účtu doplníme v následujících částech.
        </p>
      </div>
      <LogoutButton />
    </div>
  );
}
