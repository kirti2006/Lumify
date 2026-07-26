import { relations } from 'drizzle-orm'
import {
  boolean,
  index,
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const users = pgTable(
  'users',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    passwordHash: varchar('password_hash', { length: 255 }).notNull(),
    fullName: varchar('full_name', { length: 100 }).notNull(),
    avatarUrl: text('avatar_url'),
    role: varchar('role', { length: 20 }).notNull().default('candidate'),
    isVerified: boolean('is_verified').notNull().default(false),
    targetRole: varchar('target_role', { length: 100 }),
    experienceLevel: varchar('experience_level', { length: 20 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('idx_users_email').on(t.email), index('idx_users_role').on(t.role)],
)

export const sessions = pgTable(
  'sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    refreshToken: varchar('refresh_token', { length: 512 }).notNull().unique(),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('idx_sessions_user_id').on(t.userId)],
)

export const otps = pgTable(
  'otps',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    code: varchar('code', { length: 6 }).notNull(),
    type: varchar('type', { length: 20 }).notNull(), // 'VERIFY_EMAIL' or 'PASSWORD_RESET'
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('idx_otps_user_id').on(t.userId), index('idx_otps_code').on(t.code)],
)

export const resumes = pgTable(
  'resumes',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    fileName: varchar('file_name', { length: 255 }).notNull(),
    storagePath: text('storage_path').notNull(),
    fileSizeBytes: integer('file_size_bytes').notNull(),
    extractedText: text('extracted_text'),
    isActive: boolean('is_active').notNull().default(true),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('idx_resumes_user_id').on(t.userId), index('idx_resumes_active').on(t.userId, t.isActive)],
)

export const jobDescriptions = pgTable(
  'job_descriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    title: varchar('title', { length: 255 }),
    company: varchar('company', { length: 255 }),
    fileName: varchar('file_name', { length: 255 }),
    storagePath: text('storage_path'),
    rawText: text('raw_text').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    uploadedAt: timestamp('uploaded_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('idx_jd_user_id').on(t.userId)],
)

export const interviews = pgTable(
  'interviews',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    resumeId: uuid('resume_id').references(() => resumes.id),
    jdId: uuid('jd_id').references(() => jobDescriptions.id),
    company: varchar('company', { length: 255 }),
    role: varchar('role', { length: 255 }),
    interviewType: varchar('interview_type', { length: 50 }).notNull(),
    experienceLevel: varchar('experience_level', { length: 20 }).notNull(),
    scheduledAt: timestamp('scheduled_at', { withTimezone: true }),
    status: varchar('status', { length: 20 }).notNull().default('scheduled'),
    totalQuestions: integer('total_questions').notNull().default(10),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_interviews_user_id').on(t.userId),
    index('idx_interviews_status').on(t.userId, t.status),
    index('idx_interviews_scheduled_at').on(t.scheduledAt),
  ],
)

export const interviewSessions = pgTable(
  'interview_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    interviewId: uuid('interview_id')
      .references(() => interviews.id, { onDelete: 'cascade' })
      .notNull(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    langgraphThreadId: varchar('langgraph_thread_id', { length: 255 }).unique(),
    startedAt: timestamp('started_at', { withTimezone: true }).defaultNow().notNull(),
    endedAt: timestamp('ended_at', { withTimezone: true }),
    durationSeconds: integer('duration_seconds'),
    status: varchar('status', { length: 20 }).notNull().default('active'),
    questionsAsked: integer('questions_asked').notNull().default(0),
    overallScore: numeric('overall_score', { precision: 5, scale: 2 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_sessions_interview_id').on(t.interviewId),
    index('idx_sessions_user_status').on(t.userId, t.status),
  ],
)

export const interviewQuestions = pgTable(
  'interview_questions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id')
      .references(() => interviewSessions.id, { onDelete: 'cascade' })
      .notNull(),
    questionNumber: integer('question_number').notNull(),
    questionText: text('question_text').notNull(),
    questionType: varchar('question_type', { length: 50 }),
    topic: varchar('topic', { length: 100 }),
    difficulty: varchar('difficulty', { length: 20 }).notNull(),
    generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('idx_questions_session_id').on(t.sessionId)],
)

