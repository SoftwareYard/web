-- Light/white logos are shown on a dark background so they stay visible
ALTER TABLE "case_studies" ADD COLUMN "logo_on_dark" BOOLEAN NOT NULL DEFAULT false;

-- Remove stray leading/trailing whitespace from existing content
-- (e.g. "Home Emergency Cover " showed up as a separate industry filter)
UPDATE "case_studies" SET
  "slug" = btrim("slug"),
  "name" = btrim("name"),
  "industry" = btrim("industry"),
  "location" = btrim("location"),
  "headline" = btrim("headline"),
  "summary" = btrim("summary"),
  "challenge" = btrim("challenge"),
  "outcome" = btrim("outcome"),
  "services" = ARRAY(SELECT btrim(s) FROM unnest("services") AS s WHERE btrim(s) <> ''),
  "technologies" = ARRAY(SELECT btrim(t) FROM unnest("technologies") AS t WHERE btrim(t) <> ''),
  "testimonial_quote" = NULLIF(btrim("testimonial_quote"), ''),
  "testimonial_author" = NULLIF(btrim("testimonial_author"), ''),
  "testimonial_role" = NULLIF(btrim("testimonial_role"), '');
