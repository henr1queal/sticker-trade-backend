-- DropIndex
DROP INDEX "users_username_key";

-- AlterTable
ALTER TABLE "users" RENAME COLUMN "username" TO "name";
ALTER TABLE "users" ALTER COLUMN "name" TYPE VARCHAR(120);
