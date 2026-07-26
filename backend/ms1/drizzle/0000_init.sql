-- Lumify MS-1 initial schema migration
-- Generated to match Drizzle schema in src/database/schema.ts

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  avatar_url TEXT,
  role VARCHAR(20) NOT NULL DEFAULT 'candidate',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  target_role VARCHAR(100),
  experience_level VARCHAR(20),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  refresh_token VARCHAR(512) NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resumes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  storage_path TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  extracted_text TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS job_descriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  company VARCHAR(255),
  file_name VARCHAR(255),
  storage_path TEXT,
  raw_text TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  resume_id UUID REFERENCES resumes(id),
  jd_id UUID REFERENCES job_descriptions(id),
  company VARCHAR(255),
  role VARCHAR(255),
  interview_type VARCHAR(50) NOT NULL,
  experience_level VARCHAR(20) NOT NULL,
  scheduled_at TIMESTAMPTZ,
  status VARCHAR(20) NOT NULL DEFAULT 'scheduled',
  total_questions INTEGER NOT NULL DEFAULT 10,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  interview_id UUID NOT NULL REFERENCES interviews(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id),
  langgraph_thread_id VARCHAR(255) UNIQUE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  questions_asked INTEGER NOT NULL DEFAULT 0,
  overall_score NUMERIC(5,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interview_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES interview_sessions(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_type VARCHAR(50),
  topic VARCHAR(100),
  difficulty VARCHAR(20) NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS candidate_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES interview_questions(id) ON DELETE CASCADE,
  session_id UUID NOT NULL REFERENCES interview_sessions(id),
  audio_storage_path TEXT,
  transcript TEXT,
  response_duration_s INTEGER,
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES candidate_responses(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES interview_questions(id),
  score NUMERIC(4,2) NOT NULL,
  technical_score NUMERIC(4,2),
  communication_score NUMERIC(4,2),
  confidence_score NUMERIC(4,2),
  strengths TEXT[],
  weaknesses TEXT[],
  detailed_feedback TEXT NOT NULL,
  model_reasoning TEXT,
  next_difficulty VARCHAR(20),
  evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS feedback_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE REFERENCES interview_sessions(id),
  user_id UUID NOT NULL REFERENCES users(id),
  overall_score NUMERIC(5,2) NOT NULL,
  technical_score NUMERIC(5,2),
  communication_score NUMERIC(5,2),
  confidence_score NUMERIC(5,2),
  strengths TEXT[],
  weaknesses TEXT[],
  suggestions TEXT[],
  detailed_summary TEXT NOT NULL,
  interview_type VARCHAR(50),
  is_viewed BOOLEAN NOT NULL DEFAULT false,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learning_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  url TEXT NOT NULL,
  resource_type VARCHAR(50) NOT NULL,
  topic VARCHAR(100) NOT NULL,
  difficulty VARCHAR(20),
  provider VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recommended_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID NOT NULL REFERENCES feedback_reports(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES learning_resources(id),
  reason TEXT,
  priority INTEGER NOT NULL DEFAULT 1,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  UNIQUE (report_id, resource_id)
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  related_id UUID,
  related_type VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interview_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  total_interviews INTEGER NOT NULL DEFAULT 0,
  completed_interviews INTEGER NOT NULL DEFAULT 0,
  average_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  best_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  total_practice_time_s INTEGER NOT NULL DEFAULT 0,
  strongest_topic VARCHAR(100),
  weakest_topic VARCHAR(100),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES interview_sessions(id),
  user_id UUID NOT NULL REFERENCES users(id),
  endpoint_called VARCHAR(255) NOT NULL,
  request_payload JSONB,
  response_payload JSONB,
  status_code INTEGER,
  duration_ms INTEGER,
  error_message TEXT,
  called_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS interview_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL UNIQUE REFERENCES interview_sessions(id),
  langgraph_thread_id VARCHAR(255) NOT NULL,
  state_snapshot JSONB NOT NULL,
  checkpoint_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action VARCHAR(100) NOT NULL,
  resource_type VARCHAR(50),
  resource_id UUID,
  ip_address VARCHAR(64),
  user_agent TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_resumes_active ON resumes(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_jd_user_id ON job_descriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_user_id ON interviews(user_id);
CREATE INDEX IF NOT EXISTS idx_interviews_status ON interviews(user_id, status);
CREATE INDEX IF NOT EXISTS idx_interviews_scheduled_at ON interviews(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_sessions_interview_id ON interview_sessions(interview_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_status ON interview_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_questions_session_id ON interview_questions(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_session_id ON candidate_responses(session_id);
CREATE INDEX IF NOT EXISTS idx_responses_question_id ON candidate_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_response_id ON ai_evaluations(response_id);
CREATE INDEX IF NOT EXISTS idx_evaluations_question_id ON ai_evaluations(question_id);
CREATE INDEX IF NOT EXISTS idx_reports_user_id ON feedback_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON ai_agent_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_session_id ON ai_agent_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
