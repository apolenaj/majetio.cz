import { Prisma, type Location, type LocationType } from "@prisma/client";

import { prisma } from "@/lib/db";
import { locationTypeRank } from "@/domains/locations/types/hierarchy";
import { normalizeLocationName } from "@/domains/locations/service/normalize";

export type LocationRecord = Pick<
  Location,
  | "id"
  | "type"
  | "parentId"
  | "countryCode"
  | "name"
  | "slug"
  | "publicLabel"
  | "officialCode"
  | "ruianCode"
  | "lauCode"
  | "nutsCode"
  | "latitude"
  | "longitude"
  | "centroidLat"
  | "centroidLon"
  | "boundary"
>;

const SELECT = {
  id: true,
  type: true,
  parentId: true,
  countryCode: true,
  name: true,
  slug: true,
  publicLabel: true,
  officialCode: true,
  ruianCode: true,
  lauCode: true,
  nutsCode: true,
  latitude: true,
  longitude: true,
  centroidLat: true,
  centroidLon: true,
  boundary: true,
} satisfies Prisma.LocationSelect;

export type LocationRepository = {
  findById(id: string): Promise<LocationRecord | null>;
  findBySlug(slug: string): Promise<LocationRecord | null>;
  findSiblings(locationId: string, limit?: number): Promise<LocationRecord[]>;
  findByOfficialCodes(input: {
    countryCode: string;
    ruianCode?: string | null;
    officialCode?: string | null;
    lauCode?: string | null;
    nutsCode?: string | null;
  }): Promise<LocationRecord | null>;
  findByNameAndType(input: {
    countryCode: string;
    type: LocationType;
    name: string;
    /** null = root level; undefined = any parent */
    parentId?: string | null;
  }): Promise<LocationRecord | null>;
  findWithBoundary(countryCode: string): Promise<LocationRecord[]>;
};

export function createPrismaLocationRepository(): LocationRepository {
  return {
    async findById(id) {
      return prisma.location.findUnique({ where: { id }, select: SELECT });
    },

    async findBySlug(slug) {
      return prisma.location.findUnique({ where: { slug }, select: SELECT });
    },

    async findSiblings(locationId, limit = 6) {
      const current = await prisma.location.findUnique({
        where: { id: locationId },
        select: { parentId: true },
      });
      if (!current?.parentId) return [];
      return prisma.location.findMany({
        where: { parentId: current.parentId, id: { not: locationId } },
        select: SELECT,
        take: limit,
        orderBy: { name: "asc" },
      });
    },

    async findByOfficialCodes(input) {
      const or: Prisma.LocationWhereInput[] = [];
      if (input.ruianCode) {
        or.push({ countryCode: input.countryCode, ruianCode: input.ruianCode });
      }
      if (input.officialCode) {
        or.push({
          countryCode: input.countryCode,
          officialCode: input.officialCode,
        });
      }
      if (input.lauCode) {
        or.push({ countryCode: input.countryCode, lauCode: input.lauCode });
      }
      if (input.nutsCode) {
        or.push({ countryCode: input.countryCode, nutsCode: input.nutsCode });
      }
      if (or.length === 0) return null;

      const rows = await prisma.location.findMany({
        where: { OR: or },
        select: SELECT,
      });

      if (rows.length === 0) return null;
      rows.sort((a, b) => locationTypeRank(b.type) - locationTypeRank(a.type));
      return rows[0] ?? null;
    },

    async findByNameAndType(input) {
      const normalized = normalizeLocationName(input.name);
      const rows = await prisma.location.findMany({
        where: {
          countryCode: input.countryCode,
          type: input.type,
          ...(input.parentId !== undefined ? { parentId: input.parentId } : {}),
        },
        select: SELECT,
      });

      return (
        rows.find((r) => normalizeLocationName(r.name) === normalized) ?? null
      );
    },

    async findWithBoundary(countryCode) {
      const rows = await prisma.location.findMany({
        where: { countryCode },
        select: SELECT,
      });
      return rows.filter((r) => r.boundary != null);
    },
  };
}
