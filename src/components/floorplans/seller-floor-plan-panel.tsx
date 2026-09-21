"use client";

import { useCallback, useEffect, useId, useState, useTransition } from "react";

import { FloorPlanEditor } from "@/components/floorplans/floor-plan-editor";
import { FloorPlanPhotoWizard } from "@/components/floorplans/floor-plan-photo-wizard";
import {
  loadFloorPlanEditorAction,
  publishFloorPlanAction,
  saveFloorPlanDraftAction,
  startPhotoFloorPlanAnalysisAction,
  uploadFloorPlanDocumentAction,
} from "@/domains/floorplans/actions";
import {
  emptyFloorPlanDocument,
  markManualEdit,
  OUTPUT_KIND_LABEL_CS,
  type FloorPlanDocument,
  type FloorPlanPhotoGroup,
} from "@/domains/floorplans";

type Mode = "choose" | "photos" | "upload" | "manual";

type ListingMedia = { id: string; url: string; alt?: string | null; type?: string };

export function SellerFloorPlanPanel({
  propertyId,
  listedAreaM2,
  listingMedia = [],
}: {
  propertyId: string;
  listedAreaM2?: number | null;
  listingMedia?: ListingMedia[];
}) {
  const [mode, setMode] = useState<Mode>("choose");
  const [doc, setDoc] = useState<FloorPlanDocument>(emptyFloorPlanDocument());
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const requestId = useId();

  const photoMedia = listingMedia.filter(
    (m) => !m.type || m.type === "PHOTO",
  );

  useEffect(() => {
    startTransition(async () => {
      const res = await loadFloorPlanEditorAction(propertyId);
      if (res.ok && res.data && typeof res.data === "object") {
        const plan = res.data as {
          draftRevision?: { document?: FloorPlanDocument } | null;
        };
        if (plan.draftRevision?.document) {
          setDoc(plan.draftRevision.document);
          setMode("manual");
        }
      }
    });
  }, [propertyId]);

  const autosave = useCallback(
    (next: FloorPlanDocument) => {
      startTransition(async () => {
        const res = await saveFloorPlanDraftAction(propertyId, markManualEdit(next));
        if (!res.ok) setError(res.error);
        else {
          setError(null);
          setMessage(res.message ?? "Uloženo");
        }
      });
    },
    [propertyId],
  );

  function publish() {
    startTransition(async () => {
      const saved = await saveFloorPlanDraftAction(propertyId, doc);
      if (!saved.ok) {
        setError(saved.error);
        return;
      }
      const res = await publishFloorPlanAction(propertyId);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setMessage(res.message ?? "Publikováno");
      setError(null);
    });
  }

  function runAnalysis(groups: FloorPlanPhotoGroup[]) {
    startTransition(async () => {
      const withGroups = { ...doc, photoGroups: groups };
      setDoc(withGroups);
      await saveFloorPlanDraftAction(propertyId, withGroups);

      const fd = new FormData();
      fd.set("clientRequestId", `${requestId}-${Date.now()}`);
      fd.set("photoGroups", JSON.stringify(groups));
      const res = await startPhotoFloorPlanAnalysisAction(propertyId, fd);
      if (!res.ok) {
        setError(res.error);
        setMode("manual");
        return;
      }
      setMessage(res.message ?? "OK");
      setError(null);
      setMode("manual");
    });
  }

  return (
    <section className="fp-seller space-y-4 rounded-xl border border-[var(--border-default)] bg-[var(--surface-primary)] p-5">
      <div>
        <h2 className="font-display text-xl text-[var(--text-primary)]">
          Půdorys
        </h2>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">
          Volitelný krok. Nabídku lze zveřejnit i bez půdorysu. Schválení není
          odborným zaměřením a nezobrazuje se jako „ověřený půdorys“.
        </p>
      </div>

      {error ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          {message}
        </p>
      ) : null}

      {mode === "choose" ? (
        <div className="grid gap-3 sm:grid-cols-3">
          <button type="button" className="fp-choice" onClick={() => setMode("photos")}>
            <strong>A. Návrh z fotografií</strong>
            <span>Vyžaduje vědomé spuštění. Bez API zůstane nedostupné.</span>
          </button>
          <button type="button" className="fp-choice" onClick={() => setMode("upload")}>
            <strong>B. Nahrát půdorys</strong>
            <span>PNG, JPG nebo PDF (originál + stránka).</span>
          </button>
          <button type="button" className="fp-choice" onClick={() => setMode("manual")}>
            <strong>C. Nakreslit ručně</strong>
            <span>Editor místností, dveří a rozměrů.</span>
          </button>
        </div>
      ) : null}

      {mode === "photos" ? (
        <div className="space-y-3">
          <FloorPlanPhotoWizard
            media={photoMedia}
            initialGroups={doc.photoGroups}
            floors={doc.floors.map((f) => ({ id: f.id, name: f.name }))}
            pending={pending}
            onSubmitAnalysis={runAnalysis}
          />
          <button type="button" className="fp-btn" onClick={() => setMode("manual")}>
            Pokračovat v ručním editoru
          </button>
          <button type="button" className="fp-btn" onClick={() => setMode("choose")}>
            ← Zpět
          </button>
        </div>
      ) : null}

      {mode === "upload" ? (
        <div className="space-y-3">
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.currentTarget);
              startTransition(async () => {
                const res = await uploadFloorPlanDocumentAction(propertyId, fd);
                if (!res.ok) setError(res.error);
                else {
                  setMessage(res.message ?? "Nahráno");
                  setDoc((d) => ({
                    ...d,
                    outputKind: "FROM_DOCUMENT",
                  }));
                  setMode("manual");
                }
              });
            }}
          >
            <input
              type="file"
              name="file"
              accept="image/jpeg,image/png,image/webp,application/pdf"
              required
              className="block w-full text-sm"
            />
            <label className="block text-xs text-[var(--text-secondary)]">
              Stránka PDF (0 = první)
              <input
                type="number"
                name="pageIndex"
                min={0}
                defaultValue={0}
                className="fp-input mt-1"
              />
            </label>
            <button type="submit" className="fp-btn-primary" disabled={pending}>
              {pending ? "Nahrávám…" : "Nahrát dokument"}
            </button>
          </form>
          <button type="button" className="fp-btn" onClick={() => setMode("choose")}>
            ← Zpět
          </button>
        </div>
      ) : null}

      {mode === "manual" ? (
        <div className="space-y-4">
          <p className="text-xs text-[var(--text-muted)]">
            Aktuální typ: {OUTPUT_KIND_LABEL_CS[doc.outputKind]}
          </p>
          <FloorPlanEditor
            initialDocument={doc}
            listedAreaM2={listedAreaM2}
            onChange={(next) => setDoc(markManualEdit(next))}
            onAutosave={autosave}
          />
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="fp-btn-primary"
              disabled={pending}
              onClick={publish}
            >
              Potvrdit ke zveřejnění
            </button>
            <button type="button" className="fp-btn" onClick={() => setMode("choose")}>
              Změnit způsob
            </button>
          </div>
        </div>
      ) : null}
    </section>
  );
}
