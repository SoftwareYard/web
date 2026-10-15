-- Section images (Bunny CDN URLs). Step images live inside the "steps" JSON as "image".
ALTER TABLE "case_studies" ADD COLUMN "logo_image" TEXT,
ADD COLUMN "cover_image" TEXT,
ADD COLUMN "challenge_image" TEXT,
ADD COLUMN "outcome_image" TEXT;
