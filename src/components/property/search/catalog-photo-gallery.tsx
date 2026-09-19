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

  const hero = shots.slice(0, shots[1]?.label === "Po rekonstrukci" ? 2 : 1);
  const rest = shots.slice(hero.length);
  const premiumSplit = hero.length === 2;

  return (
    <>
      <div className="mt-6 space-y-1">
        <div className={cn("grid gap-1", premiumSplit && "sm:grid-cols-2")}>
          {hero.map((shot, shotIndex) => (
            <PhotoButton
              key={`${shot.src}-${shot.label ?? shotIndex}`}
              shot={shot}
              wide={!premiumSplit}
              onOpen={() => setIndex(shotIndex)}
            />
          ))}
        </div>
        {rest.length > 0 ? (
          <ul className="grid grid-cols-2 gap-1 sm:grid-cols-4">
            {rest.map((shot, offset) => (
              <li key={`${shot.src}-${offset}`}>
                <PhotoButton shot={shot} onOpen={() => setIndex(hero.length + offset)} />
              </li>
            ))}
          </ul>
        ) : null}
      </div>

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
  wide = false,
  onOpen,
}: {
  shot: CatalogShot;
  wide?: boolean;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "relative block w-full overflow-hidden bg-[var(--surface-sunken)] text-left",
        wide ? "aspect-video" : "aspect-[4/3]",
      )}
    >
      <img src={shot.src} alt={shot.alt} className="h-full w-full object-cover" />
      {shot.label ? (
        <span className="absolute bottom-3 left-3 rounded-full bg-black/60 px-2.5 py-1 text-[0.65rem] font-bold uppercase tracking-wide text-white">
          {shot.label}
        </span>
      ) : null}
    </button>
  );
}
