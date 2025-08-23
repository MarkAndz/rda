/*
  Warnings:

  - Added the required column `restaurantId` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Order" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "customer" TEXT,
    "customerId" TEXT,
    "checkoutId" TEXT NOT NULL,
    "restaurantId" TEXT NOT NULL,
    "totalCents" INTEGER NOT NULL,
    CONSTRAINT "Order_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Order_checkoutId_fkey" FOREIGN KEY ("checkoutId") REFERENCES "Checkout" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Order_restaurantId_fkey" FOREIGN KEY ("restaurantId") REFERENCES "Restaurant" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Order" ("checkoutId", "createdAt", "customer", "customerId", "id", "status", "totalCents") SELECT "checkoutId", "createdAt", "customer", "customerId", "id", "status", "totalCents" FROM "Order";
DROP TABLE "Order";
ALTER TABLE "new_Order" RENAME TO "Order";
CREATE INDEX "Order_customerId_idx" ON "Order"("customerId");
CREATE INDEX "Order_checkoutId_idx" ON "Order"("checkoutId");
CREATE INDEX "Order_restaurantId_idx" ON "Order"("restaurantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
