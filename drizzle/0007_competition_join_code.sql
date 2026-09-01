-- Materialize joinCode from JSONB rules into a dedicated indexed column.
ALTER TABLE "competitions" ADD COLUMN "join_code" text;
UPDATE "competitions" SET "join_code" = "rules"->>'joinCode' WHERE "rules"->>'joinCode' IS NOT NULL;
ALTER TABLE "competitions" ALTER COLUMN "join_code" SET NOT NULL;
ALTER TABLE "competitions" ADD CONSTRAINT "competitions_join_code_unique" UNIQUE("join_code");
