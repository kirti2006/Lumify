CREATE TABLE "ai_agent_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid,
	"user_id" uuid NOT NULL,
	"endpoint_called" varchar(255) NOT NULL,
	"request_payload" jsonb,
	"response_payload" jsonb,
	"status_code" integer,
	"duration_ms" integer,
	"error_message" text,
	"called_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ai_evaluations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"response_id" uuid NOT NULL,
	"question_id" uuid NOT NULL,
	"score" numeric(4, 2) NOT NULL,
	"technical_score" numeric(4, 2),
	"communication_score" numeric(4, 2),
	"confidence_score" numeric(4, 2),
	"strengths" text[],
	"weaknesses" text[],
	"detailed_feedback" text NOT NULL,
	"model_reasoning" text,
	"next_difficulty" varchar(20),
	"evaluated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid,
	"action" varchar(100) NOT NULL,
	"resource_type" varchar(50),
	"resource_id" uuid,
	"ip_address" varchar(64),
	"user_agent" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "candidate_responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"question_id" uuid NOT NULL,
	"session_id" uuid NOT NULL,
	"audio_storage_path" text,
	"transcript" text,
	"response_duration_s" integer,
	"submitted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_analytics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"total_interviews" integer DEFAULT 0 NOT NULL,
	"completed_interviews" integer DEFAULT 0 NOT NULL,
	"average_score" numeric(5, 2) DEFAULT '0' NOT NULL,
	"best_score" numeric(5, 2) DEFAULT '0' NOT NULL,
	"total_practice_time_s" integer DEFAULT 0 NOT NULL,
	"strongest_topic" varchar(100),
	"weakest_topic" varchar(100),
	"last_updated" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interview_analytics_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "interview_questions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"question_number" integer NOT NULL,
	"question_text" text NOT NULL,
	"question_type" varchar(50),
	"topic" varchar(100),
	"difficulty" varchar(20) NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "interview_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"interview_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"langgraph_thread_id" varchar(255),
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"ended_at" timestamp with time zone,
	"duration_seconds" integer,
	"status" varchar(20) DEFAULT 'active' NOT NULL,
	"questions_asked" integer DEFAULT 0 NOT NULL,
	"overall_score" numeric(5, 2),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interview_sessions_langgraph_thread_id_unique" UNIQUE("langgraph_thread_id")
);
--> statement-breakpoint
CREATE TABLE "interview_state" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"langgraph_thread_id" varchar(255) NOT NULL,
	"state_snapshot" jsonb NOT NULL,
	"checkpoint_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "interview_state_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "interviews" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"resume_id" uuid,
	"jd_id" uuid,
	"company" varchar(255),
	"role" varchar(255),
	"interview_type" varchar(50) NOT NULL,
	"experience_level" varchar(20) NOT NULL,
	"scheduled_at" timestamp with time zone,
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"total_questions" integer DEFAULT 10 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "job_descriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"title" varchar(255),
	"company" varchar(255),
	"file_name" varchar(255),
	"storage_path" text,
	"raw_text" text NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "learning_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" varchar(255) NOT NULL,
	"url" text NOT NULL,
	"resource_type" varchar(50) NOT NULL,
	"topic" varchar(100) NOT NULL,
	"difficulty" varchar(20),
	"provider" varchar(100),
	"is_active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" varchar(50) NOT NULL,
	"title" varchar(255) NOT NULL,
	"message" text NOT NULL,
	"is_read" boolean DEFAULT false NOT NULL,
	"related_id" uuid,
	"related_type" varchar(50),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "recommended_resources" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"report_id" uuid NOT NULL,
	"resource_id" uuid NOT NULL,
	"reason" text,
	"priority" integer DEFAULT 1 NOT NULL,
	"is_completed" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
