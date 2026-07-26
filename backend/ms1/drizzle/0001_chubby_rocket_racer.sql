CREATE TABLE "otps" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"code" varchar(6) NOT NULL,
	"type" varchar(20) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "ai_evaluations" ALTER COLUMN "score" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "ai_evaluations" ALTER COLUMN "technical_score" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "ai_evaluations" ALTER COLUMN "communication_score" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "ai_evaluations" ALTER COLUMN "confidence_score" SET DATA TYPE numeric(5, 2);--> statement-breakpoint
ALTER TABLE "feedback_reports" ADD COLUMN "metadata" jsonb;--> statement-breakpoint
ALTER TABLE "otps" ADD CONSTRAINT "otps_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_otps_user_id" ON "otps" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_otps_code" ON "otps" USING btree ("code");