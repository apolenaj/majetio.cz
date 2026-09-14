/**
 * Favourites helpers — re-exports Decision Workspace client API.
 * Prefer `@/domains/favourites/client/save` for new code.
 */

export {
  isFavourite,
  toggleFavourite,
  toggleSaveProperty,
  readFavourites,
  writeFavourites,
  FAVOURITES_STORAGE_KEY,
  type ToggleSaveResult,
} from "@/domains/favourites/client/save";

export type { FavouriteItem } from "@/domains/favourites/types";
export { SAVE_FAILURE_MESSAGE } from "@/domains/favourites/types";
