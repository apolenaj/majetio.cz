export {
  FAVOURITE_STATUSES,
  FAVOURITE_STATUS_LABELS_CS,
  FAVOURITE_REJECTION_REASONS,
  FAVOURITE_REJECTION_REASON_LABELS_CS,
  favouriteStatusLabel,
  rejectionReasonLabel,
  isFavouriteStatus,
  isFavouriteRejectionReason,
  isShortlisted,
  isRejectedFavourite,
  normalizeFavouriteStatus,
  DEFAULT_SAVE_STATUS,
  SHORTLIST_STATUS,
  FAVORITE_STATUS,
  type FavouriteStatusValue,
  type FavouriteRejectionReasonValue,
} from "./status";

export type {
  FavouriteSaveInput,
  GuestFavouriteItem,
  FavouriteItem,
  FavouriteListItemDto,
} from "./types";

export {
  SAVE_FAILURE_MESSAGE,
  MERGE_PROMPT_TITLE,
} from "./types";

export {
  GUEST_FAVOURITES_STORAGE_KEY,
  FAVOURITES_CHANGED_EVENT,
  MAX_GUEST_FAVOURITES,
  readGuestFavourites,
  writeGuestFavourites,
  clearGuestFavourites,
  isGuestFavourite,
  upsertGuestFavourite,
  removeGuestFavourite,
  moveGuestToShortlist,
  guestFavouritesPendingMerge,
  dismissGuestMergePrompt,
} from "./guest-storage";

export {
  listRejectedPropertyIdsForUser,
  excludeRejectedFromRecommendations,
  isExcludedFromRecommendations,
} from "./service/recommendation-exclusion";

export {
  sanitizeFavouriteNote,
  sanitizeFavouriteFolder,
} from "./service/sanitize";

export {
  FAVOURITES_DEFAULT_PAGE_SIZE,
  type FavouriteListSort,
} from "./service/sort-favourites";

export type {
  FavouriteListPage,
  FavouriteCollectionDto,
} from "./types";
