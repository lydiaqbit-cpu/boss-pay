/*
  Warnings:

  - You are about to drop the column `alipayAccount` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `alipayName` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `bankCard` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `bankHolder` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `bankName` on the `User` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "phone" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "nickname" TEXT NOT NULL,
    "avatar" TEXT,
    "bio" TEXT,
    "wechatQrUrl" TEXT,
    "alipayQrUrl" TEXT,
    "defaultPaymentMethod" TEXT,
    "subscriptionExpiry" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_User" ("avatar", "bio", "createdAt", "defaultPaymentMethod", "id", "nickname", "password", "phone", "subscriptionExpiry", "wechatQrUrl") SELECT "avatar", "bio", "createdAt", "defaultPaymentMethod", "id", "nickname", "password", "phone", "subscriptionExpiry", "wechatQrUrl" FROM "User";
DROP TABLE "User";
ALTER TABLE "new_User" RENAME TO "User";
CREATE UNIQUE INDEX "User_phone_key" ON "User"("phone");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
