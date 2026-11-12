-- Receipts entered by hand may have no photo
ALTER TABLE "receipts" ALTER COLUMN "image_url" DROP NOT NULL;
ALTER TABLE "receipts" ALTER COLUMN "file_name" DROP NOT NULL;
