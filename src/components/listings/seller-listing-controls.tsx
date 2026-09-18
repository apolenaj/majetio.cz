"use client";

import { useActionState } from "react";

import {
  archiveListingAction,
  publishListingAction,
  unpublishListingAction,
  uploadListingPhotoAction,
  type ListingActionResult,
} from "@/domains/listings/seller/actions";

const initial: ListingActionResult | null = null;

export function SellerListingControls({
  propertyId,
  status,
}: {
  propertyId: string;
  status: string;
}) {
  const publish = async () => publishListingAction(propertyId);
  const unpublish = async () => unpublishListingAction(propertyId);
  const archive = async () => archiveListingAction(propertyId);

  const [pubState, pubAction, pubPending] = useActionState(publish, initial);
  const [unState, unAction, unPending] = useActionState(unpublish, initial);
  const [arState, arAction, arPending] = useActionState(archive, initial);

  const upload = async (
    _prev: ListingActionResult | null,
    formData: FormData,
  ) => uploadListingPhotoAction(propertyId, formData);
  const [upState, upAction, upPending] = useActionState(upload, initial);

  const flash = pubState ?? unState ?? arState ?? upState;

  return (
    <div className="space-y-6">
      {flash && !flash.ok ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {flash.error}
          {flash.issues?.length ? (
            <ul className="mt-2 list-disc pl-5">
              {flash.issues.map((i) => (
                <li key={i}>{i}</li>
              ))}
            </ul>
          ) : null}
        </p>
      ) : null}
      {flash?.ok && flash.message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          {flash.message}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {status !== "ACTIVE" ? (
          <form action={pubAction}>
            <button
              type="submit"
              disabled={pubPending}
              className="inline-flex h-10 items-center rounded-lg bg-[var(--action-primary)] px-4 text-sm font-medium text-white disabled:opacity-60"
            >
              {pubPending ? "Publikuji…" : "Publikovat"}
            </button>
          </form>
        ) : (
          <form action={unAction}>
            <button
              type="submit"
              disabled={unPending}
              className="inline-flex h-10 items-center rounded-lg border border-[var(--border-strong)] px-4 text-sm font-medium disabled:opacity-60"
            >
              {unPending ? "Stahuji…" : "Stáhnout z katalogu"}
            </button>
          </form>
        )}
        {status !== "ARCHIVED" ? (
          <form action={arAction}>
            <button
              type="submit"
              disabled={arPending}
              className="inline-flex h-10 items-center rounded-lg border border-red-300 px-4 text-sm font-medium text-red-800 disabled:opacity-60"
            >
              {arPending ? "Archivuji…" : "Archivovat"}
            </button>
          </form>
        ) : null}
      </div>

      <form action={upAction} className="space-y-3 rounded-lg border border-[var(--border-default)] p-4">
        <h3 className="font-medium text-[var(--text-primary)]">Fotografie</h3>
        <input
          type="file"
          name="photo"
          accept="image/jpeg,image/png,image/webp,image/gif"
          required
          className="block w-full text-sm"
        />
        <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <input type="checkbox" name="makePrimary" value="on" />
          Nastavit jako hlavní
        </label>
        <button
          type="submit"
          disabled={upPending}
          className="inline-flex h-10 items-center rounded-lg border border-[var(--border-strong)] px-4 text-sm font-medium disabled:opacity-60"
        >
          {upPending ? "Nahrávám…" : "Nahrát fotografii"}
        </button>
        <p className="text-xs text-[var(--text-muted)]">
          Soubory se ukládají lokálně do /uploads. Produkční cloud storage je zatím
          blokován externí závislostí.
        </p>
      </form>
    </div>
  );
}
