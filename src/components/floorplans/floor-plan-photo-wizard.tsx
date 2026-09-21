"use client";

/**
 * Photo → floor-plan guide: group shots by room, rename/merge/split,
 * assign floors, mark exterior / unclear. Does not call AI until submit.
 */

import { useMemo, useState } from "react";

import type { FloorPlanPhotoGroup } from "@/domains/floorplans/types";

export type WizardMedia = {
  id: string;
  url: string;
  alt?: string | null;
};

function uid() {
  return `g-${Math.random().toString(36).slice(2, 9)}`;
}

export function FloorPlanPhotoWizard({
  media,
  initialGroups,
  floors,
  onChange,
  onSubmitAnalysis,
  pending,
}: {
  media: WizardMedia[];
  initialGroups?: FloorPlanPhotoGroup[];
  floors: { id: string; name: string }[];
  onChange?: (groups: FloorPlanPhotoGroup[]) => void;
  onSubmitAnalysis: (groups: FloorPlanPhotoGroup[]) => void;
  pending?: boolean;
}) {
  const [groups, setGroups] = useState<FloorPlanPhotoGroup[]>(() => {
    if (initialGroups?.length) return initialGroups;
    if (media.length === 0) {
      return [
        {
          id: uid(),
          label: "Místnost 1",
          roomId: null,
          floorId: floors[0]?.id ?? null,
          mediaIds: [],
          excludeAsExterior: false,
          unclear: false,
        },
      ];
    }
    // One group per media — user merges same-room angles.
    return media.map((m, i) => ({
      id: uid(),
      label: `Snímek ${i + 1}`,
      roomId: null,
      floorId: floors[0]?.id ?? null,
      mediaIds: [m.id],
      excludeAsExterior: false,
      unclear: false,
    }));
  });

  const unassigned = useMemo(() => {
    const used = new Set(groups.flatMap((g) => g.mediaIds));
    return media.filter((m) => !used.has(m.id));
  }, [groups, media]);

  function commit(next: FloorPlanPhotoGroup[]) {
    setGroups(next);
    onChange?.(next);
  }

  function rename(id: string, label: string) {
    commit(groups.map((g) => (g.id === id ? { ...g, label } : g)));
  }

  function toggle(id: string, key: "excludeAsExterior" | "unclear") {
    commit(
      groups.map((g) => (g.id === id ? { ...g, [key]: !g[key] } : g)),
    );
  }

  function setFloor(id: string, floorId: string) {
    commit(groups.map((g) => (g.id === id ? { ...g, floorId } : g)));
  }

  function mergeInto(targetId: string, sourceId: string) {
    if (targetId === sourceId) return;
    const source = groups.find((g) => g.id === sourceId);
    const target = groups.find((g) => g.id === targetId);
    if (!source || !target) return;
    commit(
      groups
        .filter((g) => g.id !== sourceId)
        .map((g) =>
          g.id === targetId
            ? {
                ...g,
                mediaIds: [...new Set([...g.mediaIds, ...source.mediaIds])],
                label: g.label,
              }
            : g,
        ),
    );
  }

  function split(id: string) {
    const g = groups.find((x) => x.id === id);
    if (!g || g.mediaIds.length < 2) return;
    const [first, ...rest] = g.mediaIds;
    const extras: FloorPlanPhotoGroup[] = rest.map((mid, i) => ({
      id: uid(),
      label: `${g.label} · úhel ${i + 2}`,
      roomId: null,
      floorId: g.floorId,
      mediaIds: [mid],
      excludeAsExterior: g.excludeAsExterior,
      unclear: g.unclear,
    }));
    commit([
      ...groups.map((x) =>
        x.id === id ? { ...x, mediaIds: first ? [first] : [] } : x,
      ),
      ...extras,
    ]);
  }

  function addEmpty() {
    commit([
      ...groups,
      {
        id: uid(),
        label: `Místnost ${groups.length + 1}`,
        roomId: null,
        floorId: floors[0]?.id ?? null,
        mediaIds: [],
        excludeAsExterior: false,
        unclear: false,
      },
    ]);
  }

  function assignMedia(mediaId: string, groupId: string) {
    commit(
      groups.map((g) => {
        const without = g.mediaIds.filter((id) => id !== mediaId);
        if (g.id === groupId) {
          return { ...g, mediaIds: [...without, mediaId] };
        }
        return { ...g, mediaIds: without };
      }),
    );
  }

  const interiorGroups = groups.filter((g) => !g.excludeAsExterior);
  const canAnalyze =
    interiorGroups.some((g) => g.mediaIds.length > 0) &&
    interiorGroups.every((g) => g.label.trim().length > 0);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-[var(--border-default)] bg-[var(--surface-secondary,#f8fafa)] p-3 text-sm text-[var(--text-secondary)]">
        <p className="font-medium text-[var(--text-primary)]">Návod k podkladům</p>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-xs leading-relaxed">
          <li>Více pohledů na každou místnost; viditelné rohy, dveře a průchody.</li>
          <li>Stejnou místnost z jiného úhlu sloučte — nevzniká nový pokoj.</li>
          <li>Exteriér vylučte z odvozování geometrie interiéru.</li>
          <li>
            Jedna známá délka ani celková plocha bytu neopravňují dopočet celého
            bytu s deklarovanou přesností.
          </li>
          <li>Rozměry nábytku, dveří a oken nepovažujte za standardní měřítko.</li>
        </ul>
      </div>

      {unassigned.length > 0 ? (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
            Nepřiřazené snímky
          </p>
          <ul className="flex flex-wrap gap-2">
            {unassigned.map((m) => (
              <li key={m.id} className="flex flex-col gap-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={m.url}
                  alt={m.alt ?? ""}
                  className="h-16 w-20 rounded object-cover"
                />
                <select
                  className="fp-input text-xs"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) assignMedia(m.id, e.target.value);
                  }}
                >
                  <option value="">Do skupiny…</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.label}
                    </option>
                  ))}
                </select>
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ul className="space-y-3">
        {groups.map((g) => (
          <li
            key={g.id}
            className="rounded-xl border border-[var(--border-default)] p-3"
          >
            <div className="flex flex-wrap items-end gap-2">
              <label className="min-w-[10rem] flex-1 text-xs">
                Název skupiny / místnosti
                <input
                  className="fp-input"
                  value={g.label}
                  onChange={(e) => rename(g.id, e.target.value)}
                />
              </label>
              <label className="text-xs">
                Podlaží
                <select
                  className="fp-input"
                  value={g.floorId ?? ""}
                  onChange={(e) => setFloor(g.id, e.target.value)}
                >
                  {floors.map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={g.excludeAsExterior}
                  onChange={() => toggle(g.id, "excludeAsExterior")}
                />
                Exteriér
              </label>
              <label className="flex items-center gap-1.5 text-xs">
                <input
                  type="checkbox"
                  checked={g.unclear}
                  onChange={() => toggle(g.id, "unclear")}
                />
                Nejasné
              </label>
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              {g.mediaIds.map((mid) => {
                const m = media.find((x) => x.id === mid);
                if (!m) return null;
                return (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={mid}
                    src={m.url}
                    alt=""
                    className="h-14 w-18 rounded object-cover"
                  />
                );
              })}
              {g.mediaIds.length === 0 ? (
                <span className="text-xs text-[var(--text-muted)]">
                  Žádné snímky — přiřaďte výše nebo sloučte.
                </span>
              ) : null}
            </div>

            <div className="mt-2 flex flex-wrap gap-2">
              <button
                type="button"
                className="fp-btn"
                disabled={g.mediaIds.length < 2}
                onClick={() => split(g.id)}
              >
                Rozdělit úhly
              </button>
              <label className="text-xs">
                Sloučit do
                <select
                  className="fp-input"
                  defaultValue=""
                  onChange={(e) => {
                    if (e.target.value) {
                      mergeInto(e.target.value, g.id);
                      e.target.value = "";
                    }
                  }}
                >
                  <option value="">—</option>
                  {groups
                    .filter((x) => x.id !== g.id)
                    .map((x) => (
                      <option key={x.id} value={x.id}>
                        {x.label}
                      </option>
                    ))}
                </select>
              </label>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="fp-btn" onClick={addEmpty}>
          + Skupina
        </button>
        <button
          type="button"
          className="fp-btn-primary"
          disabled={!canAnalyze || pending}
          onClick={() => onSubmitAnalysis(groups)}
        >
          {pending ? "Odesílám…" : "Spustit analýzu fotografií"}
        </button>
      </div>
      <p className="text-xs text-[var(--text-muted)]">
        Analýza se nespustí automaticky — jen po tomto tlačítku. Bez
        nakonfigurovaného poskytovatele zůstane funkce nedostupná a koncept
        se zachová.
      </p>
    </div>
  );
}
