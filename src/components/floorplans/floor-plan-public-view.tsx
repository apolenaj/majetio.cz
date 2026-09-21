"use client";

import { useMemo, useState } from "react";
import { Expand, X } from "lucide-react";

import {
  OUTPUT_KIND_LABEL_CS,
  renderFloorPlanSvg,
  type FloorPlanDocument,
} from "@/domains/floorplans";

export function FloorPlanPublicView({
  document,
  title = "Půdorys",
}: {
  document: FloorPlanDocument;
  title?: string;
}) {
  const [floorId, setFloorId] = useState(document.floors[0]?.id);
  const [lightbox, setLightbox] = useState(false);
  const [showFurniture, setShowFurniture] = useState(false);

  const svg = useMemo(
    () =>
      renderFloorPlanSvg(
        { ...document, showFurniture },
        { floorId, includeDisclaimer: true, width: 1000, height: 700 },
      ),
    [document, floorId, showFurniture],
  );

  function download(kind: "svg" | "png") {
    const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
    if (kind === "svg") {
      const url = URL.createObjectURL(blob);
      const a = window.document.createElement("a");
      a.href = url;
      a.download = "pudorys-majetio.svg";
      a.click();
      URL.revokeObjectURL(url);
      return;
    }
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      const canvas = window.document.createElement("canvas");
      canvas.width = 1400;
      canvas.height = 980;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#667a86";
      ctx.font = "14px system-ui,sans-serif";
      ctx.fillText(document.disclaimerCs.slice(0, 110), 24, canvas.height - 24);
      canvas.toBlob((png: Blob | null) => {
        if (!png) return;
        const u = URL.createObjectURL(png);
        const a = window.document.createElement("a");
        a.href = u;
        a.download = "pudorys-majetio.png";
        a.click();
        URL.revokeObjectURL(u);
      });
      URL.revokeObjectURL(url);
    };
    img.src = url;
  }

  function downloadPdf() {
    // Lightweight PDF: embed SVG as object in print window — user saves as PDF.
    const w = window.open("", "_blank");
    if (!w) return;
    w.document.write(
      `<!doctype html><title>Půdorys</title><body style="margin:0;font-family:system-ui">${svg}<p style="padding:12px;color:#667a86;font-size:12px">${document.disclaimerCs}</p><script>setTimeout(()=>print(),300)</script></body>`,
    );
    w.document.close();
  }

  const rooms =
    document.floors.find((f) => f.id === floorId)?.rooms ??
    document.floors[0]?.rooms ??
    [];

  return (
    <section className="fp-public space-y-4" aria-labelledby="fp-public-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="fp-public-heading" className="font-display text-2xl text-[var(--text-primary)]">
            {title}
          </h2>
          <p className="mt-1 text-sm text-[var(--text-secondary)]">
            {OUTPUT_KIND_LABEL_CS[document.outputKind]}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="fp-btn" onClick={() => setLightbox(true)}>
            <Expand className="mr-1 inline size-3.5" aria-hidden />
            Zvětšit
          </button>
          <button type="button" className="fp-btn" onClick={() => download("png")}>
            Stáhnout PNG
          </button>
          <button type="button" className="fp-btn" onClick={downloadPdf}>
            Stáhnout PDF
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {document.floors.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`fp-chip ${f.id === floorId ? "is-active" : ""}`}
            onClick={() => setFloorId(f.id)}
          >
            {f.name}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-xs text-[var(--text-muted)]">
          <input
            type="checkbox"
            checked={showFurniture}
            onChange={(e) => setShowFurniture(e.target.checked)}
          />
          Nábytek
        </label>
      </div>

      <div
        className="overflow-auto rounded-xl border border-[var(--border-default)] bg-white touch-pan-y"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: svg }}
      />

      <ul className="grid gap-2 sm:grid-cols-2">
        {rooms.map((r) => (
          <li
            key={r.id}
            className="rounded-lg border border-[var(--border-default)] px-3 py-2 text-sm"
          >
            <strong className="text-[var(--text-primary)]">{r.name}</strong>
            <span className="mt-0.5 block text-xs text-[var(--text-muted)]">
              {document.scaleState === "NONE" || r.areaM2 == null
                ? "Plocha neuvedena / bez měřítka"
                : `${r.areaM2.toLocaleString("cs-CZ")} m² · zdroj: ${r.areaSource}`}
            </span>
          </li>
        ))}
      </ul>

      {document.areaDifferenceNoteCs ? (
        <p className="text-xs text-[var(--text-muted)]">{document.areaDifferenceNoteCs}</p>
      ) : null}
      <p className="text-xs leading-relaxed text-[var(--text-muted)]">
        {document.disclaimerCs}
      </p>

      {lightbox ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          role="dialog"
          aria-modal
          aria-label="Půdorys na celou obrazovku"
        >
          <button
            type="button"
            className="absolute top-4 right-4 rounded-full bg-white p-2"
            onClick={() => setLightbox(false)}
            aria-label="Zavřít"
          >
            <X className="size-5" />
          </button>
          <div
            className="max-h-[90vh] max-w-5xl overflow-auto rounded-lg bg-white p-2"
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        </div>
      ) : null}
    </section>
  );
}

/** Gallery tab switcher: photographs | floor plan */
export function MediaFloorPlanTabs({
  photos,
  floorPlan,
  photosSlot,
  floorPlanSlot,
}: {
  photos: boolean;
  floorPlan: boolean;
  photosSlot: React.ReactNode;
  floorPlanSlot: React.ReactNode;
}) {
  const [tab, setTab] = useState<"photos" | "floorplan">(
    photos ? "photos" : "floorplan",
  );
  if (!floorPlan) return <>{photosSlot}</>;
  return (
    <div>
      <div className="mb-3 flex gap-2 border-b border-[var(--border-default)]">
        <button
          type="button"
          className={`px-3 py-2 text-sm font-medium ${tab === "photos" ? "border-b-2 border-[var(--action-primary)] text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}
          onClick={() => setTab("photos")}
        >
          Fotografie
        </button>
        <button
          type="button"
          className={`px-3 py-2 text-sm font-medium ${tab === "floorplan" ? "border-b-2 border-[var(--action-primary)] text-[var(--text-primary)]" : "text-[var(--text-muted)]"}`}
          onClick={() => setTab("floorplan")}
        >
          Půdorys
        </button>
      </div>
      {tab === "photos" ? photosSlot : floorPlanSlot}
    </div>
  );
}
