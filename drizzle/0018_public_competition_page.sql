ALTER TABLE "competitions" ADD COLUMN IF NOT EXISTS "public_visible" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "competitions" ADD COLUMN IF NOT EXISTS "tagline" text;--> statement-breakpoint
ALTER TABLE "competitions" ADD COLUMN IF NOT EXISTS "description" text;--> statement-breakpoint
ALTER TABLE "competitions" ADD COLUMN IF NOT EXISTS "organizer_label" text;--> statement-breakpoint
ALTER TABLE "competitions" ADD COLUMN IF NOT EXISTS "accent" text;
