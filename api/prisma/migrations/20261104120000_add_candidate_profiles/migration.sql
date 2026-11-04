-- AI-read profile of each application's CV
CREATE TABLE "candidate_profiles" (
    "id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "error" TEXT,
    "primary_skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "all_skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "years_experience" DOUBLE PRECISION,
    "about" TEXT,
    "summary" TEXT,
    "cv_text" TEXT,
    "model" TEXT,
    "scanned_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "candidate_profiles_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "candidate_profiles_application_id_key" ON "candidate_profiles"("application_id");
CREATE INDEX "candidate_profiles_status_idx" ON "candidate_profiles"("status");

ALTER TABLE "candidate_profiles" ADD CONSTRAINT "candidate_profiles_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
