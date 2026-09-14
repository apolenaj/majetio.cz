"use client";

import Image from "next/image";

import { Building2 } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Listing photo — next/image for same-origin paths (LCP); plain img for remote hosts
 * until remotePatterns are configured per PSP/CDN.
 */
export function PropertyListingImage({
  src,
  alt,
  priority = false,
  className,
  unavailable = false,
}: {
  src?: string | null;
  alt: string;
  priority?: boolean;
  className?: string;
  unavailable?: boolean;
}) {
  if (!src) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 text-[var(--text-muted)]">
        <Building2 className="size-8" aria-hidden />
        <span className="text-xs">Fotografie není k dispozici</span>
      </div>
    );
  }

  const sameOrigin = src.startsWith("/") && !src.startsWith("//");
  const imgClass = cn(
    "property-photo h-full w-full rounded-none object-cover",
    unavailable && "opacity-60",
    className,
  );

  if (sameOrigin) {
    return (
      <Image
        src={src}
        alt={alt}
        width={640}
        height={480}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        priority={priority}
        className={imgClass}
      />
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element -- remote listing hosts without allowlist
    <img
      src={src}
      alt={alt}
      width={640}
      height={480}
      loading={priority ? "eager" : "lazy"}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      className={imgClass}
    />
  );
}
