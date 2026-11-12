-- AlterTable
ALTER TABLE "receipts" ADD COLUMN     "category" TEXT,
ADD COLUMN     "duplicate_of_id" TEXT,
ADD COLUMN     "fiscal_codes" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "items" JSONB,
ADD COLUMN     "merchant_address" TEXT,
ADD COLUMN     "merchant_name" TEXT,
ADD COLUMN     "merchant_tax_number" TEXT,
ADD COLUMN     "merchant_vat_number" TEXT,
ADD COLUMN     "payment_method" TEXT,
ADD COLUMN     "receipt_number" TEXT,
ADD COLUMN     "scanned_at" TIMESTAMP(3),
ADD COLUMN     "time" TEXT,
ADD COLUMN     "vat_breakdown" JSONB,
ADD COLUMN     "vat_total" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "receipts_merchant_tax_number_receipt_number_idx" ON "receipts"("merchant_tax_number", "receipt_number");

