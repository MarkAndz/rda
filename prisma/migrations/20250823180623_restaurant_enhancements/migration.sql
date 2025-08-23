/*
  Warnings:

  - Added the required column `slug` to the `Restaurant` table without a default value. This is not possible if the table is not empty.

*/
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Item_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("createdAt", "description", "discountedPriceCents", "expiresAt", "id", "imageUrl", "name", "originalPriceCents", "quantityAvailable", "restaurantId", "updatedAt") SELECT "createdAt", "description", "discountedPriceCents", "expiresAt", "id", "imageUrl", "name", "originalPriceCents", "quantityAvailable", "restaurantId", "updatedAt" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE INDEX "Item_restaurantId_idx" ON "Item"("restaurantId");
CREATE INDEX "Item_expiresAt_idx" ON "Item"("expiresAt");
CREATE UNIQUE INDEX "Item_restaurantId_name_key" ON "Item"("restaurantId", "name");
CREATE TABLE "new_OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priceCentsAtPurchase" INTEGER NOT NULL,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_OrderItem" ("id", "itemId", "orderId", "priceCentsAtPurchase", "quantity") SELECT "id", "itemId", "orderId", "priceCentsAtPurchase", "quantity" FROM "OrderItem";
DROP TABLE "OrderItem";
ALTER TABLE "new_OrderItem" RENAME TO "OrderItem";
CREATE UNIQUE INDEX "OrderItem_orderId_itemId_key" ON "OrderItem"("orderId", "itemId");
CREATE TABLE "new_Restaurant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT,
    "country" TEXT,
    "postcode" TEXT,
    "latitude" REAL,
    "longitude" REAL,
    "timezone" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "description" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Restaurant" ("address", "createdAt", "description", "id", "imageUrl", "isActive", "name", "updatedAt") SELECT "address", "createdAt", "description", "id", "imageUrl", "isActive", "name", "updatedAt" FROM "Restaurant";
DROP TABLE "Restaurant";
ALTER TABLE "new_Restaurant" RENAME TO "Restaurant";
CREATE UNIQUE INDEX "Restaurant_slug_key" ON "Restaurant"("slug");
CREATE INDEX "Restaurant_isActive_idx" ON "Restaurant"("isActive");
CREATE INDEX "Restaurant_city_idx" ON "Restaurant"("city");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
