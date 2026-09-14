"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

import { Dialog, DialogContent } from "@/components/overlays/dialog";
import { Button } from "@/components/ui/button";
import { InlineAlert } from "@/components/feedback/states";
import {
  clearGuestFavourites,
  dismissGuestMergePrompt,
  guestFavouritesPendingMerge,
  readGuestFavourites,
} from "@/domains/favourites/guest-storage";
import { mergeGuestFavouritesAction } from "@/domains/favourites/server/actions";
import { MERGE_PROMPT_TITLE } from "@/domains/favourites/types";

/**
 * After login/register: offer to transfer guest favourites/shortlist into the account.
 */
export function GuestFavouritesMergePrompt() {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [count, setCount] = React.useState(0);
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [done, setDone] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!guestFavouritesPendingMerge()) return;
    const items = readGuestFavourites();
    setCount(items.length);
    setOpen(items.length > 0);
  }, []);

  function onDismiss() {
    dismissGuestMergePrompt();
    setOpen(false);
  }

  async function onMerge() {
    setPending(true);
    setError(null);
    const items = readGuestFavourites().map((g) => ({
      propertyId: g.propertyId,
      slug: g.slug,
      title: g.title,
      href: g.href,
      priceCzk: g.priceAtSave ?? null,
      status: g.status,
    }));

    const result = await mergeGuestFavouritesAction({ items });
    setPending(false);

    if (!result.ok) {
      setError(result.error);
      return;
    }

    clearGuestFavourites();
    dismissGuestMergePrompt();
    setDone(
      result.merged > 0
        ? `Přeneseno ${result.merged} ${result.merged === 1 ? "nemovitost" : "nemovitostí"}${
            result.skipped ? ` (${result.skipped} přeskočeno)` : ""
          }.`
        : "Žádné nové položky k přenosu.",
    );
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      {done ? (
        <InlineAlert tone="success" title="Hotovo" className="mb-6">
          {done}
        </InlineAlert>
      ) : null}

      <Dialog open={open} onOpenChange={(v) => (!v ? onDismiss() : setOpen(v))}>
        <DialogContent
          title={MERGE_PROMPT_TITLE}
          description={`V tomto zařízení máte ${count} ${
            count === 1 ? "uloženou nemovitost" : "uložených nemovitostí"
          } (včetně výběru). Chcete je přenést do svého účtu?`}
        >
          {error ? (
            <InlineAlert tone="error" title="Přenos se nezdařil" className="mb-4">
              {error}
            </InlineAlert>
          ) : null}
          <div className="flex flex-wrap justify-end gap-2">
            <Button type="button" variant="ghost" onClick={onDismiss} disabled={pending}>
              Teď ne
            </Button>
            <Button type="button" onClick={() => void onMerge()} loading={pending}>
              Přenést do účtu
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
