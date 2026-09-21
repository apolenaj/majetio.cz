import { describe, expect, it } from "vitest";

import { DEMO_2KK_FLOOR_PLAN } from "./demo-2kk";
import { emptyFloorPlanDocument, rectPolygon } from "./index";
import {
  documentHasManualEdits,
  mergeAnalysisProposal,
} from "./merge";

describe("floor plan merge / versioning", () => {
  it("protects manual edits from silent AI overwrite", () => {
    const current = {
      ...DEMO_2KK_FLOOR_PLAN,
      hasManualEdits: true,
    };
    const result = mergeAnalysisProposal(current, {
      floors: [
        {
          id: "floor-ai",
          name: "AI",
          level: 0,
          rooms: [
            {
              id: "ai-1",
              name: "Vymyšlený pokoj",
              type: "living",
              floorId: "floor-ai",
              polygon: rectPolygon(0, 0, 10, 10),
              rotationDeg: 0,
              lengthM: null,
              widthM: null,
              areaM2: null,
              areaSource: "photo_observation",
              wallLengthsM: null,
              openings: [],
              notes: null,
              unclear: true,
              photoGroupIds: [],
            },
          ],
        },
      ],
      outputKind: "ORIENTATIONAL",
      scaleState: "NONE",
    });
    expect(result.applied).toBe(false);
    expect(result.document.floors[0]!.rooms[0]!.name).toBe("Předsíň");
    expect(
      result.document.issues.some((i) => i.code === "ai_pending_review"),
    ).toBe(true);
  });

  it("rejects stale job against newer draft version", () => {
    const current = emptyFloorPlanDocument();
    const result = mergeAnalysisProposal(
      current,
      { expectedDraftVersion: 1, floors: [] },
      { currentDraftVersion: 3 },
    );
    expect(result.applied).toBe(false);
    expect(result.reasonCs).toMatch(/starší analýzy/i);
  });

  it("detects informant dimensions as manual edits", () => {
    const doc = emptyFloorPlanDocument({
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
              lengthM: 4,
              widthM: 3,
              areaM2: 12,
              areaSource: "informant",
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
    expect(documentHasManualEdits(doc)).toBe(true);
  });
});
