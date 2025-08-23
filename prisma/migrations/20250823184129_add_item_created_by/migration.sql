-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Item" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "restaurantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "originalPriceCents" INTEGER NOT NULL,
    "discountedPriceCents" INTEGER NOT NULL,
    "quantityAvailable" INTEGER NOT NULL DEFAULT 0,
    "expiresAt" DATETIME NOT NULL,
    "imageUrl" TEXT,
    "createdById" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Item_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Item_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("createdAt", "description", "discountedPriceCents", "expiresAt", "id", "imageUrl", "name", "originalPriceCents", "quantityAvailable", "restaurantId", "updatedAt") SELECT "createdAt", "description", "discountedPriceCents", "expiresAt", "id", "imageUrl", "name", "originalPriceCents", "quantityAvailable", "restaurantId", "updatedAt" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE INDEX "Item_restaurantId_idx" ON "Item"("restaurantId");
CREATE INDEX "Item_expiresAt_idx" ON "Item"("expiresAt");
CREATE INDEX "Item_createdById_idx" ON "Item"("createdById");
CREATE UNIQUE INDEX "Item_restaurantId_name_key" ON "Item"("restaurantId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
