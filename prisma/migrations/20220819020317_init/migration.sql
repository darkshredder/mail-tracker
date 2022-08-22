/*
  Warnings:

  - You are about to drop the column `email` on the `SentEmailStat` table. All the data in the column will be lost.
  - You are about to drop the column `status` on the `SentEmailStat` table. All the data in the column will be lost.
  - Added the required column `emailToken` to the `SentEmailStat` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_SentEmailStat" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "emailToken" TEXT NOT NULL,
    "emailCount" INTEGER NOT NULL DEFAULT 0
);
INSERT INTO "new_SentEmailStat" ("id") SELECT "id" FROM "SentEmailStat";
DROP TABLE "SentEmailStat";
ALTER TABLE "new_SentEmailStat" RENAME TO "SentEmailStat";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
