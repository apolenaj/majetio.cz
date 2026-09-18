/**
 * Generates src/domains/properties/search/region-geo-paths.ts from Simplemaps SVGs
 * (CC free commercial use — attribution appreciated: https://simplemaps.com)
 */
const fs = require("fs");
const path = require("path");
const tmp = process.env.TEMP;

const CZ_MAP = {
  CZ10: { id: "praha", label: "Hlavní město Praha", mapLabel: "Praha" },
  CZ20: { id: "stredocesky", label: "Středočeský kraj", mapLabel: "Středočeský" },
  CZ31: { id: "jihocesky", label: "Jihočeský kraj", mapLabel: "Jihočeský" },
  CZ32: { id: "plzensky", label: "Plzeňský kraj", mapLabel: "Plzeňský" },
  CZ41: { id: "karlovarsky", label: "Karlovarský kraj", mapLabel: "Karlovarský" },
  CZ42: { id: "ustecky", label: "Ústecký kraj", mapLabel: "Ústecký" },
  CZ51: { id: "liberecky", label: "Liberecký kraj", mapLabel: "Liberecký" },
  CZ52: {
    id: "kralovehradecky",
    label: "Královéhradecký kraj",
    mapLabel: "Královéhradecký",
  },
  CZ53: { id: "pardubicky", label: "Pardubický kraj", mapLabel: "Pardubický" },
  CZ63: { id: "vysocina", label: "Kraj Vysočina", mapLabel: "Vysočina" },
  CZ64: { id: "jihomoravsky", label: "Jihomoravský kraj", mapLabel: "Jihomoravský" },
  CZ71: { id: "olomoucky", label: "Olomoucký kraj", mapLabel: "Olomoucký" },
  CZ72: { id: "zlinsky", label: "Zlínský kraj", mapLabel: "Zlínský" },
  CZ80: {
    id: "moravskoslezsky",
    label: "Moravskoslezský kraj",
    mapLabel: "Moravskoslezský",
  },
};

const SK_MAP = {
  SKBL: { id: "bratislavsky", label: "Bratislavský kraj", mapLabel: "Bratislavský" },
  SKTA: { id: "trnavsky", label: "Trnavský kraj", mapLabel: "Trnavský" },
  SKTC: { id: "trenciansky", label: "Trenčiansky kraj", mapLabel: "Trenčiansky" },
  SKNI: { id: "nitriansky", label: "Nitriansky kraj", mapLabel: "Nitriansky" },
  SKZI: { id: "zilinsky", label: "Žilinský kraj", mapLabel: "Žilinský" },
  SKBC: {
    id: "banskobystricky",
    label: "Banskobystrický kraj",
    mapLabel: "Banskobystrický",
  },
  SKPV: { id: "presovsky", label: "Prešovský kraj", mapLabel: "Prešovský" },
  SKKI: { id: "kosicky", label: "Košický kraj", mapLabel: "Košický" },
};

