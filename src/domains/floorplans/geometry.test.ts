import { describe, expect, it } from "vitest";

import {
  DEMO_2KK_FLOOR_PLAN,
  emptyFloorPlanDocument,
  isSelfIntersecting,
  polygonArea,
  rectPolygon,
  recomputeRoomAreas,
  renderFloorPlanSvg,
  validateFloorPlanDocument,
} from "@/domains/floorplans";

describe("floor plan geometry", () => {
  it("computes rectangle area", () => {
    expect(polygonArea(rectPolygon(0, 0, 4, 3))).toBe(12);
  });

  it("detects self-intersecting bowtie", () => {
    expect(
      isSelfIntersecting([
        { x: 0, y: 0 },
        { x: 2, y: 2 },
        { x: 0, y: 2 },
        { x: 2, y: 0 },
      ]),
    ).toBe(true);
  });

  it("does not invent meters for schema without scale", () => {
    const doc = emptyFloorPlanDocument({
      scaleState: "NONE",
      units: "unitless",
      floors: [
        {
          id: "f0",
          name: "1",
          level: 0,
          rooms: [
            {
              id: "r1",
              name: "Pokoj",
              type: "living",
              floorId: "f0",
              polygon: rectPolygon(0, 0, 4, 3),
              rotationDeg: 0,
              lengthM: null,
              widthM: null,
              areaM2: null,
              areaSource: "unknown",
              wallLengthsM: null,
              openings: [],
              notes: null,
              unclear: true,
              photoGroupIds: [],
            },
          ],
        },
      ],
    });
    const next = recomputeRoomAreas(doc);
    expect(next.roomsAreaSumM2).toBeNull();
    expect(next.floors[0]!.rooms[0]!.areaM2).toBeNull();
  });

  it("flags area mismatch as info", () => {
    const issues = validateFloorPlanDocument({
      ...DEMO_2KK_FLOOR_PLAN,
      listedAreaM2: 54,
      roomsAreaSumM2: 40,
    });
    expect(issues.some((i) => i.code === "area_mismatch")).toBe(true);
  });

  it("recomputes area from informant length × width", () => {
    const doc = emptyFloorPlanDocument({
      scaleState: "PARTIAL",
      units: "m",
      outputKind: "INFORMANT_MEASURED",
      floors: [
        {
          id: "f0",
          name: "1",
          level: 0,
          rooms: [
            {
              id: "r1",
              name: "Pokoj",
              type: "living",
              floorId: "f0",
              polygon: rectPolygon(0, 0, 1, 1),
              rotationDeg: 0,
              lengthM: 4,
              widthM: 3.5,
              areaM2: null,
              areaSource: "unknown",
              wallLengthsM: null,
              openings: [],
              notes: null,
              unclear: false,
              photoGroupIds: [],
            },
          ],
        },
      ],
    });
    const next = recomputeRoomAreas(doc);
    expect(next.floors[0]!.rooms[0]!.areaM2).toBe(14);
    expect(next.roomsAreaSumM2).toBe(14);
  });

  it("demo 2+kk stays MODEL_DEMO not photo reconstruction", () => {
    expect(DEMO_2KK_FLOOR_PLAN.outputKind).toBe("MODEL_DEMO");
    expect(DEMO_2KK_FLOOR_PLAN.disclaimerCs).toMatch(/Modelová dispozice/i);
    expect(DEMO_2KK_FLOOR_PLAN.listedAreaM2).toBe(54);
  });

  it("renders deterministic SVG with disclaimer for demo plan", () => {
    const svg = renderFloorPlanSvg(DEMO_2KK_FLOOR_PLAN);
    expect(svg).toContain("<svg");
    expect(svg).toContain("Obývací");
    expect(svg).toContain("Modelová");
  });
});
