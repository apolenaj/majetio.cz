-- FavouriteCollection + Favourite.collectionId (folders/kolekce structure).
-- User archive (Favourite.archivedAt) remains distinct from Property.status ARCHIVED.

CREATE TABLE "FavouriteCollection" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FavouriteCollection_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "FavouriteCollection_userId_slug_key" ON "FavouriteCollection"("userId", "slug");
CREATE INDEX "FavouriteCollection_userId_sortOrder_idx" ON "FavouriteCollection"("userId", "sortOrder");

ALTER TABLE "FavouriteCollection" ADD CONSTRAINT "FavouriteCollection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Favourite" ADD COLUMN "collectionId" TEXT;

CREATE INDEX "Favourite_userId_collectionId_idx" ON "Favourite"("userId", "collectionId");

ALTER TABLE "Favourite" ADD CONSTRAINT "Favourite_collectionId_fkey" FOREIGN KEY ("collectionId") REFERENCES "FavouriteCollection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
