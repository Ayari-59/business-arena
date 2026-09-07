ALTER TABLE "competitions" ADD COLUMN "public_visible" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "competitions" ADD COLUMN "tagline" text;--> statement-breakpoint
ALTER TABLE "competitions" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "competitions" ADD COLUMN "organizer_label" text;--> statement-breakpoint
ALTER TABLE "competitions" ADD COLUMN "accent" text;
