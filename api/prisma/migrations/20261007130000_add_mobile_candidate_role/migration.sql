-- Add Mobile Developer candidate role
INSERT INTO "candidate_roles" ("id", "name")
VALUES (md5(random()::text), 'Mobile Developer')
ON CONFLICT ("name") DO NOTHING;

-- Move existing mobile applications off OTHER
UPDATE "job_applications"
SET "role_id" = (SELECT "id" FROM "candidate_roles" WHERE "name" = 'Mobile Developer')
WHERE "job_title" ~* '(^|[^a-z0-9])(mobile|ios|android|flutter|react[- ]?native)($|[^a-z0-9])'
  AND ("role_id" IS NULL OR "role_id" = (SELECT "id" FROM "candidate_roles" WHERE "name" = 'OTHER'));
