"use client";

import * as React from "react";
import { Heart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import {
  FAVOURITES_CHANGED_EVENT,
  isGuestFavourite,
} from "@/domains/favourites/guest-storage";
import {
  toggleSaveProperty,
} from "@/domains/favourites/client/save";
import {
  SAVE_FAILURE_MESSAGE,
  type FavouriteSaveInput,
} from "@/domains/favourites/types";
import { cn } from "@/lib/utils";

type SavePropertyControlProps = {
  item: FavouriteSaveInput;
  /** Prefer account sync; guests still save locally unless requireAuth. */
  requireAuth?: boolean;
  variant?: "button" | "icon";
  size?: "sm" | "md" | "icon";
  className?: string;
  onToast?: (message: string) => void;
  /** Seed from server when authenticated. */
  initiallySaved?: boolean;
};

export function SavePropertyControl({
  item,
  requireAuth = false,
  variant = "button",
  size = "sm",
  className,
  onToast,
  initiallySaved,
}: SavePropertyControlProps) {
  const [saved, setSaved] = React.useState(
    () =>
      initiallySaved ??
      (isGuestFavourite(item.propertyId) || isGuestFavourite(item.slug)),
  );
  const [pending, setPending] = React.useState(false);

  React.useEffect(() => {
    const sync = () => {
      setSaved(
        isGuestFavourite(item.propertyId) || isGuestFavourite(item.slug),
      );
    };
    if (initiallySaved != null) setSaved(initiallySaved);
    else sync();
    window.addEventListener(FAVOURITES_CHANGED_EVENT, sync);
    return () => window.removeEventListener(FAVOURITES_CHANGED_EVENT, sync);
  }, [item.propertyId, item.slug, initiallySaved]);

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;

    const previous = saved;
    const optimistic = !previous;
    setSaved(optimistic);
    setPending(true);

    const result = await toggleSaveProperty(item, {
      requireAuth,
      onOptimistic: setSaved,
    });

    setPending(false);

    if (!result.ok) {
      setSaved(previous);
      if (result.reason === "login_required") {
        onToast?.("Pro uložení do účtu se přihlaste.");
        window.location.assign(result.loginUrl);
        return;
      }
      onToast?.(result.message || SAVE_FAILURE_MESSAGE);
      return;
    }

    setSaved(result.added);
    onToast?.(
      result.added
        ? result.mode === "guest"
          ? "Uloženo v tomto zařízení"
          : "Uloženo"
        : "Odebráno z uložených",
    );
  }

  if (variant === "icon") {
    return (
      <IconButton
        type="button"
        label={saved ? "Odebrat z uložených" : "Uložit"}
        variant={saved ? "secondary" : "outline"}
        size={size === "icon" ? "icon" : "icon-sm"}
        className={className}
        disabled={pending}
        onClick={(e) => void onClick(e)}
      >
        <Heart
          className={cn(
            "size-5",
            saved && "fill-current text-[var(--status-error)]",
          )}
        />
      </IconButton>
    );
  }

  return (
    <Button
      type="button"
      size={size === "icon" ? "sm" : size}
      variant={saved ? "secondary" : "outline"}
      className={className}
      loading={pending}
      onClick={(e) => void onClick(e)}
      leftIcon={
        <Heart
          className={cn(saved && "fill-current text-[var(--status-error)]")}
          aria-hidden
        />
      }
    >
      {saved ? "Uloženo" : "Uložit"}
    </Button>
  );
}
