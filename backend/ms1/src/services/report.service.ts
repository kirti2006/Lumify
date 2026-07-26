import {
  analyticsRepository,
  notificationRepository,
  reportRepository,
  evaluationRepository,
  interviewSessionRepository,
  interviewRepository,
} from '../repositories/repository.js'
import { AppError, parsePagination } from '../utils/http.js'
import { cacheService } from './cache.service.js'

export class ReportService {
  async list(userId: string, query: Record<string, unknown>) {
    const { page, pageSize, offset } = parsePagination(query)
    const cacheKey = `user:${userId}:reports:page${page}:size${pageSize}`
    const cached = await cacheService.get<any>(cacheKey)
    if (cached) return cached

    const { rows, total } = await reportRepository.list(userId, offset, pageSize)
    const result = {
      data: rows,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 1 },
    }
    await cacheService.set(cacheKey, result, 60 * 5) // 5 minutes
    return result
  }

  async getById(id: string, userId: string) {
    const report = await reportRepository.findById(id, userId)
    if (!report) throw new AppError(404, 'Report not found', 'NOT_FOUND')
    if (!report.isViewed) {
      await reportRepository.markViewed(id)
    }
    
    // Fetch evaluations for detailed feedback
    const evaluations = await evaluationRepository.listBySession(report.sessionId)
    const questions = evaluations.map(e => ({
      id: e.question.id,
      questionText: e.question.questionText,
      answerText: e.response?.transcript,
      score: Number(e.evaluation.score),
      feedback: e.evaluation.detailedFeedback || (e.evaluation.strengths && e.evaluation.strengths.length ? e.evaluation.strengths[0] : null) || 'No detailed feedback available'
    }))
    const session = await interviewSessionRepository.findById(report.sessionId)
    const interview = session ? await interviewRepository.findById(session.interviewId) : null
    const totalQuestions = interview ? interview.totalQuestions : evaluations.length || 5

    return { ...report, questions, metadata: report.metadata, totalQuestions, role: interview?.role }
  }
}

export class AnalyticsService {
  async dashboard(userId: string) {
    const cacheKey = `user:${userId}:analytics:dashboard`
    const cached = await cacheService.get<any>(cacheKey)
    if (cached) return cached

    const [analytics, scoreHistory, topicPerformance] = await Promise.all([
      analyticsRepository.findByUser(userId),
      analyticsRepository.scoreHistory(userId),
      analyticsRepository.topicPerformance(userId),
    ])

    const result = {
      totalInterviews: analytics?.totalInterviews ?? 0,
      completedInterviews: analytics?.completedInterviews ?? 0,
      averageScore: Number(analytics?.averageScore ?? 0),
      bestScore: Number(analytics?.bestScore ?? 0),
      totalPracticeTimeSeconds: analytics?.totalPracticeTimeS ?? 0,
      strongestTopic: analytics?.strongestTopic ?? null,
      weakestTopic: analytics?.weakestTopic ?? null,
      scoreHistory: scoreHistory.map((row) => ({
        date: row.date,
        score: Number(row.score ?? 0),
      })),
      topicPerformance: topicPerformance
        .filter((row) => row.topic)
        .map((row) => ({
          topic: row.topic as string,
          averageScore: Number(row.averageScore ?? 0),
        })),
    }

    await cacheService.set(cacheKey, result, 3600)
    return result
  }

  async trends(userId: string) {
    const scoreHistory = await analyticsRepository.scoreHistory(userId)
    return { scoreHistory }
  }

  async performance(userId: string) {
    const topicPerformance = await analyticsRepository.topicPerformance(userId)
    return {
      topicPerformance: topicPerformance
        .filter((row) => row.topic)
        .map((row) => ({
          topic: row.topic as string,
          averageScore: Number(row.averageScore ?? 0),
        })),
    }
  }

  async skillGrowth(userId: string) {
    const [history, topics] = await Promise.all([
      analyticsRepository.scoreHistory(userId),
      analyticsRepository.topicPerformance(userId),
    ])
    return {
      scoreHistory: history.map((row) => ({ date: row.date, score: Number(row.score ?? 0) })),
      topicPerformance: topics
        .filter((row) => row.topic)
        .map((row) => ({
          topic: row.topic as string,
          averageScore: Number(row.averageScore ?? 0),
        })),
    }
  }
}

export class NotificationService {
  async list(userId: string, query: Record<string, unknown>) {
    const { page, pageSize, offset } = parsePagination(query)
    const isRead =
      query.isRead === true || query.isRead === false
        ? (query.isRead as boolean)
        : query.isRead === 'true'
          ? true
          : query.isRead === 'false'
            ? false
            : undefined

    const { rows, total, unreadCount } = await notificationRepository.list({
      userId,
      offset,
      limit: pageSize,
      isRead,
    })

    return {
      data: rows,
      meta: {
        unreadCount,
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize) || 1,
      },
    }
  }

  async markRead(id: string, userId: string) {
    const [notification] = await notificationRepository.markRead(id, userId)
    if (!notification) throw new AppError(404, 'Notification not found', 'NOT_FOUND')
    return { id: notification.id, isRead: notification.isRead }
  }

  async markAllRead(userId: string) {
    const rows = await notificationRepository.markAllRead(userId)
    return { updated: rows.length }
  }
}

export const reportService = new ReportService()
export const analyticsService = new AnalyticsService()
export const notificationService = new NotificationService()
