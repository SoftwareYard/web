-- AlterTable
ALTER TABLE "jobs" ADD COLUMN "client_id" TEXT;

-- AlterTable
ALTER TABLE "job_applications" ADD COLUMN "job_id" TEXT,
ADD COLUMN "rejection_sent_at" TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_client_id_fkey" FOREIGN KEY ("client_id") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Backfill: link existing applications to their job post by title. When several
-- posts share a title, pick the latest one posted on or before the application.
UPDATE "job_applications" a
SET "job_id" = (
  SELECT j."id" FROM "jobs" j
  WHERE j."title" = a."job_title"
  ORDER BY (j."posted_date" <= a."created_at") DESC, j."posted_date" DESC
  LIMIT 1
)
WHERE a."job_id" IS NULL;
