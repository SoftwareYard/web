-- CreateTable
CREATE TABLE "technologies" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "technologies_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "technologies_name_key" ON "technologies"("name");

-- AlterTable
ALTER TABLE "jobs" ADD COLUMN     "technology_id" TEXT;

-- AddForeignKey
ALTER TABLE "jobs" ADD CONSTRAINT "jobs_technology_id_fkey" FOREIGN KEY ("technology_id") REFERENCES "technologies"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Predefined technologies
INSERT INTO "technologies" ("id", "name", "updated_at") VALUES
    (md5(random()::text), '.NET', CURRENT_TIMESTAMP),
    (md5(random()::text), 'Node.js', CURRENT_TIMESTAMP),
    (md5(random()::text), 'Next.js', CURRENT_TIMESTAMP),
    (md5(random()::text), 'React.js', CURRENT_TIMESTAMP),
    (md5(random()::text), 'React Native', CURRENT_TIMESTAMP),
    (md5(random()::text), 'Angular', CURRENT_TIMESTAMP),
    (md5(random()::text), 'Vue.js', CURRENT_TIMESTAMP),
    (md5(random()::text), 'Java', CURRENT_TIMESTAMP),
    (md5(random()::text), 'Python', CURRENT_TIMESTAMP),
    (md5(random()::text), 'PHP', CURRENT_TIMESTAMP);
