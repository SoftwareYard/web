-- DropForeignKey
ALTER TABLE "time_off_balances" DROP CONSTRAINT "time_off_balances_employee_id_fkey";

-- DropForeignKey
ALTER TABLE "time_off_requests" DROP CONSTRAINT "time_off_requests_employee_id_fkey";

-- AlterTable
ALTER TABLE "team_members" ADD COLUMN     "password" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "team_members_email_key" ON "team_members"("email");

-- AddForeignKey
ALTER TABLE "time_off_requests" ADD CONSTRAINT "time_off_requests_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "time_off_balances" ADD CONSTRAINT "time_off_balances_employee_id_fkey" FOREIGN KEY ("employee_id") REFERENCES "team_members"("id") ON DELETE CASCADE ON UPDATE CASCADE;

