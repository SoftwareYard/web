-- CreateEnum
CREATE TYPE "time_off_type" AS ENUM ('Annual', 'Special');

-- AlterTable
ALTER TABLE "time_off_requests" ADD COLUMN     "type" "time_off_type" NOT NULL DEFAULT 'Annual';

