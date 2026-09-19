"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export type CatalogShot = {
  src: string;
  alt: string;
  label?: string;
};

export function CatalogPhotoGallery({ shots }: { shots: CatalogShot[] }) {
  const [index, setIndex] = useState<number | null>(null);
  const open = index !== null;
  const current = open ? shots[index] : undefined;

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
    };
  }, [open, shots.length]);

  if (shots.length === 0) return null;

  const hero = shots[0];
  if (!hero) return null;
  const side = shots.slice(1, 5);
  const columns = side.length === 0 ? "grid-cols-1" : "sm:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]";

  return (
    <>
      <div className={cn("mt-4 grid gap-1", columns, side.length > 1 && "sm:grid-rows-2")}>
        <PhotoButton
          shot={hero}
          className={cn("h-56 sm:h-auto sm:max-h-[28rem] sm:min-h-72", side.length > 1 && "sm:row-span-2")}
          onOpen={() => setIndex(0)}
        />
        {side.map((shot, offset) => (
          <PhotoButton
            key={`${shot.src}-${offset}`}
            shot={shot}
            className="hidden h-28 sm:block sm:h-auto"
            onOpen={() => setIndex(offset + 1)}
            overlay={offset === side.length - 1 && shots.length > 5 ? `+${shots.length - 5}` : undefined}
          />
        ))}
      </div>
      {shots.length > 1 ? (
        <div className="mt-1 flex gap-1 overflow-x-auto sm:hidden">
          {shots.slice(1).map((shot, offset) => (
            <PhotoButton
              key={`m-${shot.src}-${offset}`}
              shot={shot}
              className="h-20 w-28 shrink-0"
              onOpen={() => setIndex(offset + 1)}
            />
          ))}
        </div>
      ) : null}
      <p className="mt-2 text-sm text-[var(--text-muted)]">
        {shots.length} {shots.length === 1 ? "ilustrační fotografie" : "ilustračních fotografií"}. Nejsou to záběry této nemovitosti.
      </p>

      {current ? (
        <div
          className="fixed inset-0 z-[80] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          aria-label="Fotogalerie"
          onClick={() => setIndex(null)}
        >
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
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "relative block w-full overflow-hidden bg-[var(--surface-sunken)] text-left",
        className,
      )}
    >
      <img src={shot.src} alt={shot.alt} className="h-full w-full object-cover" />
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
