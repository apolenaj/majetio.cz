/**
 * Geometry helpers + validation for floor plan polygons.
 */

import type {
  FloorPlanDocument,
  FloorPlanIssue,
  FloorPlanRoom,
  Point2,
} from "./types";

export function polygonArea(points: Point2[]): number {
  if (points.length < 3) return 0;
  let sum = 0;
  for (let i = 0; i < points.length; i += 1) {
    const a = points[i]!;
    const b = points[(i + 1) % points.length]!;
    sum += a.x * b.y - b.x * a.y;
  }
  return Math.abs(sum) / 2;
}

export function edgeLength(a: Point2, b: Point2): number {
  return Math.hypot(b.x - a.x, b.y - a.y);
}

export function rectPolygon(
  x: number,
  y: number,
  w: number,
  h: number,
): Point2[] {
  return [
    { x, y },
    { x: x + w, y },
    { x: x + w, y: y + h },
    { x, y: y + h },
  ];
}

/** Bounding-box overlap (axis-aligned approx from polygon extents). */
export function polygonsAabbOverlap(a: Point2[], b: Point2[]): boolean {
  if (a.length === 0 || b.length === 0) return false;
  const box = (pts: Point2[]) => {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const p of pts) {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    }
    return { minX, minY, maxX, maxY };
  };
  const A = box(a);
  const B = box(b);
  return !(A.maxX <= B.minX || B.maxX <= A.minX || A.maxY <= B.minY || B.maxY <= A.minY);
}

function segmentsIntersect(p1: Point2, p2: Point2, p3: Point2, p4: Point2): boolean {
  const d = (a: Point2, b: Point2, c: Point2) =>
    (b.x - a.x) * (c.y - a.y) - (b.y - a.y) * (c.x - a.x);
  const d1 = d(p3, p4, p1);
  const d2 = d(p3, p4, p2);
  const d3 = d(p1, p2, p3);
  const d4 = d(p1, p2, p4);
  if (((d1 > 0 && d2 < 0) || (d1 < 0 && d2 > 0)) && ((d3 > 0 && d4 < 0) || (d3 < 0 && d4 > 0))) {
    return true;
  }
  return false;
}

export function isSelfIntersecting(points: Point2[]): boolean {
  const n = points.length;
  if (n < 4) return false;
  for (let i = 0; i < n; i += 1) {
    const a1 = points[i]!;
    const a2 = points[(i + 1) % n]!;
    for (let j = i + 1; j < n; j += 1) {
      if (Math.abs(i - j) <= 1 || (i === 0 && j === n - 1)) continue;
      const b1 = points[j]!;
      const b2 = points[(j + 1) % n]!;
      if (segmentsIntersect(a1, a2, b1, b2)) return true;
    }
  }
  return false;
}

export function openingOnWall(room: FloorPlanRoom, edgeIndex: number): boolean {
  return edgeIndex >= 0 && edgeIndex < room.polygon.length;
}

export function validateFloorPlanDocument(doc: FloorPlanDocument): FloorPlanIssue[] {
  const issues: FloorPlanIssue[] = [];

  for (const floor of doc.floors) {
    for (let i = 0; i < floor.rooms.length; i += 1) {
      const room = floor.rooms[i]!;
      if (room.polygon.length < 3) {
        issues.push({
          code: "room_invalid_polygon",
          messageCs: `Místnost „${room.name}“ má neplatný tvar.`,
          roomId: room.id,
          severity: "error",
        });
      }
      if (isSelfIntersecting(room.polygon)) {
        issues.push({
          code: "room_self_intersect",
          messageCs: `Místnost „${room.name}“ má samoprotínající se tvar.`,
          roomId: room.id,
          severity: "error",
        });
      }
      for (const opening of room.openings) {
        if (!openingOnWall(room, opening.edgeIndex)) {
          issues.push({
            code: "opening_off_wall",
            messageCs: `Otvor v „${room.name}“ není na platné stěně.`,
            roomId: room.id,
            severity: "error",
          });
        }
      }
      for (let j = i + 1; j < floor.rooms.length; j += 1) {
        const other = floor.rooms[j]!;
        if (polygonsAabbOverlap(room.polygon, other.polygon)) {
          issues.push({
            code: "rooms_overlap",
            messageCs: `Místnosti „${room.name}“ a „${other.name}“ se překrývají.`,
            roomId: room.id,
            severity: "warning",
          });
        }
      }
      if (doc.scaleState !== "NONE") {
        if (room.lengthM != null && room.lengthM <= 0) {
          issues.push({
            code: "invalid_length",
            messageCs: `Neplatná délka u „${room.name}“.`,
            roomId: room.id,
            severity: "error",
          });
        }
        if (room.areaM2 != null && room.areaM2 <= 0) {
          issues.push({
            code: "invalid_area",
            messageCs: `Neplatná plocha u „${room.name}“.`,
            roomId: room.id,
            severity: "error",
          });
        }
      }
    }
  }

  if (
    doc.listedAreaM2 != null &&
    doc.roomsAreaSumM2 != null &&
    Math.abs(doc.listedAreaM2 - doc.roomsAreaSumM2) > 0.5
  ) {
    issues.push({
      code: "area_mismatch",
      messageCs: `Součet místností (${doc.roomsAreaSumM2.toLocaleString("cs-CZ")} m²) se liší od inzertní plochy (${doc.listedAreaM2.toLocaleString("cs-CZ")} m²).`,
      severity: "info",
    });
  }

  return issues;
}

export function recomputeRoomAreas(doc: FloorPlanDocument): FloorPlanDocument {
  if (doc.scaleState === "NONE" || doc.units === "unitless") {
    return {
      ...doc,
      roomsAreaSumM2: null,
      floors: doc.floors.map((f) => ({
        ...f,
        rooms: f.rooms.map((r) => ({
          ...r,
          // Preserve informant-entered area; don't invent from unitless polygon.
          areaM2: r.areaSource === "informant" || r.areaSource === "model_demo" || r.areaSource === "document"
            ? r.areaM2
            : null,
        })),
      })),
    };
  }

  let sum = 0;
  const floors = doc.floors.map((f) => ({
    ...f,
    rooms: f.rooms.map((r) => {
      if (r.areaM2 != null && (r.areaSource === "informant" || r.areaSource === "document" || r.areaSource === "model_demo")) {
        sum += r.areaM2;
        return r;
      }
      if (r.lengthM != null && r.widthM != null) {
        const area = Math.round(r.lengthM * r.widthM * 100) / 100;
        sum += area;
        return { ...r, areaM2: area, areaSource: "informant" as const };
      }
      const area = Math.round(polygonArea(r.polygon) * 100) / 100;
      sum += area;
      return { ...r, areaM2: area };
    }),
  }));

  return {
    ...doc,
    floors,
    roomsAreaSumM2: Math.round(sum * 100) / 100,
  };
}
