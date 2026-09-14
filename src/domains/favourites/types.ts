import type {
  FavouriteRejectionReasonValue,
  FavouriteStatusValue,
} from "./status";

/** Client + guest payload (no PII beyond listing metadata). */
export type FavouriteSaveInput = {
  propertyId: string;
  slug: string;
  title: string;
  href: string;
  priceCzk?: number | null;
  status?: FavouriteStatusValue;
};

export type GuestFavouriteItem = {
  propertyId: string;
  slug: string;
  title: string;
  href: string;
  status: FavouriteStatusValue;
  createdAt: string;
  priceCzk?: number | null;
  priceAtSave?: number | null;
  note?: string | null;
  folder?: string | null;
  priority?: number | null;
};

/** @deprecated Prefer FavouriteSaveInput — kept for legacy search helpers. */
export type FavouriteItem = {
  id: string;
  slug: string;
  title: string;
  href: string;
  priceCzk?: number | null;
};

export type FavouriteListItemDto = {
  id: string;
  propertyId: string;
  status: FavouriteStatusValue;
  statusLabel: string;
  rejectionReason: FavouriteRejectionReasonValue | null;
  rejectionReasonLabel: string | null;
  folder: string | null;
  /** Structured collection id when assigned. */
  collectionId: string | null;
  collectionName: string | null;
  priority: number | null;
  note: string | null;
  priceAtSave: number | null;
  archivedAt: string | null;
  /**
   * Soft match / Majetio score for sorting — never invent 0 when unknown.
   * Sourced from latest PropertyAnalysis for this user+property when available.
   */
  matchScore: number | null;
  /** Derived from Property.status — favourite row is never auto-deleted. */
  listingLifecycle: {
    kind: "active" | "inactive" | "sold" | "reserved";
    label: string | null;
    keepForCompare: boolean;
  };
  createdAt: string;
  updatedAt: string;
  property: {
    id: string;
    slug: string;
    title: string;
    href: string;
    location: string;
    askingPrice: number | null;
    priceChangeCzk: number | null;
    priceChangePct: number | null;
    imageUrl: string | null;
    layout: string | null;
    usableArea: number | null;
    isDemo: boolean;
    listingStatus: string;
  };
};

export type FavouriteListPage = {
  items: FavouriteListItemDto[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  hasMore: boolean;
  sort: string;
};

/** Lightweight collection DTO — structure ready before full UI. */
export type FavouriteCollectionDto = {
  id: string;
  name: string;
  slug: string;
  sortOrder: number;
  itemCount: number;
};

export const SAVE_FAILURE_MESSAGE = "Nemovitost se nepodařilo uložit.";
export const MERGE_PROMPT_TITLE = "Přenést uložené nemovitosti do účtu";
