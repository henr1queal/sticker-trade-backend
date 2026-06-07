-- AlterTable
ALTER TABLE "users" ADD COLUMN "terms_accepted_at" TIMESTAMP(3);

UPDATE "users" SET "terms_accepted_at" = "created_at" WHERE "terms_accepted_at" IS NULL;

ALTER TABLE "users" ALTER COLUMN "terms_accepted_at" SET NOT NULL;
