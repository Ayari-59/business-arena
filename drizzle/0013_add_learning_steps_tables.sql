CREATE TABLE "completed_learning_steps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"step_id" text NOT NULL,
	"path_id" text NOT NULL,
	"completed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_path_progression" (
	"user_id" uuid NOT NULL,
	"path_id" text NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completion_score" numeric(5, 2) DEFAULT '0' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "learning_path_progression_user_id_path_id_pk" PRIMARY KEY("user_id","path_id")
);
--> statement-breakpoint
ALTER TABLE "completed_learning_steps" ADD CONSTRAINT "completed_learning_steps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "learning_path_progression" ADD CONSTRAINT "learning_path_progression_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "completed_learning_steps_user_idx" ON "completed_learning_steps" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "completed_learning_steps_step_idx" ON "completed_learning_steps" USING btree ("step_id");