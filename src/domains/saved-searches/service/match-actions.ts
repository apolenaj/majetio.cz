"use server";

import { auth } from "@/lib/auth";
import {
  acknowledgeSavedSearchMatches,
  syncSavedSearchMatches,
} from "./match-service";

export async function acknowledgeSavedSearchMatchesAction(savedSearchId: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Přihlášení je povinné." };
  return acknowledgeSavedSearchMatches(savedSearchId, session.user.id);
}

export async function syncSavedSearchMatchesAction(savedSearchId: string) {
  const session = await auth();
  if (!session?.user?.id) return { ok: false as const, error: "Přihlášení je povinné." };
  return syncSavedSearchMatches({ savedSearchId, notify: false });
}
