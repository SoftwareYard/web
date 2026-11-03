-- AI screening runs over job application CVs
CREATE TABLE "cv_screenings" (
    "id" TEXT NOT NULL,
    "criteria" TEXT NOT NULL,
    "role_id" TEXT,
    "applied_from" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'running',
    "total" INTEGER NOT NULL DEFAULT 0,
    "processed" INTEGER NOT NULL DEFAULT 0,
    "created_by_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finished_at" TIMESTAMP(3),

    CONSTRAINT "cv_screenings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "cv_screening_results" (
    "id" TEXT NOT NULL,
    "screening_id" TEXT NOT NULL,
    "application_id" TEXT NOT NULL,
    "verdict" TEXT NOT NULL,
    "years_experience" DOUBLE PRECISION,
    "skills" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "reason" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "cv_screening_results_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "cv_screening_results_screening_id_application_id_key" ON "cv_screening_results"("screening_id", "application_id");
CREATE INDEX "cv_screening_results_screening_id_verdict_idx" ON "cv_screening_results"("screening_id", "verdict");

ALTER TABLE "cv_screenings" ADD CONSTRAINT "cv_screenings_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "candidate_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "cv_screening_results" ADD CONSTRAINT "cv_screening_results_screening_id_fkey" FOREIGN KEY ("screening_id") REFERENCES "cv_screenings"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "cv_screening_results" ADD CONSTRAINT "cv_screening_results_application_id_fkey" FOREIGN KEY ("application_id") REFERENCES "job_applications"("id") ON DELETE CASCADE ON UPDATE CASCADE;
