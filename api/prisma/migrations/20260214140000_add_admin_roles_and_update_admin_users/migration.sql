-- CreateTable
CREATE TABLE "admin_roles" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    CONSTRAINT "admin_roles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "admin_roles_name_key" ON "admin_roles"("name");

-- Seed admin roles
INSERT INTO "admin_roles" ("id", "name") VALUES ('super_admin_role', 'SuperAdmin');
INSERT INTO "admin_roles" ("id", "name") VALUES ('admin_role', 'Admin');

-- Add new columns to admin_users (nullable first for data migration)
ALTER TABLE "admin_users" ADD COLUMN "email" TEXT;
ALTER TABLE "admin_users" ADD COLUMN "role_id" TEXT;

-- Migrate existing data: copy username to email, assign SuperAdmin role
UPDATE "admin_users" SET "email" = "username", "role_id" = 'super_admin_role';

-- Make columns required
ALTER TABLE "admin_users" ALTER COLUMN "email" SET NOT NULL;
ALTER TABLE "admin_users" ALTER COLUMN "role_id" SET NOT NULL;

-- Drop old username column
ALTER TABLE "admin_users" DROP COLUMN "username";

-- Add unique constraint on email
CREATE UNIQUE INDEX "admin_users_email_key" ON "admin_users"("email");

-- Add foreign key
ALTER TABLE "admin_users" ADD CONSTRAINT "admin_users_role_id_fkey" FOREIGN KEY ("role_id") REFERENCES "admin_roles"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
