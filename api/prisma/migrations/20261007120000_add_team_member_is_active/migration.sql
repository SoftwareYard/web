-- Deactivated team members are kept for history but hidden from salaries, the website, etc.
ALTER TABLE "team_members" ADD COLUMN "is_active" BOOLEAN NOT NULL DEFAULT true;
