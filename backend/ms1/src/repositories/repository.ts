import { and, count, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { db } from '../database/client.js'
import {
  aiAgentLogs,
  aiEvaluations,
  auditLogs,
  candidateResponses,
  interviewAnalytics,
  interviewQuestions,
  interviewSessions,
  interviews,
  jobDescriptions,
  learningResources,
  notifications,
  recommendedResources,
  reports,
  resumes,
  sessions,
  users,
  otps,
} from '../database/schema.js'

export const userRepository = {
  findByEmail: (email: string) => db.query.users.findFirst({ where: eq(users.email, email) }),
  findById: (id: string) => db.query.users.findFirst({ where: eq(users.id, id) }),
  create: (value: typeof users.$inferInsert) => db.insert(users).values(value).returning(),
  update: (id: string, value: Partial<typeof users.$inferInsert>) =>
    db
      .update(users)
      .set({ ...value, updatedAt: new Date() })
      .where(eq(users.id, id))
      .returning(),
  delete: (id: string) => db.delete(users).where(eq(users.id, id)).returning(),
  list: async (opts: { offset: number; limit: number; search?: string }) => {
    const where = opts.search ? ilike(users.email, `%${opts.search}%`) : undefined
    const [rows, totalRow] = await Promise.all([
      db
        .select({
          id: users.id,
          fullName: users.fullName,
          email: users.email,
          role: users.role,
          targetRole: users.targetRole,
          experienceLevel: users.experienceLevel,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(where)
        .orderBy(desc(users.createdAt))
        .limit(opts.limit)
        .offset(opts.offset),
      db.select({ value: count() }).from(users).where(where),
    ])
    return { rows, total: Number(totalRow[0]?.value ?? 0) }
  },
}

export const sessionRepository = {
  create: (value: typeof sessions.$inferInsert) => db.insert(sessions).values(value).returning(),
  findAllByUser: (userId: string) =>
    db.select().from(sessions).where(eq(sessions.userId, userId)).orderBy(desc(sessions.createdAt)),
  deleteByTokenHash: (tokenHash: string) =>
    db.delete(sessions).where(eq(sessions.refreshToken, tokenHash)).returning(),
  deleteByUser: (userId: string) => db.delete(sessions).where(eq(sessions.userId, userId)),
  findValid: async (userId: string) =>
    db
      .select()
      .from(sessions)
      .where(and(eq(sessions.userId, userId), sql`${sessions.expiresAt} > NOW()`)),
}

export const otpRepository = {
  create: (value: typeof otps.$inferInsert) => db.insert(otps).values(value).returning(),
  findValid: async (userId: string, code: string, type: string) =>
    db
      .select()
      .from(otps)
      .where(and(eq(otps.userId, userId), eq(otps.code, code), eq(otps.type, type), sql`${otps.expiresAt} > NOW()`))
      .then(res => res[0]),
  deleteByUserAndType: (userId: string, type: string) =>
    db.delete(otps).where(and(eq(otps.userId, userId), eq(otps.type, type))),
}

export const resumeRepository = {
  create: (value: typeof resumes.$inferInsert) => db.insert(resumes).values(value).returning(),
  findById: (id: string, userId: string) =>
    db.query.resumes.findFirst({ where: and(eq(resumes.id, id), eq(resumes.userId, userId)) }),
  deactivateOthers: (userId: string) =>
    db.update(resumes).set({ isActive: false }).where(eq(resumes.userId, userId)),
  listByUser: (userId: string) =>
    db.select().from(resumes).where(eq(resumes.userId, userId)).orderBy(desc(resumes.uploadedAt)),
}

export const jdRepository = {
  create: (value: typeof jobDescriptions.$inferInsert) =>
    db.insert(jobDescriptions).values(value).returning(),
  findById: (id: string, userId: string) =>
    db.query.jobDescriptions.findFirst({
      where: and(eq(jobDescriptions.id, id), eq(jobDescriptions.userId, userId)),
    }),
  deactivateOthers: (userId: string) =>
    db.update(jobDescriptions).set({ isActive: false }).where(eq(jobDescriptions.userId, userId)),
}

export const interviewRepository = {
  create: (value: typeof interviews.$inferInsert) => db.insert(interviews).values(value).returning(),
  findById: (id: string, userId?: string) =>
    db.query.interviews.findFirst({
      where: userId ? and(eq(interviews.id, id), eq(interviews.userId, userId)) : eq(interviews.id, id),
      with: {
        resume: true,
        jobDescription: true,
        sessions: { orderBy: [desc(interviewSessions.startedAt)], limit: 1 },
      },
    }),
  update: (id: string, value: Partial<typeof interviews.$inferInsert>) =>
    db
      .update(interviews)
      .set({ ...value, updatedAt: new Date() })
      .where(eq(interviews.id, id))
      .returning(),
  delete: (id: string) => db.delete(interviews).where(eq(interviews.id, id)),
  list: async (opts: {
    userId: string
    offset: number
    limit: number
    status?: string
    sortBy?: 'scheduledAt' | 'createdAt' | 'status'
    order?: 'asc' | 'desc'
  }) => {
    const where = opts.status
      ? and(eq(interviews.userId, opts.userId), eq(interviews.status, opts.status))
      : eq(interviews.userId, opts.userId)

    const sortColumn =
      opts.sortBy === 'scheduledAt'
        ? interviews.scheduledAt
        : opts.sortBy === 'status'
          ? interviews.status
          : interviews.createdAt

    const orderBy = opts.order === 'asc' ? sortColumn : desc(sortColumn)

    const [rows, totalRow] = await Promise.all([
      db
        .select({
          id: interviews.id,
          company: interviews.company,
          role: interviews.role,
          interviewType: interviews.interviewType,
          status: interviews.status,
          scheduledAt: interviews.scheduledAt,
          createdAt: interviews.createdAt,
          totalQuestions: interviews.totalQuestions,
          overallScore: interviewSessions.overallScore,
          reportId: reports.id,
        })
        .from(interviews)
        .leftJoin(
          interviewSessions,
          and(
            eq(interviewSessions.interviewId, interviews.id),
            or(eq(interviewSessions.status, 'completed'), eq(interviewSessions.status, 'aborted')),
          ),
        )
        .leftJoin(reports, eq(reports.sessionId, interviewSessions.id))
        .where(where)
        .orderBy(orderBy)
        .limit(opts.limit)
        .offset(opts.offset),
      db.select({ value: count() }).from(interviews).where(where),
    ])

    return { rows, total: Number(totalRow[0]?.value ?? 0) }
  },
}

export const interviewSessionRepository = {
  create: (value: typeof interviewSessions.$inferInsert) =>
    db.insert(interviewSessions).values(value).returning(),
  findById: (id: string, userId?: string) =>
    db.query.interviewSessions.findFirst({
      where: userId
        ? and(eq(interviewSessions.id, id), eq(interviewSessions.userId, userId))
        : eq(interviewSessions.id, id),
      with: { interview: true, questions: true },
    }),
  findActiveByInterview: (interviewId: string) =>
    db.query.interviewSessions.findFirst({
      where: and(
        eq(interviewSessions.interviewId, interviewId),
        eq(interviewSessions.status, 'active'),
      ),
    }),
  update: (id: string, value: Partial<typeof interviewSessions.$inferInsert>) =>
    db.update(interviewSessions).set(value).where(eq(interviewSessions.id, id)).returning(),
}

export const questionRepository = {
  create: (value: typeof interviewQuestions.$inferInsert) =>
    db.insert(interviewQuestions).values(value).returning(),
  findById: (id: string) =>
    db.query.interviewQuestions.findFirst({ where: eq(interviewQuestions.id, id) }),
  listBySession: (sessionId: string) =>
    db
      .select()
      .from(interviewQuestions)
      .where(eq(interviewQuestions.sessionId, sessionId))
      .orderBy(interviewQuestions.questionNumber),
}

export const responseRepository = {
  create: (value: typeof candidateResponses.$inferInsert) =>
    db.insert(candidateResponses).values(value).returning(),
  findByQuestionAndSession: (questionId: string, sessionId: string) =>
    db.query.candidateResponses.findFirst({
      where: and(
        eq(candidateResponses.questionId, questionId),
        eq(candidateResponses.sessionId, sessionId)
      )
    }),
  update: (id: string, value: Partial<typeof candidateResponses.$inferInsert>) =>
    db.update(candidateResponses).set(value).where(eq(candidateResponses.id, id)).returning(),
  delete: (id: string) =>
    db.delete(candidateResponses).where(eq(candidateResponses.id, id)),
  listBySession: (sessionId: string) =>
    db
      .select()
      .from(candidateResponses)
      .where(eq(candidateResponses.sessionId, sessionId))
      .orderBy(candidateResponses.submittedAt),
}

export const evaluationRepository = {
  create: (value: typeof aiEvaluations.$inferInsert) =>
    db.insert(aiEvaluations).values(value).returning(),
  listBySession: (sessionId: string) =>
    db
      .select({
        evaluation: aiEvaluations,
        question: interviewQuestions,
        response: candidateResponses,
      })
      .from(aiEvaluations)
      .innerJoin(candidateResponses, eq(aiEvaluations.responseId, candidateResponses.id))
      .innerJoin(interviewQuestions, eq(aiEvaluations.questionId, interviewQuestions.id))
      .where(eq(candidateResponses.sessionId, sessionId))
      .orderBy(interviewQuestions.questionNumber),
}

export const reportRepository = {
  create: (value: typeof reports.$inferInsert) => db.insert(reports).values(value).returning(),
  list: async (userId: string, offset: number, limit: number) => {
    const [rows, totalRow] = await Promise.all([
      db
        .select({
          id: reports.id,
          sessionId: reports.sessionId,
          userId: reports.userId,
          overallScore: reports.overallScore,
          detailedSummary: reports.detailedSummary,
          interviewType: reports.interviewType,
          generatedAt: reports.generatedAt,
          role: interviews.role,
          totalQuestions: interviews.totalQuestions,
          sessionOverallScore: interviewSessions.overallScore,
        })
        .from(reports)
        .leftJoin(interviewSessions, eq(reports.sessionId, interviewSessions.id))
        .leftJoin(interviews, eq(interviewSessions.interviewId, interviews.id))
        .where(eq(reports.userId, userId))
        .orderBy(desc(reports.generatedAt))
        .limit(limit)
        .offset(offset),
      db.select({ value: count() }).from(reports).where(eq(reports.userId, userId)),
    ])
    return { rows, total: Number(totalRow[0]?.value ?? 0) }
  },
  findById: (id: string, userId: string) =>
    db.query.reports.findFirst({
      where: and(eq(reports.id, id), eq(reports.userId, userId)),
      with: { recommendations: { with: { resource: true } } },
    }),
  markViewed: (id: string) =>
    db.update(reports).set({ isViewed: true }).where(eq(reports.id, id)).returning(),
}

export const notificationRepository = {
  create: (value: typeof notifications.$inferInsert) =>
    db.insert(notifications).values(value).returning(),
  list: async (opts: {
    userId: string
    offset: number
    limit: number
    isRead?: boolean
  }) => {
    const where =
      opts.isRead === undefined
        ? eq(notifications.userId, opts.userId)
        : and(eq(notifications.userId, opts.userId), eq(notifications.isRead, opts.isRead))

    const [rows, totalRow, unreadRow] = await Promise.all([
      db
        .select()
        .from(notifications)
        .where(where)
        .orderBy(desc(notifications.createdAt))
        .limit(opts.limit)
        .offset(opts.offset),
      db.select({ value: count() }).from(notifications).where(where),
      db
        .select({ value: count() })
        .from(notifications)
        .where(and(eq(notifications.userId, opts.userId), eq(notifications.isRead, false))),
    ])

    return {
      rows,
      total: Number(totalRow[0]?.value ?? 0),
      unreadCount: Number(unreadRow[0]?.value ?? 0),
    }
  },
  markRead: (id: string, userId: string) =>
    db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.id, id), eq(notifications.userId, userId)))
      .returning(),
  markAllRead: (userId: string) =>
    db
      .update(notifications)
      .set({ isRead: true })
      .where(and(eq(notifications.userId, userId), eq(notifications.isRead, false)))
      .returning(),
}

