"use client";

/**
 * 2D floor plan editor — rooms, openings, undo/redo, autosave.
 * Pointer gestures stay inside the SVG surface (page scroll outside is free).
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  emptyFloorPlanDocument,
  rectPolygon,
  recomputeRoomAreas,
  renderFloorPlanSvg,
  validateFloorPlanDocument,
  type FloorPlanDocument,
  type FloorPlanRoom,
  type RoomType,
  OUTPUT_KIND_LABEL_CS,
} from "@/domains/floorplans";

const ROOM_TYPES: { id: RoomType; label: string }[] = [
  { id: "hallway", label: "Předsíň" },
  { id: "living", label: "Obývací" },
  { id: "kitchen", label: "Kuchyně" },
  { id: "bedroom", label: "Ložnice" },
  { id: "bathroom", label: "Koupelna" },
  { id: "toilet", label: "WC" },
  { id: "storage", label: "Komora" },
  { id: "balcony", label: "Balkon" },
  { id: "staircase", label: "Schodiště" },
  { id: "other", label: "Jiné" },
];

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function FloorPlanEditor({
  initialDocument,
  listedAreaM2,
  onChange,
  onAutosave,
}: {
  initialDocument?: FloorPlanDocument | null;
  listedAreaM2?: number | null;
  onChange?: (doc: FloorPlanDocument) => void;
  onAutosave?: (doc: FloorPlanDocument) => void;
}) {
  const [doc, setDoc] = useState<FloorPlanDocument>(() =>
    recomputeRoomAreas({
      ...(initialDocument ?? emptyFloorPlanDocument()),
      listedAreaM2: listedAreaM2 ?? initialDocument?.listedAreaM2 ?? null,
    }),
  );
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [floorId, setFloorId] = useState(doc.floors[0]?.id ?? "floor-0");
  const [showFurniture, setShowFurniture] = useState(doc.showFurniture);
  const [zoom, setZoom] = useState(1);
  const history = useRef<FloorPlanDocument[]>([]);
  const future = useRef<FloorPlanDocument[]>([]);
  const drag = useRef<{ roomId: string; ox: number; oy: number } | null>(null);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const floor = doc.floors.find((f) => f.id === floorId) ?? doc.floors[0];
  const selected = floor?.rooms.find((r) => r.id === selectedRoomId) ?? null;

  const commit = useCallback(
    (next: FloorPlanDocument, pushHistory = true) => {
      const fixed = recomputeRoomAreas({
        ...next,
        issues: validateFloorPlanDocument(next),
        showFurniture,
      });
      if (pushHistory) {
        history.current = [...history.current.slice(-40), doc];
        future.current = [];
      }
      setDoc(fixed);
      onChange?.(fixed);
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => onAutosave?.(fixed), 900);
    },
    [doc, onAutosave, onChange, showFurniture],
  );

  useEffect(() => () => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
  }, []);

  const svgMarkup = useMemo(
    () =>
      renderFloorPlanSvg(
        { ...doc, showFurniture },
        { floorId: floor?.id, includeDisclaimer: false, width: 720, height: 480 },
      ),
    [doc, floor?.id, showFurniture],
  );

  function undo() {
    const prev = history.current.pop();
    if (!prev) return;
    future.current.push(doc);
    setDoc(prev);
    onChange?.(prev);
  }

  function redo() {
    const next = future.current.pop();
    if (!next) return;
    history.current.push(doc);
    setDoc(next);
    onChange?.(next);
  }

  function addRoom() {
    if (!floor) return;
    const id = uid("room");
    const room: FloorPlanRoom = {
      id,
      name: "Nová místnost",
      type: "other",
      floorId: floor.id,
      polygon: rectPolygon(0.5 + floor.rooms.length * 0.3, 0.5, 3, 2.5),
      rotationDeg: 0,
      lengthM: doc.scaleState === "NONE" ? null : 3,
      widthM: doc.scaleState === "NONE" ? null : 2.5,
      areaM2: doc.scaleState === "NONE" ? null : 7.5,
      areaSource: doc.scaleState === "NONE" ? "unknown" : "informant",
      wallLengthsM: null,
      openings: [],
      notes: null,
      unclear: false,
      photoGroupIds: [],
    };
    commit({
      ...doc,
      floors: doc.floors.map((f) =>
        f.id === floor.id ? { ...f, rooms: [...f.rooms, room] } : f,
      ),
    });
    setSelectedRoomId(id);
  }

  function updateSelected(patch: Partial<FloorPlanRoom>) {
    if (!selected || !floor) return;
    commit({
      ...doc,
      floors: doc.floors.map((f) =>
        f.id !== floor.id
          ? f
          : {
              ...f,
              rooms: f.rooms.map((r) =>
                r.id === selected.id ? { ...r, ...patch } : r,
              ),
            },
      ),
    });
  }

  function removeSelected() {
    if (!selected || !floor) return;
    commit({
      ...doc,
      floors: doc.floors.map((f) =>
        f.id !== floor.id
          ? f
          : { ...f, rooms: f.rooms.filter((r) => r.id !== selected.id) },
      ),
    });
    setSelectedRoomId(null);
  }

  function rotateSelected(deg: number) {
    if (!selected) return;
    updateSelected({ rotationDeg: ((selected.rotationDeg + deg) % 360 + 360) % 360 });
  }

  function applySizeToPolygon() {
    if (!selected || selected.lengthM == null || selected.widthM == null) return;
    const origin = selected.polygon[0] ?? { x: 0, y: 0 };
    updateSelected({
      polygon: rectPolygon(origin.x, origin.y, selected.lengthM, selected.widthM),
      areaSource: "informant",
    });
  }

  function addOpening(kind: "door" | "window" | "passage") {
    if (!selected) return;
    updateSelected({
      openings: [
        ...selected.openings,
        {
          id: uid("op"),
          kind,
          edgeIndex: 0,
          t: 0.5,
          widthM: kind === "window" ? 1.2 : 0.9,
          swing: kind === "door" ? "in_right" : undefined,
          connectsToRoomId: null,
        },
      ],
    });
  }

  function updateOpening(
    openingId: string,
    patch: Partial<FloorPlanRoom["openings"][number]>,
  ) {
    if (!selected) return;
    updateSelected({
      openings: selected.openings.map((o) =>
        o.id === openingId ? { ...o, ...patch } : o,
      ),
    });
  }

  function removeOpening(openingId: string) {
    if (!selected) return;
    updateSelected({
      openings: selected.openings.filter((o) => o.id !== openingId),
    });
  }

  function addPolygonVertex() {
    if (!selected || selected.polygon.length < 3) return;
    const last = selected.polygon[selected.polygon.length - 1]!;
    const first = selected.polygon[0]!;
    const mid = { x: (last.x + first.x) / 2, y: (last.y + first.y) / 2 };
    updateSelected({ polygon: [...selected.polygon, mid] });
  }

  function onPointerDownRoom(roomId: string, e: React.PointerEvent) {
    const svg = (e.currentTarget as SVGElement).ownerSVGElement;
    if (!svg) return;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const loc = pt.matrixTransform(ctm.inverse());
    const room = floor?.rooms.find((r) => r.id === roomId);
    if (!room) return;
    drag.current = {
      roomId,
      ox: loc.x - room.polygon[0]!.x,
      oy: loc.y - room.polygon[0]!.y,
    };
    setSelectedRoomId(roomId);
    (e.currentTarget as Element).setPointerCapture(e.pointerId);
  }

  function onPointerMove(e: React.PointerEvent) {
    if (!drag.current || !floor) return;
    const svg = e.currentTarget as SVGSVGElement;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (!ctm) return;
    const loc = pt.matrixTransform(ctm.inverse());
    const room = floor.rooms.find((r) => r.id === drag.current!.roomId);
    if (!room) return;
    const dx = loc.x - drag.current.ox - room.polygon[0]!.x;
    const dy = loc.y - drag.current.oy - room.polygon[0]!.y;
    const moved = room.polygon.map((p) => ({ x: p.x + dx, y: p.y + dy }));
    commit(
      {
        ...doc,
        floors: doc.floors.map((f) =>
          f.id !== floor.id
            ? f
            : {
                ...f,
                rooms: f.rooms.map((r) =>
                  r.id === room.id ? { ...r, polygon: moved } : r,
                ),
              },
        ),
      },
      false,
    );
  }

  function onPointerUp() {
    if (drag.current) {
      history.current = [...history.current.slice(-40), doc];
      drag.current = null;
    }
  }

  const issues = doc.issues;

  return (
    <div className="fp-editor space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" className="fp-btn" onClick={addRoom}>
          + Místnost
        </button>
        <button type="button" className="fp-btn" onClick={undo}>
          Zpět
        </button>
        <button type="button" className="fp-btn" onClick={redo}>
          Znovu
        </button>
        <button
          type="button"
          className="fp-btn"
          onClick={() => setZoom((z) => Math.min(2.5, z + 0.15))}
        >
          Přiblížit
        </button>
        <button
          type="button"
          className="fp-btn"
          onClick={() => setZoom((z) => Math.max(0.5, z - 0.15))}
        >
          Oddálit
        </button>
        <button type="button" className="fp-btn" onClick={() => setZoom(1)}>
          Přizpůsobit
        </button>
        <label className="ml-auto flex items-center gap-2 text-sm text-[var(--text-secondary)]">
          <input
            type="checkbox"
            checked={showFurniture}
            onChange={(e) => {
              setShowFurniture(e.target.checked);
              commit({ ...doc, showFurniture: e.target.checked });
            }}
          />
          Nábytek (doplňkový)
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        {doc.floors.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`fp-chip ${f.id === floor?.id ? "is-active" : ""}`}
            onClick={() => setFloorId(f.id)}
          >
            {f.name}
          </button>
        ))}
        <button
          type="button"
          className="fp-chip"
          onClick={() => {
            const id = uid("floor");
            commit({
              ...doc,
              floors: [
                ...doc.floors,
                {
                  id,
                  name: `${doc.floors.length + 1}. NP`,
                  level: doc.floors.length,
                  rooms: [],
                },
              ],
            });
            setFloorId(id);
          }}
        >
          + Podlaží
        </button>
      </div>

      <p className="text-xs text-[var(--text-muted)]">
        Typ výstupu: {OUTPUT_KIND_LABEL_CS[doc.outputKind]} · měřítko:{" "}
        {doc.scaleState === "NONE"
          ? "bez měřítka (nezobrazujeme vypočtené metry)"
          : doc.scaleState}
      </p>

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_16rem]">
        <div
          className="overflow-auto rounded-lg border border-[var(--border-default)] bg-white touch-pan-y"
          style={{ overscrollBehavior: "contain" }}
        >
          <div
            className="fp-canvas min-h-[280px] touch-none"
            style={{ transform: `scale(${zoom})`, transformOrigin: "top left" }}
            // eslint-disable-next-line react/no-danger
            dangerouslySetInnerHTML={{ __html: svgMarkup }}
            onClick={(e) => {
              const g = (e.target as Element).closest("[data-room-id]");
              if (g) setSelectedRoomId(g.getAttribute("data-room-id"));
            }}
          />
          {/* Overlay interactive hit targets via second SVG parse is heavy;
              use room list + dimension fields for precise edits. */}
          <svg
            className="sr-only"
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          />
          <ul className="flex flex-wrap gap-2 border-t border-[var(--border-default)] p-3">
            {floor?.rooms.map((r) => (
              <li key={r.id}>
                <button
                  type="button"
                  className={`fp-chip ${r.id === selectedRoomId ? "is-active" : ""}`}
                  onPointerDown={(e) => onPointerDownRoom(r.id, e)}
                  onPointerMove={onPointerMove}
                  onPointerUp={onPointerUp}
                >
                  {r.name}
                </button>
              </li>
            ))}
          </ul>
        </div>

        <aside className="space-y-3 rounded-lg border border-[var(--border-default)] bg-[var(--surface-primary)] p-3">
          <h3 className="text-sm font-semibold text-[var(--text-primary)]">
            Vlastnosti místnosti
          </h3>
          {selected ? (
            <>
              <label className="block text-xs">
                Název
                <input
                  className="fp-input"
                  value={selected.name}
                  onChange={(e) => updateSelected({ name: e.target.value })}
                />
              </label>
              <label className="block text-xs">
                Typ
                <select
                  className="fp-input"
                  value={selected.type}
                  onChange={(e) =>
                    updateSelected({ type: e.target.value as RoomType })
                  }
                >
                  {ROOM_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-xs">
                Délka (m) — prázdné = neznámé
                <input
                  className="fp-input"
                  inputMode="decimal"
                  value={selected.lengthM ?? ""}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    updateSelected({
                      lengthM: v === "" ? null : Number(v.replace(",", ".")),
                      areaSource: "informant",
                    });
                    if (doc.scaleState === "NONE") {
                      commit({ ...doc, scaleState: "PARTIAL", units: "m", outputKind: "INFORMANT_MEASURED" });
                    }
                  }}
                />
              </label>
              <label className="block text-xs">
                Šířka (m)
                <input
                  className="fp-input"
                  inputMode="decimal"
                  value={selected.widthM ?? ""}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    updateSelected({
                      widthM: v === "" ? null : Number(v.replace(",", ".")),
                      areaSource: "informant",
                    });
                  }}
                />
              </label>
              <label className="block text-xs">
                Plocha (m²) — zadává inzerent
                <input
                  className="fp-input"
                  inputMode="decimal"
                  value={selected.areaM2 ?? ""}
                  onChange={(e) => {
                    const v = e.target.value.trim();
                    updateSelected({
                      areaM2: v === "" ? null : Number(v.replace(",", ".")),
                      areaSource: "informant",
                    });
                  }}
                />
              </label>
              <label className="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  checked={selected.unclear}
                  onChange={(e) => updateSelected({ unclear: e.target.checked })}
                />
                Nejasný / nedostatečný podklad
              </label>
              <label className="block text-xs">
                Poznámka ke zdroji rozměrů
                <input
                  className="fp-input"
                  value={selected.notes ?? ""}
                  onChange={(e) =>
                    updateSelected({ notes: e.target.value || null })
                  }
                />
              </label>
              <div className="flex flex-wrap gap-1">
                <button type="button" className="fp-btn" onClick={() => rotateSelected(15)}>
                  Otočit +15°
                </button>
                <button type="button" className="fp-btn" onClick={() => rotateSelected(-15)}>
                  Otočit −15°
                </button>
                <button type="button" className="fp-btn" onClick={applySizeToPolygon}>
                  Upravit tvar dle délky/šířky
                </button>
                <button type="button" className="fp-btn" onClick={addPolygonVertex}>
                  + Vrchol (polygon)
                </button>
              </div>
              <div className="space-y-2 border-t border-[var(--border-default)] pt-2">
                <p className="text-xs font-semibold">Dveře / okna / průchody</p>
                <div className="flex flex-wrap gap-1">
                  <button type="button" className="fp-btn" onClick={() => addOpening("door")}>
                    + Dveře
                  </button>
                  <button type="button" className="fp-btn" onClick={() => addOpening("window")}>
                    + Okno
                  </button>
                  <button type="button" className="fp-btn" onClick={() => addOpening("passage")}>
                    + Průchod
                  </button>
                </div>
                {selected.openings.map((op) => (
                  <div key={op.id} className="rounded border border-[var(--border-default)] p-2 text-xs">
                    <p className="font-medium capitalize">{op.kind}</p>
                    <label>
                      Stěna (index)
                      <input
                        className="fp-input"
                        type="number"
                        min={0}
                        max={Math.max(0, selected.polygon.length - 1)}
                        value={op.edgeIndex}
                        onChange={(e) =>
                          updateOpening(op.id, {
                            edgeIndex: Number(e.target.value),
                          })
                        }
                      />
                    </label>
                    <label>
                      Pozice na stěně (0–1)
                      <input
                        className="fp-input"
                        type="number"
                        min={0}
                        max={1}
                        step={0.05}
                        value={op.t}
                        onChange={(e) =>
                          updateOpening(op.id, { t: Number(e.target.value) })
                        }
                      />
                    </label>
                    {op.kind === "door" ? (
                      <label>
                        Otevírání
                        <select
                          className="fp-input"
                          value={op.swing ?? "unknown"}
                          onChange={(e) =>
                            updateOpening(op.id, {
                              swing: e.target.value as NonNullable<
                                typeof op.swing
                              >,
                            })
                          }
                        >
                          <option value="in_left">Dovnitř vlevo</option>
                          <option value="in_right">Dovnitř vpravo</option>
                          <option value="out_left">Ven vlevo</option>
                          <option value="out_right">Ven vpravo</option>
                          <option value="sliding">Posuvné</option>
                          <option value="unknown">Neznámé</option>
                        </select>
                      </label>
                    ) : null}
                    <button
                      type="button"
                      className="fp-btn-danger mt-1"
                      onClick={() => removeOpening(op.id)}
                    >
                      Odstranit otvor
                    </button>
                  </div>
                ))}
              </div>
              <button type="button" className="fp-btn-danger" onClick={removeSelected}>
                Odstranit místnost
              </button>
            </>
          ) : (
            <p className="text-xs text-[var(--text-muted)]">
              Vyberte místnost v seznamu. Přetažením jemně posunete (v rámci plochy
              editoru).
            </p>
          )}
        </aside>
      </div>

      {issues.length > 0 ? (
        <ul className="space-y-1 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950">
          {issues.map((i) => (
            <li key={`${i.code}-${i.roomId ?? ""}-${i.messageCs}`}>
              {i.severity === "error" ? "●" : "○"} {i.messageCs}
            </li>
          ))}
        </ul>
      ) : null}

      <p className="text-xs leading-relaxed text-[var(--text-muted)]">
        {doc.disclaimerCs}
      </p>
    </div>
  );
}
