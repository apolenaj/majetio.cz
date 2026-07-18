import Link from "next/link";

import { AccountSidebar } from "@/components/account/account-sidebar";
import { Logo } from "@/components/brand/logo";
import { MobileBottomNavigation } from "@/components/navigation/mobile-nav";
import { Container } from "@/components/ui/container";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-[var(--background-primary)]">
      <header className="border-b border-[var(--border-default)] bg-[var(--surface-primary)]">
        <Container className="flex h-14 items-center justify-between">
          <Link href="/">
            <Logo variant="dark" size="sm" label="Majetio — úvod" />
          </Link>
          <nav aria-label="Účet — rychlé odkazy" className="hidden gap-4 text-sm sm:flex">
            <Link
              href="/nemovitosti"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Nemovitosti
            </Link>
            <Link
              href="/analyza"
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            >
              Analýza
            </Link>
          </nav>
        </Container>
      </header>

      <Container className="grid flex-1 gap-8 py-8 pb-24 lg:grid-cols-[14rem_1fr] lg:pb-10">
        <aside className="hidden lg:block">
          <AccountSidebar />
        </aside>
        <main id="main-content">{children}</main>
      </Container>

      <MobileBottomNavigation />
    </div>
  );
}
