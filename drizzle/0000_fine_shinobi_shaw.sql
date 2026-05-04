CREATE TABLE IF NOT EXISTS "matches" (
	"id" serial PRIMARY KEY NOT NULL,
	"match_number" integer NOT NULL,
	"match_date" varchar(20) NOT NULL,
	"match_time" varchar(10) NOT NULL,
	"kickoff_at" timestamp NOT NULL,
	"group_name" varchar(5) NOT NULL,
	"home_team" varchar(60) NOT NULL,
	"away_team" varchar(60) NOT NULL,
	"home_flag" varchar(10),
	"away_flag" varchar(10),
	"stadium" varchar(80) NOT NULL,
	"home_score" integer,
	"away_score" integer,
	CONSTRAINT "matches_match_number_unique" UNIQUE("match_number")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "predictions" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"match_id" integer NOT NULL,
	"home_score" integer NOT NULL,
	"away_score" integer NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(60) NOT NULL,
	"pin_hash" text NOT NULL,
	"is_admin" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "predictions" ADD CONSTRAINT "predictions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "predictions" ADD CONSTRAINT "predictions_match_id_matches_id_fk" FOREIGN KEY ("match_id") REFERENCES "public"."matches"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "predictions_user_match_idx" ON "predictions" USING btree ("user_id","match_id");--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "users_name_idx" ON "users" USING btree ("name");