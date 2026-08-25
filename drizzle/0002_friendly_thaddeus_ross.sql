ALTER TABLE "games" ADD COLUMN "join_code" text;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_join_code_unique" UNIQUE("join_code");