import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";

export const metadata = {
  robots: { index: false, follow: false },
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-full flex-col bg-[var(--background-primary)]">
      <header className="border-b border-[var(--border-default)]">
        <Container className="flex h-14 items-center justify-between">
          <Link href="/">
            <Logo variant="dark" size="sm" />
          </Link>
          <Link
            href="/jak-to-funguje"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
          >
            Jak to funguje
          </Link>
        </Container>
      </header>
      <main id="main-content" className="flex-1">
        {children}
      </main>
    </div>
  );
}