CREATE TABLE "feedback_reports" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"session_id" uuid NOT NULL,
	"user_id" uuid NOT NULL,
	"overall_score" numeric(5, 2) NOT NULL,
	"technical_score" numeric(5, 2),
	"communication_score" numeric(5, 2),
	"confidence_score" numeric(5, 2),
	"strengths" text[],
	"weaknesses" text[],
	"suggestions" text[],
	"detailed_summary" text NOT NULL,
	"interview_type" varchar(50),
	"is_viewed" boolean DEFAULT false NOT NULL,
	"generated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "feedback_reports_session_id_unique" UNIQUE("session_id")
);
--> statement-breakpoint
CREATE TABLE "resumes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"file_name" varchar(255) NOT NULL,
	"storage_path" text NOT NULL,
	"file_size_bytes" integer NOT NULL,
	"extracted_text" text,
	"is_active" boolean DEFAULT true NOT NULL,
	"uploaded_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"refresh_token" varchar(512) NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_refresh_token_unique" UNIQUE("refresh_token")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" varchar(255) NOT NULL,
	"password_hash" varchar(255) NOT NULL,
	"full_name" varchar(100) NOT NULL,
	"avatar_url" text,
	"role" varchar(20) DEFAULT 'candidate' NOT NULL,
	"is_verified" boolean DEFAULT false NOT NULL,
	"target_role" varchar(100),
	"experience_level" varchar(20),
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "ai_agent_logs" ADD CONSTRAINT "ai_agent_logs_session_id_interview_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_agent_logs" ADD CONSTRAINT "ai_agent_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_evaluations" ADD CONSTRAINT "ai_evaluations_response_id_candidate_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."candidate_responses"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ai_evaluations" ADD CONSTRAINT "ai_evaluations_question_id_interview_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."interview_questions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_responses" ADD CONSTRAINT "candidate_responses_question_id_interview_questions_id_fk" FOREIGN KEY ("question_id") REFERENCES "public"."interview_questions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "candidate_responses" ADD CONSTRAINT "candidate_responses_session_id_interview_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_analytics" ADD CONSTRAINT "interview_analytics_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_questions" ADD CONSTRAINT "interview_questions_session_id_interview_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_interview_id_interviews_id_fk" FOREIGN KEY ("interview_id") REFERENCES "public"."interviews"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_sessions" ADD CONSTRAINT "interview_sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interview_state" ADD CONSTRAINT "interview_state_session_id_interview_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_resume_id_resumes_id_fk" FOREIGN KEY ("resume_id") REFERENCES "public"."resumes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "interviews" ADD CONSTRAINT "interviews_jd_id_job_descriptions_id_fk" FOREIGN KEY ("jd_id") REFERENCES "public"."job_descriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "job_descriptions" ADD CONSTRAINT "job_descriptions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommended_resources" ADD CONSTRAINT "recommended_resources_report_id_feedback_reports_id_fk" FOREIGN KEY ("report_id") REFERENCES "public"."feedback_reports"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recommended_resources" ADD CONSTRAINT "recommended_resources_resource_id_learning_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."learning_resources"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_reports" ADD CONSTRAINT "feedback_reports_session_id_interview_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."interview_sessions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "feedback_reports" ADD CONSTRAINT "feedback_reports_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resumes" ADD CONSTRAINT "resumes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_ai_logs_user_id" ON "ai_agent_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_ai_logs_session_id" ON "ai_agent_logs" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_evaluations_response_id" ON "ai_evaluations" USING btree ("response_id");--> statement-breakpoint
CREATE INDEX "idx_evaluations_question_id" ON "ai_evaluations" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "idx_audit_user_id" ON "audit_logs" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_audit_action" ON "audit_logs" USING btree ("action");--> statement-breakpoint
CREATE INDEX "idx_responses_session_id" ON "candidate_responses" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_responses_question_id" ON "candidate_responses" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "idx_questions_session_id" ON "interview_questions" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_interview_id" ON "interview_sessions" USING btree ("interview_id");--> statement-breakpoint
CREATE INDEX "idx_sessions_user_status" ON "interview_sessions" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_interviews_user_id" ON "interviews" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_interviews_status" ON "interviews" USING btree ("user_id","status");--> statement-breakpoint
CREATE INDEX "idx_interviews_scheduled_at" ON "interviews" USING btree ("scheduled_at");--> statement-breakpoint
CREATE INDEX "idx_jd_user_id" ON "job_descriptions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_user_id" ON "notifications" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_notifications_unread" ON "notifications" USING btree ("user_id","is_read");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_report_resource" ON "recommended_resources" USING btree ("report_id","resource_id");--> statement-breakpoint
CREATE INDEX "idx_reports_user_id" ON "feedback_reports" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_resumes_user_id" ON "resumes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_resumes_active" ON "resumes" USING btree ("user_id","is_active");--> statement-breakpoint
CREATE INDEX "idx_sessions_user_id" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "idx_users_email" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "idx_users_role" ON "users" USING btree ("role");