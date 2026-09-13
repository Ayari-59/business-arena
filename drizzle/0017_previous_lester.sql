ALTER TABLE "competition_stages" ADD COLUMN IF NOT EXISTS "starts_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "competition_stages" ADD COLUMN IF NOT EXISTS "ends_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "opens_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN IF NOT EXISTS "closes_at" timestamp with time zone;
