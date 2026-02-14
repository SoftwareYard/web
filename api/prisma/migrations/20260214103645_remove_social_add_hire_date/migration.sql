/*
  Warnings:

  - You are about to drop the column `github` on the `team_members` table. All the data in the column will be lost.
  - You are about to drop the column `linkedin` on the `team_members` table. All the data in the column will be lost.
  - You are about to drop the column `twitter` on the `team_members` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "team_members" DROP COLUMN "github",
DROP COLUMN "linkedin",
DROP COLUMN "twitter",
ADD COLUMN     "hire_date" TIMESTAMP(3);
