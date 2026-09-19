"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/utils";

export type CatalogShot = {
  src: string;
  alt: string;
  label?: string;
};

const GALLERY_HEIGHT = "h-[min(26rem,52vw)] sm:h-[26rem]";

export function CatalogPhotoGallery({ shots }: { shots: CatalogShot[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const open = index !== null;
  const current = open ? shots[index] : undefined;
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const titleId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIndex(null);
        return;
      }
      if (event.key === "ArrowRight") {
        setIndex((value) => (value === null ? value : (value + 1) % shots.length));
      }
      if (event.key === "ArrowLeft") {
        setIndex((value) =>
          value === null ? value : (value - 1 + shots.length) % shots.length,
        );
      }
    };
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
      triggerRef.current?.focus();
    };
  }, [open, shots.length]);

  if (shots.length === 0) return null;

  const hero = shots[0];
  if (!hero) return null;

  const previewCount = Math.min(shots.length, 5);
  const side = shots.slice(1, previewCount);
  const hiddenCount = shots.length - previewCount;
  const columns =
    side.length === 0
      ? "grid-cols-1"
      : side.length === 1
        ? "sm:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)]"
        : "sm:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]";

  function openAt(i: number, button: HTMLButtonElement | null) {
    triggerRef.current = button;
    setIndex(i);
  }

  return (
    <>
      <div className={cn("grid gap-1 overflow-hidden rounded-2xl", GALLERY_HEIGHT, columns)}>
        <PhotoButton
          shot={hero}
          className="h-full min-h-0"
          onOpen={(button) => openAt(0, button)}
        />
        {side.length > 0 ? (
          <div
            className={cn(
              "hidden h-full min-h-0 gap-1 sm:grid",
              side.length === 1 ? "grid-rows-1" : "grid-rows-2",
              side.length >= 3 && "grid-cols-2",
            )}
          >
            {side.map((shot, offset) => (
              <PhotoButton
                key={`${shot.src}-${offset}`}
                shot={shot}
                className={cn(
                  "h-full min-h-0",
                  side.length === 3 && offset === 0 && "row-span-2",
                )}
                onOpen={(button) => openAt(offset + 1, button)}
                overlay={
                  offset === side.length - 1 && hiddenCount > 0
                    ? `+${hiddenCount}`
                    : undefined
                }
              />
            ))}
          </div>
        ) : null}
      </div>

      {shots.length > 1 ? (
        <div className="mt-2 flex items-center justify-between gap-3">
          <div className="flex gap-1 overflow-x-auto sm:hidden">
            {shots.slice(1).map((shot, offset) => (
              <PhotoButton
                key={`m-${shot.src}-${offset}`}
                shot={shot}
                className="h-16 w-24 shrink-0 rounded-lg"
                onOpen={(button) => openAt(offset + 1, button)}
              />
            ))}
          </div>
          <button
            type="button"
            className="text-sm font-medium text-[var(--text-primary)] underline-offset-2 hover:underline"
            onClick={(event) => openAt(0, event.currentTarget)}
          >
            Všech {shots.length} {shots.length === 1 ? "fotografie" : "fotografií"}
          </button>
        </div>
      ) : (
        <p className="mt-2 text-sm text-[var(--text-muted)]">
          Ilustrační snímek. Fotografie této nemovitosti budou doplněny.
        </p>
      )}

      {current ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          onClick={() => setIndex(null)}
        >
          <p id={titleId} className="sr-only">
            Fotogalerie
          </p>
          <button
            type="button"
            className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
            aria-label="Zavřít"
            onClick={() => setIndex(null)}
          >
            <X className="size-5" aria-hidden />
          </button>
          <button
            type="button"
            className="absolute left-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:left-6"
            aria-label="Předchozí fotka"
            onClick={(event) => {
              event.stopPropagation();
              setIndex((value) =>
                value === null ? value : (value - 1 + shots.length) % shots.length,
              );
            }}
          >
            <ChevronLeft className="size-6" aria-hidden />
          </button>
          <figure className="max-h-[85vh] max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <img
              src={current.src}
              alt={current.alt}
              className="max-h-[78vh] w-auto max-w-full object-contain"
            />
            <figcaption className="mt-3 text-center text-sm text-white">
              {current.label ? `${current.label} · ` : null}
              {(index ?? 0) + 1} / {shots.length}
            </figcaption>
          </figure>
          <button
            type="button"
            className="absolute right-3 rounded-full bg-white/10 p-2 text-white hover:bg-white/20 sm:right-6"
            aria-label="Další fotka"
            onClick={(event) => {
              event.stopPropagation();
              setIndex((value) => (value === null ? value : (value + 1) % shots.length));
            }}
          >
            <ChevronRight className="size-6" aria-hidden />
          </button>
        </div>
      ) : null}
    </>
  );
}

function PhotoButton({
  shot,
  className,
  overlay,
  onOpen,
}: {
  shot: CatalogShot;
  className?: string;
  overlay?: string;
  onOpen: (button: HTMLButtonElement) => void;
}) {
  return (
    <button
      type="button"
      onClick={(event) => onOpen(event.currentTarget)}
      className={cn(
        "relative block w-full overflow-hidden bg-[var(--surface-sunken)] text-left",
        className,
      )}
    >
      <img
        src={shot.src}
        alt={shot.alt}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {shot.label ? (
        <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-0.5 text-[0.65rem] font-semibold text-white">
          {shot.label}
        </span>
      ) : null}
      {overlay ? (
        <span className="absolute inset-0 flex items-center justify-center bg-black/45 text-lg font-semibold text-white">
          {overlay}
        </span>
      ) : null}
    </button>
  );
}
