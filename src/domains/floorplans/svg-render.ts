/**
 * Deterministic SVG renderer from floor plan document (not generative imagery).
 */

import type { FloorPlanDocument, FloorPlanFloor, Point2 } from "./types";
import { OUTPUT_KIND_LABEL_CS } from "./types";

function esc(text: string): string {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function polyPoints(pts: Point2[]): string {
  return pts.map((p) => `${p.x},${p.y}`).join(" ");
}

function bounds(floor: FloorPlanFloor): {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
} {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const room of floor.rooms) {
    for (const p of room.polygon) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
  }
  if (!Number.isFinite(minX)) {
    return { minX: 0, minY: 0, maxX: 10, maxY: 10 };
  }
  return { minX, minY, maxX, maxY };
}

function centroid(pts: Point2[]): Point2 {
  if (pts.length === 0) return { x: 0, y: 0 };
  let x = 0;
  let y = 0;
  for (const p of pts) {
    x += p.x;
    y += p.y;
  }
  return { x: x / pts.length, y: y / pts.length };
}

function rotatePolygon(pts: Point2[], deg: number): Point2[] {
  if (!deg) return pts;
  const c = centroid(pts);
  const rad = (deg * Math.PI) / 180;
  const cos = Math.cos(rad);
  const sin = Math.sin(rad);
  return pts.map((p) => {
    const dx = p.x - c.x;
    const dy = p.y - c.y;
    return {
      x: c.x + dx * cos - dy * sin,
      y: c.y + dx * sin + dy * cos,
    };
  });
}

export function renderFloorPlanSvg(
  doc: FloorPlanDocument,
  options?: {
    floorId?: string;
    width?: number;
    height?: number;
    showFurniture?: boolean;
    includeDisclaimer?: boolean;
  },
): string {
  const floor =
    doc.floors.find((f) => f.id === options?.floorId) ?? doc.floors[0];
  if (!floor) {
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 240"><text x="20" y="40" fill="#667a86">Půdorys zatím nemá podlaží.</text></svg>`;
  }

  const pad = 1.2;
  const b = bounds(floor);
  const w = Math.max(1, b.maxX - b.minX);
  const h = Math.max(1, b.maxY - b.minY);
  const vb = `${b.minX - pad} ${b.minY - pad} ${w + pad * 2} ${h + pad * 2}`;
  const showDims = doc.scaleState !== "NONE" && doc.units === "m";
  const label = OUTPUT_KIND_LABEL_CS[doc.outputKind];

  const roomsSvg = floor.rooms
    .map((room) => {
      const poly = rotatePolygon(room.polygon, room.rotationDeg);
      const c = centroid(poly);
      const areaLabel =
        showDims && room.areaM2 != null
          ? `${room.areaM2.toLocaleString("cs-CZ")} m²`
          : "";
      const openings = room.openings
        .map((op) => {
          const a = poly[op.edgeIndex];
          const bPt = poly[(op.edgeIndex + 1) % poly.length];
          if (!a || !bPt) return "";
          const x = a.x + (bPt.x - a.x) * op.t;
          const y = a.y + (bPt.y - a.y) * op.t;
          const color = op.kind === "window" ? "#0d9a92" : "#0b3550";
          return `<circle cx="${x}" cy="${y}" r="0.12" fill="${color}" />`;
        })
        .join("");
      return `
      <g data-room-id="${esc(room.id)}">
        <polygon points="${polyPoints(poly)}" fill="#f4fafa" stroke="#0b3550" stroke-width="0.08" />
        <text x="${c.x}" y="${c.y - 0.15}" text-anchor="middle" font-size="0.35" fill="#0b3550" font-family="system-ui,sans-serif">${esc(room.name)}</text>
        ${areaLabel ? `<text x="${c.x}" y="${c.y + 0.25}" text-anchor="middle" font-size="0.28" fill="#667a86" font-family="system-ui,sans-serif">${esc(areaLabel)}</text>` : ""}
        ${openings}
      </g>`;
    })
    .join("");

  const disclaimer =
    options?.includeDisclaimer !== false
      ? `<text x="${b.minX}" y="${b.maxY + pad * 0.7}" font-size="0.28" fill="#667a86" font-family="system-ui,sans-serif">${esc(label)} — ${esc(doc.disclaimerCs.slice(0, 120))}${doc.disclaimerCs.length > 120 ? "…" : ""}</text>`
      : "";

  const width = options?.width ?? 800;
  const height = options?.height ?? 560;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${vb}" role="img" aria-label="Půdorys — ${esc(floor.name)}">
  <rect x="${b.minX - pad}" y="${b.minY - pad}" width="${w + pad * 2}" height="${h + pad * 2}" fill="#ffffff"/>
  ${roomsSvg}
  ${disclaimer}
</svg>`;
}