function parsePathToAbsolute(d) {
  const tokens = d.match(/[a-zA-Z]|-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || [];
  let i = 0;
  let cmd = "";
  let cx = 0,
    cy = 0,
    startX = 0,
    startY = 0;
  const pts = [];
  const num = () => Number(tokens[i++]);

  while (i < tokens.length) {
    const t = tokens[i];
    if (/[a-zA-Z]/.test(t)) {
      cmd = t;
      i++;
    }
    if (!cmd) break;
    const rel = cmd === cmd.toLowerCase();
    const c = cmd.toUpperCase();

    if (c === "M") {
      let x = num();
      let y = num();
      if (rel) {
        x += cx;
        y += cy;
      }
      cx = x;
      cy = y;
      startX = x;
      startY = y;
      pts.push([x, y]);
      while (i < tokens.length && !/[a-zA-Z]/.test(tokens[i])) {
        let x2 = num();
        let y2 = num();
        if (rel) {
          x2 += cx;
          y2 += cy;
        }
        cx = x2;
        cy = y2;
        pts.push([x2, y2]);
      }
    } else if (c === "L") {
      while (i < tokens.length && !/[a-zA-Z]/.test(tokens[i])) {
        let x = num();
        let y = num();
        if (rel) {
          x += cx;
          y += cy;
        }
        cx = x;
        cy = y;
        pts.push([x, y]);
      }
    } else if (c === "H") {
      while (i < tokens.length && !/[a-zA-Z]/.test(tokens[i])) {
        let x = num();
        if (rel) x += cx;
        cx = x;
        pts.push([cx, cy]);
      }
    } else if (c === "V") {
      while (i < tokens.length && !/[a-zA-Z]/.test(tokens[i])) {
        let y = num();
        if (rel) y += cy;
        cy = y;
        pts.push([cx, cy]);
      }
    } else if (c === "Z") {
      cx = startX;
      cy = startY;
      pts.push([cx, cy]);
    } else if (c === "C") {
      while (i < tokens.length && !/[a-zA-Z]/.test(tokens[i])) {
        num();
        num();
        num();
        num();
        let x = num();
        let y = num();
        if (rel) {
          x += cx;
          y += cy;
        }
        cx = x;
        cy = y;
        pts.push([x, y]);
      }
    } else {
      while (i < tokens.length && !/[a-zA-Z]/.test(tokens[i])) i++;
    }
  }
  return pts;
}

function bboxCenter(pts) {
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;
  for (const [x, y] of pts) {
    minX = Math.min(minX, x);
    minY = Math.min(minY, y);
    maxX = Math.max(maxX, x);
    maxY = Math.max(maxY, y);
  }
  return {
    x: +((minX + maxX) / 2).toFixed(1),
    y: +((minY + maxY) / 2).toFixed(1),
  };
}

function extract(svg) {
  const out = [];
  const paths = [...svg.matchAll(/<path\b[^>]*>/g)].map((x) => x[0]);
  for (const p of paths) {
    const id = (p.match(/\sid="([^"]+)"/) || [])[1];
    const d = (p.match(/\sd="([^"]+)"/) || [])[1];
    if (id && d) {
      const c = bboxCenter(parsePathToAbsolute(d));
      out.push({ svgId: id, d, labelX: c.x, labelY: c.y });
    }
  }
  return out;
}

const czRaw = extract(fs.readFileSync(path.join(tmp, "cz-map.svg"), "utf8"));
const skRaw = extract(fs.readFileSync(path.join(tmp, "sk-map.svg"), "utf8"));

const regions = [];
for (const row of czRaw) {
  const meta = CZ_MAP[row.svgId];
  if (!meta) continue;
  regions.push({
    ...meta,
    short: meta.mapLabel,
    country: "CZ",
    path: row.d,
    labelX: row.labelX,
    labelY: row.labelY,
  });
}
for (const row of skRaw) {
  const meta = SK_MAP[row.svgId];
  if (!meta) continue;
  regions.push({
    ...meta,
    short: meta.mapLabel,
    country: "SK",
    path: row.d,
    labelX: row.labelX,
    labelY: row.labelY,
  });
}

const outFile = path.join(
  "src",
  "domains",
  "properties",
  "search",
  "region-geo-paths.ts",
);

const body = `/* eslint-disable */
/**
 * Geographic kraj paths for CZ + SK interactive map.
 * Source SVG: Simplemaps.com (free for commercial use; attribution appreciated).
 * https://simplemaps.com/svg/country/cz · https://simplemaps.com/svg/country/sk
 *
 * AUTO-GENERATED by scripts/generate-region-geo-paths.cjs — do not edit by hand.
 */

export type GeoRegionCountry = "CZ" | "SK";

export type GeoRegionPath = {
  id: string;
  label: string;
  mapLabel: string;
  short: string;
  country: GeoRegionCountry;
  path: string;
  labelX: number;
  labelY: number;
};

export const CZ_MAP_VIEWBOX = "0 0 1000 570";
export const SK_MAP_VIEWBOX = "0 0 1000 570";
/** Place Slovakia to the right of Czechia in the combined SVG. */
export const SK_MAP_OFFSET_X = 980;

export const GEO_REGION_PATHS: readonly GeoRegionPath[] = ${JSON.stringify(regions, null, 2)} as const;
`;

fs.writeFileSync(outFile, body);
console.log("wrote", outFile, "regions", regions.length);
