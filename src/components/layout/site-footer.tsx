import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import { brand } from "@/config/brand";

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

/** Compact horizontal footer matching homepage reference. */
const FOOTER_LINKS = [
  { href: "/o-nas", label: "O nás" },
  { href: "/ochrana-soukromi", label: "Ochrana soukromí" },
  { href: "/kontakt", label: "Kontakt" },
  { href: "/cookies", label: "Cookies" },
  { href: "/metodika", label: "Metodika" },
  { href: "/podminky", label: "Obchodní podmínky" },
  { href: "/zdroje-dat", label: "Zdroje dat" },
  { href: "/pravni-upozorneni", label: "Právní upozornění" },
  { href: "/duvera-a-bezpecnost", label: "Důvěra a bezpečnost" },
] as const;

export function SiteFooter() {
  return (
    <footer className="home-footer mt-auto">
      <Container className="home-footer-inner">
        <div>
          <Logo variant="dark" size="sm" label="Majetio" />
          <p className="home-footer-tag">Nemovitosti s větším významem.</p>
        </div>

        <div>
          <nav className="home-footer-links" aria-label="Patička">
            {FOOTER_LINKS.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="home-footer-finance">
            Financování s{" "}
            <a
              href="https://hypotekajasne.cz"
              rel="noopener noreferrer"
              target="_blank"
            >
              HypotekaJasne.cz
            </a>
          </p>
        </div>

        <div className="flex flex-col items-start gap-3 lg:items-end">
          <ul className="home-footer-social">
            {SOCIAL.map((item) => (
              <li key={item.label}>
                <a
                  href={item.href}
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
      </Container>
      <div className="home-footer-copy">
        <Container className="flex flex-col gap-0.5 sm:flex-row sm:justify-between">
          <p>
            © {new Date().getFullYear()} {brand.domains.cz}
          </p>
          <p>Všechna práva vyhrazena.</p>
        </Container>
      </div>
    </footer>
  );
}
