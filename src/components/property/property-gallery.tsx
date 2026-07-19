"use client";

import { Building2, ChevronLeft, ChevronRight, Expand, X } from "lucide-react";
import * as React from "react";

import type { PublicMediaItem } from "@/domains/properties/service/media-public";
import { AspectRatio } from "@/components/ui/layout-primitives";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

function MediaPlaceholder({
  label = "Fotografie není k dispozici",
  className,
}: {
  label?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full w-full flex-col items-center justify-center gap-2 bg-[var(--surface-sunken)] text-[var(--text-muted)]",
        className,
      )}
    >
      <Building2 className="size-10" aria-hidden />
      <span className="px-4 text-center text-sm">{label}</span>
    </div>
  );
}

function MediaImage({
  item,
  className,
}: {
  item: PublicMediaItem;
  className?: string;
}) {
  if (!item.url || item.isPlaceholder || item.restricted) {
    return (
      <MediaPlaceholder
        label={
          item.restricted
            ? "Fotografie není dostupná (licence)"
            : "Fotografie není k dispozici"
        }
        className={className}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={item.url}
      alt={item.alt ?? ""}
      className={cn("h-full w-full object-cover", className)}
      draggable={false}
    />
  );
}

export function PropertyGallery({
  media,
  title,
}: {
  media: PublicMediaItem[];
  title: string;
}) {
  const items =
    media.length > 0
      ? media
      : [
          {
            url: null,
            type: "PHOTO",
            isPrimary: true,
            isPlaceholder: true,
            alt: null,
            restricted: false,
          } satisfies PublicMediaItem,
        ];

  const [index, setIndex] = React.useState(0);
  const [lightbox, setLightbox] = React.useState(false);
  const touchStartX = React.useRef<number | null>(null);

  const current = items[Math.min(index, items.length - 1)]!;
  const preview = items.slice(0, 4);

  function go(delta: number) {
    setIndex((i) => (i + delta + items.length) % items.length);
  }

  function onTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.changedTouches[0]?.clientX ?? null;
  }

  function onTouchEnd(e: React.TouchEvent) {
    const start = touchStartX.current;
    const end = e.changedTouches[0]?.clientX;
    touchStartX.current = null;
    if (start == null || end == null) return;
    const dx = end - start;
    if (Math.abs(dx) < 48) return;
    go(dx < 0 ? 1 : -1);
  }

  React.useEffect(() => {
    if (!lightbox) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(false);
      if (e.key === "ArrowRight") go(1);
      if (e.key === "ArrowLeft") go(-1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, items.length]);

  return (
    <section aria-label={`Galerie: ${title}`} className="space-y-3">
      <div className="relative overflow-hidden rounded-[var(--radius-card)] border border-[var(--border-default)]">
        <AspectRatio ratio="16/9">
          <button
            type="button"
            className="absolute inset-0 block h-full w-full cursor-zoom-in focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]"
            onClick={() => setLightbox(true)}
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
            aria-label="Otevřít galerii na celou obrazovku"
          >
            <MediaImage item={current} />
          </button>
        </AspectRatio>

        {items.length > 1 ? (
          <>
            <IconButton
              type="button"
              label="Předchozí fotografie"
              variant="secondary"
              size="icon-sm"
              className="absolute top-1/2 left-3 z-10 -translate-y-1/2 bg-[var(--surface-primary)]/90"
              onClick={() => go(-1)}
            >
              <ChevronLeft className="size-4" />
            </IconButton>
            <IconButton
              type="button"
              label="Další fotografie"
              variant="secondary"
              size="icon-sm"
              className="absolute top-1/2 right-3 z-10 -translate-y-1/2 bg-[var(--surface-primary)]/90"
              onClick={() => go(1)}
            >
              <ChevronRight className="size-4" />
            </IconButton>
          </>
        ) : null}

        <IconButton
          type="button"
          label="Celá obrazovka"
          variant="secondary"
          size="icon-sm"
          className="absolute right-3 bottom-3 z-10 bg-[var(--surface-primary)]/90"
          onClick={() => setLightbox(true)}
        >
          <Expand className="size-4" />
        </IconButton>
      </div>

      {preview.length > 1 ? (
        <ul className="grid grid-cols-4 gap-2">
          {preview.map((item, i) => (
            <li key={`${item.url ?? "ph"}-${i}`}>
              <button
                type="button"
                onClick={() => {
                  setIndex(i);
                  setLightbox(true);
                }}
                className={cn(
                  "overflow-hidden rounded-[var(--radius-md)] border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus-ring)]",
                  i === index
                    ? "border-[var(--action-primary)]"
                    : "border-[var(--border-default)]",
                )}
                aria-label={`Náhled ${i + 1}`}
                aria-current={i === index ? "true" : undefined}
              >
                <AspectRatio ratio="4/3">
                  <MediaImage item={item} />
                </AspectRatio>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {lightbox ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Galerie na celou obrazovku"
          className="fixed inset-0 z-[70] flex flex-col bg-[color-mix(in_srgb,var(--brand-ink-950)_92%,black)]"
        >
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <p className="text-sm">
              {index + 1} / {items.length}
            </p>
            <IconButton
              type="button"
              label="Zavřít galerii"
              variant="ghost"
              size="icon-sm"
              className="text-white hover:bg-white/10"
              onClick={() => setLightbox(false)}
            >
              <X className="size-5" />
            </IconButton>
          </div>
          <div
            className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-8"
            onTouchStart={onTouchStart}
            onTouchEnd={onTouchEnd}
          >
            <div className="relative max-h-full w-full max-w-5xl overflow-hidden rounded-[var(--radius-md)]">
              <AspectRatio ratio="16/9">
                <MediaImage item={current} />
              </AspectRatio>
            </div>
            {items.length > 1 ? (
              <>
                <IconButton
                  type="button"
                  label="Předchozí"
                  variant="secondary"
                  className="absolute left-4 top-1/2 -translate-y-1/2"
                  onClick={() => go(-1)}
                >
                  <ChevronLeft className="size-5" />
                </IconButton>
                <IconButton
                  type="button"
                  label="Další"
                  variant="secondary"
                  className="absolute right-4 top-1/2 -translate-y-1/2"
                  onClick={() => go(1)}
                >
                  <ChevronRight className="size-5" />
                </IconButton>
              </>
            ) : null}
          </div>
        </div>
      ) : null}
    </section>
  );
}
