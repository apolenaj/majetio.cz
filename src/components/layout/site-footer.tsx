import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import { brand } from "@/config/brand";
import { FOOTER_GROUPS } from "@/config/navigation";

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="17.5" cy="6.5" r="1" fill="currentColor" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M6.5 9H3.5v12h3V9zm.25-3.5A1.75 1.75 0 1 1 5 3.75 1.75 1.75 0 0 1 6.75 5.5zM20.5 21h-3v-6.2c0-1.75-.75-2.3-1.7-2.3-.95 0-1.55.55-1.8 1.1-.1.2-.1.5-.1.75V21h-3s.05-11.15 0-12h3v1.9c.45-.7 1.25-1.7 3.15-1.7 2.2 0 3.45 1.45 3.45 4.55V21z" />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M14 9h3V6h-3c-2.2 0-4 1.8-4 4v2H7v3h3v7h3v-7h3.1l.4-3H13v-1.5c0-.8.2-1.5 1-1.5z" />
    </svg>
  );
}

function YouTubeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 5 12 5 12 5s-6 0-7.7.3A2.7 2.7 0 0 0 2.4 7.2 28 28 0 0 0 2 12a28 28 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9C6 19 12 19 12 19s6 0 7.7-.3a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-4.8zM10 15.5v-7l6 3.5-6 3.5z" />
    </svg>
  );
}

const SOCIAL = [
  { href: "https://www.instagram.com/", label: "Instagram", Icon: InstagramIcon },
  { href: "https://www.linkedin.com/", label: "LinkedIn", Icon: LinkedInIcon },
  { href: "https://www.facebook.com/", label: "Facebook", Icon: FacebookIcon },
  { href: "https://www.youtube.com/", label: "YouTube", Icon: YouTubeIcon },
] as const;

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-[var(--surface-inverse)] text-[var(--text-inverse)]">
      <Container className="grid gap-8 py-8 sm:grid-cols-2 lg:grid-cols-6 lg:gap-6 lg:py-9">
        <div className="lg:col-span-2">
          <Logo variant="light" size="md" label="Majetio" />
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-white/70">
            {brand.claims.secondary}
          </p>
          <p className="mt-3 text-sm text-white/55">
            Financování:{" "}
            <a
              href="https://hypotekajasne.cz"
              className="underline underline-offset-2 hover:text-white"
              rel="noopener noreferrer"
              target="_blank"
            >
              HypotekaJasne.cz
            </a>
          </p>
          <ul className="mt-4 flex items-center gap-2">
            {SOCIAL.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
                  className="inline-flex size-8 items-center justify-center rounded-[4px] border border-white/15 text-white/70 transition-colors hover:border-white/35 hover:text-white"
                  aria-label={item.label}
                  rel="noopener noreferrer"
                  target="_blank"
                >
                  <item.Icon className="size-3.5" />
                </a>
              </li>
            ))}
          </ul>
        </div>

        {FOOTER_GROUPS.map((group) => (
          <div key={group.title}>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--action-accent)]">
              {group.title}
            </p>
            <ul className="mt-2.5 space-y-1.5">
              {group.links.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="text-sm text-white/75 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <div className="border-t border-white/10">
        <Container className="flex flex-col gap-1 py-3 text-[11px] text-white/50 sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {brand.domains.cz}
          </p>
          <p>
            Odhad není investiční doporučení.{" "}
            <Link href="/pravni-upozorneni" className="underline underline-offset-2">
              Právní upozornění
            </Link>
          </p>
        </Container>
      </div>
    </footer>
  );
}
