-- On-hold applications are skipped by AI scans and screenings
ALTER TABLE "job_applications" ADD COLUMN "on_hold" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "job_applications" ADD COLUMN "hold_reason" TEXT;
ALTER TABLE "job_applications" ADD COLUMN "held_at" TIMESTAMP(3);

ALTER TABLE "cv_screenings" ADD COLUMN "stop_reason" TEXT;
