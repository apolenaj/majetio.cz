import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import { BROKER_NAV } from "@/config/navigation";
import { auth } from "@/lib/auth";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default async function BrokerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/prihlaseni?callbackUrl=/profi");
  }

  return (
    <div className="flex min-h-full flex-col bg-[var(--background-primary)]">
      <header className="border-b border-[var(--border-default)] bg-[var(--surface-primary)]">
        <Container className="flex h-14 items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/profi">
              <Logo variant="dark" size="sm" label="Majetio Profi" />
            </Link>
            <span className="text-xs uppercase tracking-wide text-[var(--text-muted)]">
              Broker
            </span>
          </div>
          <Link
            href="/ucet"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Zpět do účtu
          </Link>
        </Container>
      </header>

      <Container className="grid flex-1 gap-8 py-8 lg:grid-cols-[14rem_1fr]">
        <aside>
          <nav aria-label="Broker navigace" className="space-y-1">
            {BROKER_NAV.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="block rounded-[var(--radius-md)] px-3 py-2 text-sm text-[var(--text-secondary)] hover:bg-[var(--background-secondary)] hover:text-[var(--text-primary)]"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </aside>
        <main id="main-content">{children}</main>
      </Container>
    </div>
  );
}
