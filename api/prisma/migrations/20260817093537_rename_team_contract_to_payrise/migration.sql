/*
  Warnings:

  - You are about to drop the `team_contracts` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "team_contracts" DROP CONSTRAINT "team_contracts_user_id_fkey";

-- DropTable
DROP TABLE "team_contracts";

-- CreateTable
CREATE TABLE "payrises" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "net_salary" DOUBLE PRECISION NOT NULL,
    "gross_salary" DOUBLE PRECISION NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "payrises_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "payrises" ADD CONSTRAINT "payrises_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "team_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
