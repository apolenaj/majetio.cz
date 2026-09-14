"use client";

import * as React from "react";

import {
  watchLocationAction,
  unwatchLocationAction,
} from "@/domains/locations/watch/actions";
import { Button } from "@/components/ui/button";

export function WatchLocationButton({
  locationSlug,
  initiallyWatched = false,
}: {
  locationSlug: string;
  initiallyWatched?: boolean;
}) {
  const [watched, setWatched] = React.useState(initiallyWatched);
  const [pending, setPending] = React.useState(false);
  const [message, setMessage] = React.useState<string | null>(null);

  async function toggle() {
    setPending(true);
    setMessage(null);
    try {
      if (watched) {
        const res = await unwatchLocationAction({ locationSlug });
        if (!res.ok) {
          setMessage(res.error === "unauthorized" ? "Přihlaste se pro sledování." : "Nepodařilo se.");
          return;
        }
        setWatched(false);
      } else {
        const res = await watchLocationAction({ locationSlug });
        if (!res.ok) {
          setMessage(res.error === "unauthorized" ? "Přihlaste se pro sledování." : "Nepodařilo se.");
          return;
        }
        setWatched(true);
      }
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="inline-flex flex-col gap-1">
      <Button
        type="button"
        variant={watched ? "secondary" : "primary"}
        size="sm"
        disabled={pending}
        onClick={() => void toggle()}
      >
        {watched ? "Sleduji lokalitu" : "Sledovat lokalitu"}
      </Button>
      {message ? (
        <span className="text-xs text-[var(--text-muted)]">{message}</span>
      ) : null}
    </div>
  );
}
