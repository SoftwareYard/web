-- AlterTable
ALTER TABLE "case_studies" ADD COLUMN     "anonymous_name" TEXT,
ADD COLUMN     "show_client" BOOLEAN NOT NULL DEFAULT true;

