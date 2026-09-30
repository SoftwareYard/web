-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "good_to_have" TEXT[] DEFAULT ARRAY[]::TEXT[];
