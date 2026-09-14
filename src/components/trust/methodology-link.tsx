import Link from "next/link";
import { BookOpen, ExternalLink } from "lucide-react";

import { cn } from "@/lib/utils";
import {
  METHODOLOGY_HREFS,
  type MethodologyTopic,
} from "./types";

export type MethodologyLinkProps = {
  topic?: MethodologyTopic;
  /** Override default href from topic. */
  href?: string;
  children?: React.ReactNode;
  className?: string;
  /** Open in new tab (rare — prefer same-tab for trust docs). */
  external?: boolean;
  showIcon?: boolean;
};

const DEFAULT_LABELS: Record<MethodologyTopic, string> = {
  general: "Jak Majetio počítá data",
  valuation: "Jak odhadujeme hodnotu",
  yield: "Jak počítáme výnos",
  score: "Jak funguje Majetio skóre",
  "data-sources": "Zdroje dat",
};

/**
 * Standardized link into methodology / trust documentation.
 */
export function MethodologyLink({
  topic = "general",
  href,
  children,
  className,
  external = false,
  showIcon = true,
}: MethodologyLinkProps) {
  const target = href ?? METHODOLOGY_HREFS[topic];
  const label = children ?? DEFAULT_LABELS[topic];

  return (
    <Link
      href={target}
      className={cn(
        "inline-flex items-center gap-1.5 text-[var(--text-label-s)] font-medium text-[var(--text-link)] underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
        className,
      )}
      {...(external
        ? { target: "_blank", rel: "noopener noreferrer" }
        : {})}
      data-trust-methodology={topic}
    >
      {showIcon ? (
        external ? (
          <ExternalLink className="size-3.5 shrink-0" aria-hidden />
        ) : (
          <BookOpen className="size-3.5 shrink-0" aria-hidden />
        )
      ) : null}
      <span>{label}</span>
    </Link>
  );
}
