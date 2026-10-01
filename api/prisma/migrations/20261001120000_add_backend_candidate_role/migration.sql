-- Add BackEnd candidate role
INSERT INTO "candidate_roles" ("id", "name")
VALUES (md5(random()::text), 'BackEnd')
ON CONFLICT ("name") DO NOTHING;

-- Move existing back-end applications off OTHER
UPDATE "job_applications"
SET "role_id" = (SELECT "id" FROM "candidate_roles" WHERE "name" = 'BackEnd')
WHERE "job_title" ~* '(^|[^a-z0-9])back[- ]?end($|[^a-z0-9])'
  AND ("role_id" IS NULL OR "role_id" = (SELECT "id" FROM "candidate_roles" WHERE "name" = 'OTHER'));
