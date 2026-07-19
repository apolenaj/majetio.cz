/**
 * Public search result DTOs (Prompt 8 Part 1).
 * List cards only — no precise address, notes, or audit.
 */

import {
  toPublicPropertyListItemDto,
  type PropertyRecord,
  type PublicPropertyListItemDto,
  type ToPublicDtoOptions,
} from "../dto";

export type PropertySearchHitDto = PublicPropertyListItemDto;

export type PropertySearchPageDto = {
  items: PropertySearchHitDto[];
  pagination: {
    mode: "page" | "cursor";
    page?: number;
    pageSize: number;
    total?: number;
    nextCursor: string | null;
    hasMore: boolean;
  };
  sort: {
    field: string;
    direction: "asc" | "desc";
  };
  warnings: string[];
  /** Echo of applied (normalized) filters for UI chips — safe values only. */
  appliedFilters: Record<string, unknown>;
};

export function toSearchHitDto(
  record: PropertyRecord,
  opts?: ToPublicDtoOptions,
): PropertySearchHitDto {
  return toPublicPropertyListItemDto(record, opts);
}
