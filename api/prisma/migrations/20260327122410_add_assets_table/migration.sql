-- CreateTable
CREATE TABLE "assets" (
    "id" TEXT NOT NULL,
    "store_id" TEXT NOT NULL,
    "purchase_date" TIMESTAMP(3) NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "serial_number" TEXT NOT NULL,
    "year_of_manufacture" INTEGER NOT NULL,
    "current_holder_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assets_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "assets" ADD CONSTRAINT "assets_current_holder_id_fkey" FOREIGN KEY ("current_holder_id") REFERENCES "team_members"("id") ON DELETE SET NULL ON UPDATE CASCADE;
