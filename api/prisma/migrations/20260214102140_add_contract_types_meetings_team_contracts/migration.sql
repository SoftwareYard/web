-- AlterTable
ALTER TABLE "team_members" ADD COLUMN     "current_salary_eur" DOUBLE PRECISION,
ADD COLUMN     "next_contract_date" TIMESTAMP(3),
ADD COLUMN     "phone" TEXT;

-- CreateTable
CREATE TABLE "contract_types" (
    "id" TEXT NOT NULL,
    "type" TEXT NOT NULL,

    CONSTRAINT "contract_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "one_on_one_meetings" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "feeling_at_work" TEXT,
    "things_outside_work" TEXT,
    "current_workload" TEXT,
    "problems_with_client" TEXT,
    "problems_with_team" TEXT,
    "skills_to_develop" TEXT,
    "growing_in_role" TEXT,
    "training_opportunities" TEXT,
    "anything_else" TEXT,
    "improvement_suggestions" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "one_on_one_meetings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "team_contracts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_salary" DOUBLE PRECISION NOT NULL,
    "next_salary" DOUBLE PRECISION,
    "sign_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "team_contracts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "contract_types_type_key" ON "contract_types"("type");

-- AddForeignKey
ALTER TABLE "one_on_one_meetings" ADD CONSTRAINT "one_on_one_meetings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "team_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "team_contracts" ADD CONSTRAINT "team_contracts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "team_members"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
