"use client";

import * as React from "react";

import { ButtonLink } from "@/components/ui/button-link";
import { track, type AnalyticsEvent } from "@/lib/analytics/events";
import { cn } from "@/lib/utils";

type TrackedButtonLinkProps = React.ComponentProps<typeof ButtonLink> & {
  event: AnalyticsEvent;
};

/** Button-styled link that fires a typed analytics event on click (no PII). */
export function TrackedButtonLink({ event, onClick, ...props }: TrackedButtonLinkProps) {
  return (
    <ButtonLink
      {...props}
      onClick={(e) => {
        track(event);
        onClick?.(e);
      }}
    />
  );
}

type TrackedAnchorProps = React.AnchorHTMLAttributes<HTMLAnchorElement> & {
  event: AnalyticsEvent;
  href: string;
};

export function TrackedAnchor({
  event,
  onClick,
  className,
  children,
  ...props
}: TrackedAnchorProps) {
  return (
    <a
      {...props}
      className={cn(className)}
      onClick={(e) => {
        track(event);
        onClick?.(e);
      }}
    >
      {children}
    </a>
  );
}

/** Fires once when homepage mounts. */
export function HomepageViewTracker({
  experimentH1,
  experimentCta,
  experimentOrder,
}: {
  experimentH1: string;
  experimentCta: string;
  experimentOrder: string;
}) {
  React.useEffect(() => {
    track({
      name: "homepage_viewed",
      props: {
        experiment_h1: experimentH1,
        experiment_cta: experimentCta,
        experiment_order: experimentOrder,
      },
    });
  }, [experimentH1, experimentCta, experimentOrder]);

  return null;
}

/** Fires once when sample analysis enters the viewport. */
export function SampleAnalysisViewTracker() {
  const ref = React.useRef<HTMLDivElement>(null);
  const sent = React.useRef(false);

  React.useEffect(() => {
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry?.isIntersecting || sent.current) return;
        sent.current = true;
        track({ name: "sample_analysis_viewed", props: { isDemo: true } });
        observer.disconnect();
      },
      { threshold: 0.35 },
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref} className="sr-only" aria-hidden data-analytics="sample-analysis-view" />;
}
