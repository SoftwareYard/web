-- CreateTable
CREATE TABLE "receipts" (
    "id" TEXT NOT NULL,
    "image_url" TEXT NOT NULL,
    "file_name" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "date_source" TEXT NOT NULL DEFAULT 'upload',
    "total" DOUBLE PRECISION,
    "scan_error" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "receipts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "receipts_date_idx" ON "receipts"("date");