export const candidateResponses = pgTable(
  'candidate_responses',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    questionId: uuid('question_id')
      .references(() => interviewQuestions.id, { onDelete: 'cascade' })
      .notNull(),
    sessionId: uuid('session_id')
      .references(() => interviewSessions.id)
      .notNull(),
    audioStoragePath: text('audio_storage_path'),
    transcript: text('transcript'),
    responseDurationS: integer('response_duration_s'),
    submittedAt: timestamp('submitted_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_responses_session_id').on(t.sessionId),
    index('idx_responses_question_id').on(t.questionId),
  ],
)

export const aiEvaluations = pgTable(
  'ai_evaluations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    responseId: uuid('response_id')
      .references(() => candidateResponses.id, { onDelete: 'cascade' })
      .notNull(),
    questionId: uuid('question_id')
      .references(() => interviewQuestions.id)
      .notNull(),
    score: numeric('score', { precision: 5, scale: 2 }).notNull(),
    technicalScore: numeric('technical_score', { precision: 5, scale: 2 }),
    communicationScore: numeric('communication_score', { precision: 5, scale: 2 }),
    confidenceScore: numeric('confidence_score', { precision: 5, scale: 2 }),
    strengths: text('strengths').array(),
    weaknesses: text('weaknesses').array(),
    detailedFeedback: text('detailed_feedback').notNull(),
    modelReasoning: text('model_reasoning'),
    nextDifficulty: varchar('next_difficulty', { length: 20 }),
    evaluatedAt: timestamp('evaluated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_evaluations_response_id').on(t.responseId),
    index('idx_evaluations_question_id').on(t.questionId),
  ],
)

export const reports = pgTable(
  'feedback_reports',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id')
      .references(() => interviewSessions.id)
      .notNull()
      .unique(),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    overallScore: numeric('overall_score', { precision: 5, scale: 2 }).notNull(),
    technicalScore: numeric('technical_score', { precision: 5, scale: 2 }),
    communicationScore: numeric('communication_score', { precision: 5, scale: 2 }),
    confidenceScore: numeric('confidence_score', { precision: 5, scale: 2 }),
    strengths: text('strengths').array(),
    weaknesses: text('weaknesses').array(),
    suggestions: text('suggestions').array(),
    detailedSummary: text('detailed_summary').notNull(),
    metadata: jsonb('metadata'),
    interviewType: varchar('interview_type', { length: 50 }),
    isViewed: boolean('is_viewed').notNull().default(false),
    generatedAt: timestamp('generated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('idx_reports_user_id').on(t.userId)],
)

export const learningResources = pgTable('learning_resources', {
  id: uuid('id').defaultRandom().primaryKey(),
  title: varchar('title', { length: 255 }).notNull(),
  url: text('url').notNull(),
  resourceType: varchar('resource_type', { length: 50 }).notNull(),
  topic: varchar('topic', { length: 100 }).notNull(),
  difficulty: varchar('difficulty', { length: 20 }),
  provider: varchar('provider', { length: 100 }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})

export const recommendedResources = pgTable(
  'recommended_resources',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    reportId: uuid('report_id')
      .references(() => reports.id, { onDelete: 'cascade' })
      .notNull(),
    resourceId: uuid('resource_id')
      .references(() => learningResources.id)
      .notNull(),
    reason: text('reason'),
    priority: integer('priority').notNull().default(1),
    isCompleted: boolean('is_completed').notNull().default(false),
  },
  (t) => [uniqueIndex('uq_report_resource').on(t.reportId, t.resourceId)],
)

export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id')
      .references(() => users.id, { onDelete: 'cascade' })
      .notNull(),
    type: varchar('type', { length: 50 }).notNull(),
    title: varchar('title', { length: 255 }).notNull(),
    message: text('message').notNull(),
    isRead: boolean('is_read').notNull().default(false),
    relatedId: uuid('related_id'),
    relatedType: varchar('related_type', { length: 50 }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index('idx_notifications_user_id').on(t.userId),
    index('idx_notifications_unread').on(t.userId, t.isRead),
  ],
)

export const interviewAnalytics = pgTable('interview_analytics', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id')
    .references(() => users.id, { onDelete: 'cascade' })
    .notNull()
    .unique(),
  totalInterviews: integer('total_interviews').notNull().default(0),
  completedInterviews: integer('completed_interviews').notNull().default(0),
  averageScore: numeric('average_score', { precision: 5, scale: 2 }).notNull().default('0'),
  bestScore: numeric('best_score', { precision: 5, scale: 2 }).notNull().default('0'),
  totalPracticeTimeS: integer('total_practice_time_s').notNull().default(0),
  strongestTopic: varchar('strongest_topic', { length: 100 }),
  weakestTopic: varchar('weakest_topic', { length: 100 }),
  lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull(),
})

