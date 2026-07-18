import { ExternalLink } from "lucide-react";

import { Container } from "@/components/ui/container";
import { homepageContent } from "@/content/homepage";

/**
 * Trust bar above the hero — only real value (transparency + HypotekaJasne).
 * No fake countdowns or urgency tactics.
 */
export function AnnouncementBar() {
  const { announcement } = homepageContent;

  return (
    <div
      className="border-b border-[var(--border-default)] bg-[var(--background-secondary)]"
      role="region"
      aria-label="Důvěryhodnost a partnerství"
    >
      <Container className="flex flex-col gap-2 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <p className="text-[var(--text-secondary)]">{announcement.text}</p>
        <a
          href={announcement.linkHref}
          className="inline-flex shrink-0 items-center gap-1.5 font-medium text-[var(--text-link)] underline-offset-2 hover:text-[var(--text-link-hover)] hover:underline"
          rel="noopener noreferrer"
          target="_blank"
        >
          {announcement.linkLabel}
          <ExternalLink className="size-3.5" aria-hidden />
          <span className="sr-only">(otevře se v novém okně)</span>
        </a>
      </Container>
    </div>
  );
}
