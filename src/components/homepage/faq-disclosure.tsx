"use client";

import { track } from "@/lib/analytics/events";

export function FaqDisclosure({
  questionId,
  question,
  answer,
}: {
  questionId: string;
  question: string;
  answer: string;
}) {
  return (
    <details
      className="group py-4"
      onToggle={(e) => {
        if ((e.target as HTMLDetailsElement).open) {
          track({ name: "faq_opened", props: { questionId } });
        }
      }}
    >
      <summary className="cursor-pointer list-none font-display text-lg text-[var(--text-primary)] marker:content-none focus-visible:rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)] [&::-webkit-details-marker]:hidden">
        <span className="flex items-start justify-between gap-4">
          {question}
          <span
            aria-hidden
            className="mt-1 shrink-0 text-[var(--text-muted)] transition-transform group-open:rotate-45"
          >
            +
          </span>
        </span>
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-[var(--text-secondary)]">{answer}</p>
    </details>
  );
}
