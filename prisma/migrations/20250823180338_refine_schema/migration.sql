/*
  Warnings:

  - You are about to drop the column `allergens` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `availableAt` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `priceCents` on the `Item` table. All the data in the column will be lost.
  - Added the required column `discountedPriceCents` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `expiresAt` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `originalPriceCents` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `priceCentsAtPurchase` to the `OrderItem` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "Allergen" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "_AllergenToItem" (
    "A" INTEGER NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_AllergenToItem_A_fkey" FOREIGN KEY ("A") REFERENCES "Allergen" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_AllergenToItem_B_fkey" FOREIGN KEY ("B") REFERENCES "Item" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

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
    CONSTRAINT "Item_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Item" ("description", "id", "name", "restaurantId") SELECT "description", "id", "name", "restaurantId" FROM "Item";
DROP TABLE "Item";
ALTER TABLE "new_Item" RENAME TO "Item";
CREATE INDEX "Item_restaurantId_idx" ON "Item"("restaurantId");
CREATE INDEX "Item_expiresAt_idx" ON "Item"("expiresAt");
CREATE UNIQUE INDEX "Item_restaurantId_name_key" ON "Item"("restaurantId", "name");
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "customer" TEXT,
    "totalCents" INTEGER NOT NULL
);
INSERT INTO "new_Order" ("createdAt", "customer", "id", "totalCents") SELECT "createdAt", "customer", "id", "totalCents" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE TABLE "new_OrderItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "orderId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "priceCentsAtPurchase" INTEGER NOT NULL,
    CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "OrderItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_OrderItem" ("id", "itemId", "orderId", "quantity") SELECT "id", "itemId", "orderId", "quantity" FROM "OrderItem";
DROP TABLE "OrderItem";
ALTER TABLE "new_OrderItem" RENAME TO "OrderItem";
CREATE UNIQUE INDEX "OrderItem_orderId_itemId_key" ON "OrderItem"("orderId", "itemId");
CREATE TABLE "new_Restaurant" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "description" TEXT,
    "imageUrl" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Restaurant" ("address", "createdAt", "id", "name", "updatedAt") SELECT "address", "createdAt", "id", "name", "updatedAt" FROM "Restaurant";
DROP TABLE "Restaurant";
ALTER TABLE "new_Restaurant" RENAME TO "Restaurant";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "Allergen_name_key" ON "Allergen"("name");

-- CreateIndex
CREATE UNIQUE INDEX "_AllergenToItem_AB_unique" ON "_AllergenToItem"("A", "B");

-- CreateIndex
CREATE INDEX "_AllergenToItem_B_index" ON "_AllergenToItem"("B");
