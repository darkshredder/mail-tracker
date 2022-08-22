/*
  Warnings:

  - You are about to drop the column `emailCount` on the `SentEmailStat` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "SentEmailStatWithTimeStamp" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "emailToken" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SentEmailStat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "emailToken" TEXT NOT NULL
);
INSERT INTO "new_SentEmailStat" ("emailToken", "id", "userId") SELECT "emailToken", "id", "userId" FROM "SentEmailStat";
DROP TABLE "SentEmailStat";
ALTER TABLE "new_SentEmailStat" RENAME TO "SentEmailStat";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
