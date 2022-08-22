/*
  Warnings:

  - Added the required column `userId` to the `SentEmailStat` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SentEmailStat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "emailToken" TEXT NOT NULL,
    "emailCount" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_SentEmailStat" ("emailCount", "emailToken", "id") SELECT "emailCount", "emailToken", "id" FROM "SentEmailStat";
DROP TABLE "SentEmailStat";
ALTER TABLE "new_SentEmailStat" RENAME TO "SentEmailStat";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