export const analyticsRepository = {
  findByUser: (userId: string) =>
    db.query.interviewAnalytics.findFirst({ where: eq(interviewAnalytics.userId, userId) }),
  upsert: async (userId: string, value: Omit<typeof interviewAnalytics.$inferInsert, 'userId'>) => {
    const existing = await analyticsRepository.findByUser(userId)
    if (existing) {
      return db
        .update(interviewAnalytics)
        .set({ ...value, lastUpdated: new Date() })
        .where(eq(interviewAnalytics.userId, userId))
        .returning()
    }
    return db.insert(interviewAnalytics).values({ userId, ...value }).returning()
  },
  scoreHistory: (userId: string) =>
    db
      .select({
        date: sql<string>`to_char(COALESCE(${interviewSessions.endedAt}, ${interviewSessions.startedAt}), 'YYYY-MM-DD')`,
        score: interviewSessions.overallScore,
      })
      .from(interviewSessions)
      .where(and(eq(interviewSessions.userId, userId), or(eq(interviewSessions.status, 'completed'), eq(interviewSessions.status, 'aborted'))))
      .orderBy(sql`COALESCE(${interviewSessions.endedAt}, ${interviewSessions.startedAt})`)
      .limit(30),
  topicPerformance: (userId: string) =>
    db
      .select({
        topic: interviewQuestions.topic,
        averageScore: sql<string>`avg(${aiEvaluations.score})`,
      })
      .from(aiEvaluations)
      .innerJoin(interviewQuestions, eq(aiEvaluations.questionId, interviewQuestions.id))
      .innerJoin(interviewSessions, eq(interviewQuestions.sessionId, interviewSessions.id))
      .where(eq(interviewSessions.userId, userId))
      .groupBy(interviewQuestions.topic)
      .orderBy(sql`avg(${aiEvaluations.score}) desc`),
}

export const resourceRepository = {
  create: (value: typeof learningResources.$inferInsert) =>
    db.insert(learningResources).values(value).returning(),
  findByUrl: (url: string) =>
    db.query.learningResources.findFirst({ where: eq(learningResources.url, url) }),
  linkRecommendation: (value: typeof recommendedResources.$inferInsert) =>
    db.insert(recommendedResources).values(value).returning(),
}

export const auditRepository = {
  create: (value: typeof auditLogs.$inferInsert) => db.insert(auditLogs).values(value),
}

export const aiLogRepository = {
  create: (value: typeof aiAgentLogs.$inferInsert) => db.insert(aiAgentLogs).values(value),
}

/** @deprecated Use named repositories instead */
export const fileRepository = {
  createResume: resumeRepository.create,
  resume: resumeRepository.findById,
  createJd: jdRepository.create,
  jd: jdRepository.findById,
}

export const audit = auditRepository.create
