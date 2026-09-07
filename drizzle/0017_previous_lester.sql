ALTER TABLE "competition_stages" ADD COLUMN "starts_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "competition_stages" ADD COLUMN "ends_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "opens_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "games" ADD COLUMN "closes_at" timestamp with time zone;