export const aiAgentLogs = pgTable(
  'ai_agent_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    sessionId: uuid('session_id').references(() => interviewSessions.id),
    userId: uuid('user_id')
      .references(() => users.id)
      .notNull(),
    endpointCalled: varchar('endpoint_called', { length: 255 }).notNull(),
    requestPayload: jsonb('request_payload'),
    responsePayload: jsonb('response_payload'),
    statusCode: integer('status_code'),
    durationMs: integer('duration_ms'),
    errorMessage: text('error_message'),
    calledAt: timestamp('called_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('idx_ai_logs_user_id').on(t.userId), index('idx_ai_logs_session_id').on(t.sessionId)],
)

export const interviewState = pgTable('interview_state', {
  id: uuid('id').defaultRandom().primaryKey(),
  sessionId: uuid('session_id')
    .references(() => interviewSessions.id)
    .notNull()
    .unique(),
  langgraphThreadId: varchar('langgraph_thread_id', { length: 255 }).notNull(),
  stateSnapshot: jsonb('state_snapshot').notNull(),
  checkpointAt: timestamp('checkpoint_at', { withTimezone: true }).defaultNow().notNull(),
})

export const auditLogs = pgTable(
  'audit_logs',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').references(() => users.id),
    action: varchar('action', { length: 100 }).notNull(),
    resourceType: varchar('resource_type', { length: 50 }),
    resourceId: uuid('resource_id'),
    ipAddress: varchar('ip_address', { length: 64 }),
    userAgent: text('user_agent'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index('idx_audit_user_id').on(t.userId), index('idx_audit_action').on(t.action)],
)

export const usersRelations = relations(users, ({ many, one }) => ({
  sessions: many(sessions),
  resumes: many(resumes),
  jobDescriptions: many(jobDescriptions),
  interviews: many(interviews),
  notifications: many(notifications),
  analytics: one(interviewAnalytics, {
    fields: [users.id],
    references: [interviewAnalytics.userId],
  }),
}))

export const interviewsRelations = relations(interviews, ({ one, many }) => ({
  user: one(users, { fields: [interviews.userId], references: [users.id] }),
  resume: one(resumes, { fields: [interviews.resumeId], references: [resumes.id] }),
  jobDescription: one(jobDescriptions, { fields: [interviews.jdId], references: [jobDescriptions.id] }),
  sessions: many(interviewSessions),
}))

export const interviewSessionsRelations = relations(interviewSessions, ({ one, many }) => ({
  interview: one(interviews, { fields: [interviewSessions.interviewId], references: [interviews.id] }),
  user: one(users, { fields: [interviewSessions.userId], references: [users.id] }),
  questions: many(interviewQuestions),
  responses: many(candidateResponses),
  report: one(reports, {
    fields: [interviewSessions.id],
    references: [reports.sessionId],
  }),
}))

export const interviewQuestionsRelations = relations(interviewQuestions, ({ one, many }) => ({
  session: one(interviewSessions, {
    fields: [interviewQuestions.sessionId],
    references: [interviewSessions.id],
  }),
  responses: many(candidateResponses),
}))

export const candidateResponsesRelations = relations(candidateResponses, ({ one }) => ({
  question: one(interviewQuestions, {
    fields: [candidateResponses.questionId],
    references: [interviewQuestions.id],
  }),
  session: one(interviewSessions, {
    fields: [candidateResponses.sessionId],
    references: [interviewSessions.id],
  }),
  evaluation: one(aiEvaluations, {
    fields: [candidateResponses.id],
    references: [aiEvaluations.responseId],
  }),
}))

export const reportsRelations = relations(reports, ({ one, many }) => ({
  session: one(interviewSessions, { fields: [reports.sessionId], references: [interviewSessions.id] }),
  user: one(users, { fields: [reports.userId], references: [users.id] }),
  recommendations: many(recommendedResources),
}))

export const recommendedResourcesRelations = relations(recommendedResources, ({ one }) => ({
  report: one(reports, { fields: [recommendedResources.reportId], references: [reports.id] }),
  resource: one(learningResources, {
    fields: [recommendedResources.resourceId],
    references: [learningResources.id],
  }),
}))

export const learningResourcesRelations = relations(learningResources, ({ many }) => ({
  recommendations: many(recommendedResources),
}))
