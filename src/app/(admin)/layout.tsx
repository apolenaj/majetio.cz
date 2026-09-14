import Link from "next/link";
import { redirect } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import { AdminNav } from "@/components/admin/admin-nav";
import { ImpersonationBanner } from "@/components/admin/actors-governance-panels";
import { auth } from "@/lib/auth";
import { isAdminZoneRole } from "@/domains/administration";
import {
  getActiveImpersonation,
  readImpersonationTokenFromCookies,
} from "@/domains/users/admin/user-ops";

export const metadata = {
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/prihlaseni?callbackUrl=/admin");
  }
  const role = session.user.role ?? "USER";
  if (!isAdminZoneRole(role)) {
    redirect("/ucet?error=forbidden");
  }

  const token = await readImpersonationTokenFromCookies();
  const impersonation = await getActiveImpersonation({
    actorUserId: session.user.id,
    token,
  });

  return (
    <div className="flex min-h-full flex-col bg-[var(--background-secondary)]">
      {impersonation.active ? (
        <ImpersonationBanner targetEmail={impersonation.targetEmail} />
      ) : null}
      <header className="border-b border-[var(--border-default)] bg-[var(--surface-inverse)] text-[var(--text-inverse)]">
        <Container className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/admin">
              <Logo variant="light" size="sm" label="Majetio admin" />
            </Link>
            <span className="text-xs uppercase tracking-wide text-[var(--action-premium)]">
              Operations
            </span>
          </div>
          <Link href="/ucet" className="text-sm text-white/80 hover:text-white">
            Zpět do účtu
          </Link>
        </Container>
      </header>

      <Container className="grid flex-1 gap-8 py-8 lg:grid-cols-[15rem_1fr]">
        <aside>
          <AdminNav role={role} />
        </aside>
        <main id="main-content">{children}</main>
      </Container>
    </div>
  );
}
