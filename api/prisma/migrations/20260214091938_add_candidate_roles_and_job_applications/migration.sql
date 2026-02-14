-- CreateTable
CREATE TABLE "candidate_roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "candidate_roles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "job_applications" (
    "id" TEXT NOT NULL,
    "full_name" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "gross_salary" INTEGER NOT NULL,
    "salary_gross_eur" INTEGER NOT NULL,
    "salary_gross_mkd" INTEGER NOT NULL,
    "salary_net_eur" INTEGER NOT NULL,
    "salary_net_mkd" INTEGER NOT NULL,
    "role_id" TEXT,
    "job_title" TEXT NOT NULL,
    "cv_link" TEXT NOT NULL,
    "task_link" TEXT,
    "hr_interview_time" TIMESTAMP(3),
    "first_interview_time" TIMESTAMP(3),
    "second_interview_time" TIMESTAMP(3),
    "hr_notes" TEXT,
    "tech_notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "job_applications_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "candidate_roles_name_key" ON "candidate_roles"("name");

-- AddForeignKey
ALTER TABLE "job_applications" ADD CONSTRAINT "job_applications_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "candidate_roles"("id") ON DELETE SET NULL ON UPDATE CASCADE;
