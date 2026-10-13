-- Emails are stored lowercased; applications from these emails are rejected
CREATE TABLE "blocked_applicants" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "full_name" TEXT,
    "reason" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "blocked_applicants_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "blocked_applicants_email_key" ON "blocked_applicants"("email");
