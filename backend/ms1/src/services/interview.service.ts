import crypto from 'node:crypto'
import type { CreateInterviewDto, UpdateInterviewDto } from '../dto/index.js'
import {
  analyticsRepository,
  auditRepository,
  evaluationRepository,
  interviewRepository,
  interviewSessionRepository,
  jdRepository,
  notificationRepository,
  questionRepository,
  reportRepository,
  resourceRepository,
  responseRepository,
  resumeRepository,
} from '../repositories/repository.js'
import { createSignedUrl, uploadFile } from '../storage/cloudinary.js'
import type { AiQuestionPayload } from '../types/index.js'
import { AppError, parsePagination } from '../utils/http.js'
import { aiClient } from './ai-client.js'
import { cacheService } from './cache.service.js'

function normalizeQuestion(payload: any): AiQuestionPayload {
  // Unbox if payload is wrapped in { question: { ... } }
  let data = payload
  if (payload && typeof payload === 'object' && 'question' in payload && typeof payload.question === 'object') {
    data = payload.question
  }
  
  if (data && typeof data === 'object') {
    return {
      questionText: data.questionText || data.question || '',
      questionType: data.question_type || data.questionType,
      topic: data.topic,
      difficulty: data.difficulty_level || data.difficulty,
    }
  }
  return data as AiQuestionPayload
}

export class InterviewService {
  async create(userId: string, input: CreateInterviewDto) {
    if (input.resumeId) {
      const resume = await resumeRepository.findById(input.resumeId, userId)
      if (!resume) throw new AppError(404, 'Resume not found', 'NOT_FOUND')
    }
    if (input.jdId) {
      const jd = await jdRepository.findById(input.jdId, userId)
      if (!jd) throw new AppError(404, 'Job description not found', 'NOT_FOUND')
    }

    const [interview] = await interviewRepository.create({
      userId,
      resumeId: input.resumeId,
      jdId: input.jdId,
      company: input.company,
      role: input.role,
      interviewType: input.interviewType,
      experienceLevel: input.experienceLevel,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : null,
      totalQuestions: input.totalQuestions,
      status: 'scheduled',
    })

    await auditRepository.create({
      userId,
      action: 'INTERVIEW_CREATED',
      resourceType: 'interview',
      resourceId: interview.id,
    })

    await notificationRepository.create({
      userId,
      type: 'interview_reminder',
      title: 'Interview Scheduled',
      message: `Your ${interview.interviewType} interview${interview.company ? ` for ${interview.company}` : ''} has been scheduled.`,
      relatedId: interview.id,
      relatedType: 'interview',
    })

    return {
      id: interview.id,
      company: interview.company,
      role: interview.role,
      interviewType: interview.interviewType,
      status: interview.status,
      scheduledAt: interview.scheduledAt,
      createdAt: interview.createdAt,
    }
  }

  async list(userId: string, query: Record<string, unknown>) {
    const { page, pageSize, offset } = parsePagination(query)
    const { rows, total } = await interviewRepository.list({
      userId,
      offset,
      limit: pageSize,
      status: typeof query.status === 'string' ? query.status : undefined,
      sortBy:
        query.sortBy === 'scheduledAt' || query.sortBy === 'createdAt' || query.sortBy === 'status'
          ? query.sortBy
          : 'createdAt',
      order: query.order === 'asc' ? 'asc' : 'desc',
    })

    return {
      data: rows,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 1 },
    }
  }

  async getById(id: string, userId: string) {
    const interview = await interviewRepository.findById(id, userId)
    if (!interview) throw new AppError(404, 'Interview not found', 'NOT_FOUND')

    const session = interview.sessions?.[0]
    return {
      id: interview.id,
      company: interview.company,
      role: interview.role,
      interviewType: interview.interviewType,
      experienceLevel: interview.experienceLevel,
      status: interview.status,
      scheduledAt: interview.scheduledAt,
      totalQuestions: interview.totalQuestions,
      createdAt: interview.createdAt,
      resume: interview.resume
        ? { id: interview.resume.id, fileName: interview.resume.fileName }
        : null,
      jobDescription: interview.jobDescription
        ? { id: interview.jobDescription.id, title: interview.jobDescription.title }
        : null,
      session: session
        ? {
            id: session.id,
            startedAt: session.startedAt,
            durationSeconds: session.durationSeconds,
            overallScore: session.overallScore,
            status: session.status,
          }
        : null,
    }
  }

  async update(id: string, userId: string, input: UpdateInterviewDto) {
    const interview = await interviewRepository.findById(id, userId)
    if (!interview) throw new AppError(404, 'Interview not found', 'NOT_FOUND')

    if (input.status === 'cancelled' && interview.status === 'in_progress') {
      throw new AppError(422, 'Cannot cancel an in-progress interview', 'INVALID_STATE')
    }

    const [updated] = await interviewRepository.update(id, {
      status: input.status,
      scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
      company: input.company,
      role: input.role,
      totalQuestions: input.totalQuestions,
    })

    if (input.status === 'cancelled') {
      await auditRepository.create({
        userId,
        action: 'INTERVIEW_CANCELLED',
        resourceType: 'interview',
        resourceId: id,
      })
    }

    return updated
  }

  async remove(id: string, userId: string) {
    const interview = await interviewRepository.findById(id, userId)
    if (!interview) throw new AppError(404, 'Interview not found', 'NOT_FOUND')
    if (interview.status !== 'scheduled') {
      throw new AppError(422, 'Only scheduled interviews can be deleted', 'INVALID_STATE')
    }
    await interviewRepository.delete(id)
  }

  async start(id: string, userId: string) {
    const interview = await interviewRepository.findById(id, userId)
    if (!interview) throw new AppError(404, 'Interview not found', 'NOT_FOUND')
    if (interview.status === 'completed') {
      throw new AppError(422, 'Interview already completed', 'INVALID_STATE')
    }
    if (interview.status === 'cancelled') {
      throw new AppError(422, 'Interview was cancelled', 'INVALID_STATE')
    }

    if (interview.status === 'in_progress') {
      const existingActive = await interviewSessionRepository.findActiveByInterview(id)
      if (existingActive) {
        const questions = await questionRepository.listBySession(existingActive.id)
        if (questions.length > 0) {
          return {
            sessionId: existingActive.id,
            totalQuestions: interview.totalQuestions,
            interview: {
              id: interview.id,
              role: interview.role,
              interviewType: interview.interviewType,
              experienceLevel: interview.experienceLevel,
              totalQuestions: interview.totalQuestions,
            },
            questions,
            firstQuestion: questions[0]
          }
        }
        await interviewSessionRepository.update(existingActive.id, { status: 'aborted' })
      }
    } else {
      const existingActive = await interviewSessionRepository.findActiveByInterview(id)
      if (existingActive) {
        await interviewSessionRepository.update(existingActive.id, { status: 'aborted' })
      }
    }

    const resumeText =
      interview.resume?.extractedText ??
      (interview.resume ? `Resume: ${interview.resume.fileName}` : 'No resume provided')
    const jdText =
      `Role: ${interview.role}\nCompany: ${interview.company || 'Unknown'}\n\n` +
      (interview.jobDescription?.rawText ??
      (interview.jobDescription
        ? `JD: ${interview.jobDescription.title}`
        : 'No job description provided'))

    const [session] = await interviewSessionRepository.create({
      interviewId: interview.id,
      userId,
      status: 'active',
    })

    const aiResult = await aiClient.generateQuestions({
      sessionId: session.id,
      userId,
      interviewId: interview.id,
      resumeText,
      jdText,
      questionType: interview.interviewType,
      difficulty: interview.experienceLevel === 'senior' ? 'hard' : interview.experienceLevel === 'mid' ? 'medium' : 'easy',
      count: interview.totalQuestions,
      role: interview.role || 'Target role',
      company: interview.company,
      experienceLevel: interview.experienceLevel,
    })

    const dbQuestions = []
    for (let i = 0; i < aiResult.questions.length; i++) {
      const q = normalizeQuestion(aiResult.questions[i])
      const [created] = await questionRepository.create({
        sessionId: session.id,
        questionNumber: i + 1,
        questionText: q.questionText,
        questionType: q.questionType,
        topic: q.topic,
        difficulty: q.difficulty ?? 'medium',
      })
      dbQuestions.push(created)
    }

    const first = dbQuestions[0]

    await interviewRepository.update(interview.id, { status: 'in_progress' })

    await interviewSessionRepository.update(session.id, {
      langgraphThreadId: aiResult.session_id,
      questionsAsked: 1,
    })

    await auditRepository.create({
      userId,
      action: 'INTERVIEW_START',
      resourceType: 'interview',
      resourceId: interview.id,
      metadata: { sessionId: session.id },
    })

    return {
      sessionId: session.id,
      threadId: aiResult.session_id,
      totalQuestions: interview.totalQuestions,
      interview: {
        id: interview.id,
        role: interview.role,
        interviewType: interview.interviewType,
        experienceLevel: interview.experienceLevel,
        totalQuestions: interview.totalQuestions,
      },
      firstQuestion: {
        id: first.id,
        questionNumber: first.questionNumber,
        questionText: first.questionText,
        questionType: first.questionType,
        topic: first.topic,
        difficulty: first.difficulty,
      },
      questions: dbQuestions.map(q => ({
        id: q.id,
        questionNumber: q.questionNumber,
        questionText: q.questionText,
        questionType: q.questionType,
        topic: q.topic,
        difficulty: q.difficulty,
      })),
    }
  }

  async submitAnswer(
    sessionId: string,
    userId: string,
    input: { questionId: string; transcript: string; responseDurationS?: number }
  ) {
    const session = await interviewSessionRepository.findById(sessionId, userId)
    if (!session) throw new AppError(404, 'Session not found', 'NOT_FOUND')
    if (session.status !== 'active') throw new AppError(422, 'Session is not active', 'INVALID_STATE')

    const question = await questionRepository.findById(input.questionId)
    if (!question || question.sessionId !== session.id) {
      throw new AppError(404, 'Question not found', 'NOT_FOUND')
    }

    const existingResponse = await responseRepository.findByQuestionAndSession(question.id, session.id)
    if (existingResponse) {
      await responseRepository.delete(existingResponse.id)
    }

    const [response] = await responseRepository.create({
      questionId: question.id,
      sessionId: session.id,
      transcript: input.transcript,
      responseDurationS: input.responseDurationS,
    })

    // Evaluate answer asynchronously so user doesn't wait
    aiClient.evaluateAnswer({
      sessionId: session.id,
      userId,
      interviewId: session.interviewId,
      question: question.questionText,
      questionType: question.questionType ?? 'technical',
      difficulty: question.difficulty ?? 'medium',
      transcript: input.transcript,
    }).then(async (aiResult) => {
      const evaluation = aiResult.evaluation
          const scores = (evaluation as any).scores || (evaluation as any);
          
          await evaluationRepository.create({
            responseId: response.id,
            questionId: question.id,
            score: String(Math.round(((scores as any).overall_score ?? (scores as any).overall ?? (scores as any).score ?? 0))),
            technicalScore: (scores as any).technical_accuracy_score != null ? String(Math.round((scores as any).technical_accuracy_score)) : ((scores as any).technical_accuracy != null ? String(Math.round((scores as any).technical_accuracy)) : ((scores as any).technicalScore != null ? String(Math.round((scores as any).technicalScore)) : null)),
            communicationScore: (scores as any).communication_score != null ? String(Math.round((scores as any).communication_score)) : ((scores as any).communication != null ? String(Math.round((scores as any).communication)) : ((scores as any).communicationScore != null ? String(Math.round((scores as any).communicationScore)) : null)),
            confidenceScore: (scores as any).confidence_score != null ? String(Math.round((scores as any).confidence_score)) : ((scores as any).confidence != null ? String(Math.round((scores as any).confidence)) : ((scores as any).confidenceScore != null ? String(Math.round((scores as any).confidenceScore)) : null)),
            strengths: evaluation.strengths,
            weaknesses: evaluation.weaknesses,
            detailedFeedback: evaluation.detailedFeedback || (evaluation as any).detailed_feedback || (evaluation as any).improvement_suggestions?.join(' ') || "No detailed feedback provided.",
            modelReasoning: evaluation.modelReasoning,
            nextDifficulty: evaluation.nextDifficulty,
          })
    }).catch(err => console.error("Error evaluating answer:", err));

    let nextQuestion = null
    let currentQuestionsAsked = session.questionsAsked
    const interview = session.interview

    if (!existingResponse) {
       currentQuestionsAsked += 1;
       await interviewSessionRepository.update(session.id, { questionsAsked: currentQuestionsAsked })
    }

    if (interview && currentQuestionsAsked < interview.totalQuestions) {
      const currentQNumber = question.questionNumber
      const pastQs = await questionRepository.listBySession(session.id)
      const nextQ = pastQs.find(q => q.questionNumber === currentQNumber + 1) || pastQs.find(q => q.questionNumber === currentQuestionsAsked + 1)
      
      if (nextQ) {
        nextQuestion = {
          id: nextQ.id,
          questionNumber: nextQ.questionNumber,
          questionText: nextQ.questionText,
          difficulty: nextQ.difficulty,
          questionType: nextQ.questionType,
          topic: nextQ.topic,
        }
      }
    }

    return {
      responseId: response.id,
      transcript: input.transcript,
      nextQuestion,
    }
  }

  async finishSession(sessionId: string, userId: string) {
    const session = await interviewSessionRepository.findById(sessionId, userId)
    if (!session) throw new AppError(404, 'Session not found', 'NOT_FOUND')

    const responses = await responseRepository.listBySession(sessionId)
    const questions = await questionRepository.listBySession(sessionId)
    
    // Evaluate any response that doesn't have an evaluation yet
    const existingEvals = await evaluationRepository.listBySession(sessionId)
    const evaluatedResponseIds = new Set(existingEvals.map(e => e.evaluation.responseId))

    // Do evaluations sequentially to avoid overwhelming MS2 or DB connections
    for (const response of responses) {
      if (!evaluatedResponseIds.has(response.id)) {
        const question = questions.find(q => q.id === response.questionId)
        if (question && response.transcript) {
          const aiResult = await aiClient.evaluateAnswer({
            sessionId: session.id,
            userId,
            interviewId: session.interviewId,
            question: question.questionText,
            questionType: question.questionType ?? 'technical',
            difficulty: question.difficulty ?? 'medium',
            transcript: response.transcript,
          })

          const evaluation = aiResult.evaluation
          const scores = (evaluation as any).scores || (evaluation as any); // Fallback in case structure differs
          
          await evaluationRepository.create({
            responseId: response.id,
            questionId: question.id,
            score: String(Math.round(((scores as any).overall_score ?? (scores as any).overall ?? (scores as any).score ?? 0))),
            technicalScore: (scores as any).technical_accuracy_score != null ? String(Math.round((scores as any).technical_accuracy_score)) : ((scores as any).technical_accuracy != null ? String(Math.round((scores as any).technical_accuracy)) : ((scores as any).technicalScore != null ? String(Math.round((scores as any).technicalScore)) : null)),
            communicationScore: (scores as any).communication_score != null ? String(Math.round((scores as any).communication_score)) : ((scores as any).communication != null ? String(Math.round((scores as any).communication)) : ((scores as any).communicationScore != null ? String(Math.round((scores as any).communicationScore)) : null)),
            confidenceScore: (scores as any).confidence_score != null ? String(Math.round((scores as any).confidence_score)) : ((scores as any).confidence != null ? String(Math.round((scores as any).confidence)) : ((scores as any).confidenceScore != null ? String(Math.round((scores as any).confidenceScore)) : null)),
            strengths: evaluation.strengths,
            weaknesses: evaluation.weaknesses,
            detailedFeedback: evaluation.detailedFeedback || (evaluation as any).detailed_feedback || (evaluation as any).improvement_suggestions?.join(' ') || "No detailed feedback provided.",
            modelReasoning: evaluation.modelReasoning,
            nextDifficulty: evaluation.nextDifficulty,
          })
        }
      }
    }

    // Inject 0 scores for unanswered questions
    const questionsWithResponse = new Set(responses.map(r => r.questionId).filter(id => {
       const r = responses.find(resp => resp.questionId === id);
       return r && r.transcript && r.transcript.trim() !== '';
    }))
    
    for (const question of questions) {
      if (!questionsWithResponse.has(question.id)) {
        // Create an empty response and 0 evaluation
        const [emptyResponse] = await responseRepository.create({
          questionId: question.id,
          sessionId: session.id,
          transcript: "No answer provided.",
          responseDurationS: 0,
        })
        
        await evaluationRepository.create({
          responseId: emptyResponse.id,
          questionId: question.id,
          score: "0",
          technicalScore: "0",
          communicationScore: "0",
          confidenceScore: "0",
          strengths: [],
          weaknesses: ["Did not attempt the question"],
          detailedFeedback: "The candidate did not provide an answer to this question.",
          modelReasoning: "No input to evaluate.",
          nextDifficulty: "easy",
        })
      }
    }

    // Now call the existing finish method which generates the report
    return this.finish(session.interviewId, userId)
  }

  async terminateSession(sessionId: string, userId: string) {
    const session = await interviewSessionRepository.findById(sessionId, userId)
    if (!session) throw new AppError(404, 'Session not found', 'NOT_FOUND')
    if (session.status !== 'active') {
      return { sessionId: session.id, status: session.status, message: 'Session already closed' }
    }

    const endedAt = new Date()
    const durationSeconds = Math.max(
      0,
      Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000),
    )
    const evaluationRows = await evaluationRepository.listBySession(session.id)
    const scores = evaluationRows
      .map((row) => Number(row.evaluation.score))
      .filter((score) => !Number.isNaN(score))
    const overallScore = scores.length
      ? String(Math.round((scores.reduce((acc, score) => acc + score, 0) / (session.interview?.totalQuestions || scores.length)) * 20))
      : '0'

    await interviewSessionRepository.update(session.id, {
      status: 'aborted',
      endedAt,
      durationSeconds,
      overallScore,
    })

    await interviewRepository.update(session.interviewId, { status: 'terminated' })
    await this.refreshAnalytics(userId)

    await notificationRepository.create({
      userId,
      type: 'interview_terminated',
      title: 'Interview Terminated',
      message: 'Your interview was ended before completion. Any submitted answers were saved.',
      relatedId: session.interviewId,
      relatedType: 'interview',
    })

    await auditRepository.create({
      userId,
      action: 'INTERVIEW_TERMINATED',
      resourceType: 'interview',
      resourceId: session.interviewId,
      metadata: { sessionId: session.id, overallScore },
    })

    return {
      sessionId: session.id,
      interviewId: session.interviewId,
      status: 'terminated',
      overallScore,
    }
  }

  async finish(id: string, userId: string) {
    const interview = await interviewRepository.findById(id, userId)
    if (!interview) throw new AppError(404, 'Interview not found', 'NOT_FOUND')

    const session = await interviewSessionRepository.findActiveByInterview(id)
    if (!session) throw new AppError(404, 'Active session not found', 'NOT_FOUND')
    if (!session.langgraphThreadId) {
      throw new AppError(422, 'Interview thread not initialized', 'INVALID_STATE')
    }

    const evaluationRows = await evaluationRepository.listBySession(session.id)
    const reportPayload = await aiClient.generateFeedback({
      sessionId: session.id,
      userId,
      interviewId: interview.id,
      allQuestions: evaluationRows.map((row) => row.question.questionText),
      allAnswers: evaluationRows.map((row) => row.response.transcript ?? ''),
      allEvaluations: evaluationRows.map((row) => row.evaluation),
      skillScores: {},
    })

    const endedAt = new Date()
    const durationSeconds = Math.max(
      0,
      Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000),
    )

    // Calculate overall score from evaluations since backend doesn't provide it anymore
    const overallScore = Math.round(
      (evaluationRows.reduce((acc, curr) => acc + Number(curr.evaluation.score), 0) / (interview.totalQuestions || evaluationRows.length || 1)) * 20
    )

    let recommendedResources: any[] = []
    try {
      let skillGaps = (reportPayload.weaknesses || []).slice(0, 3)
      if (skillGaps.length === 0) {
        skillGaps = [interview.role || interview.interviewType || 'Interview Preparation']
      }
      
      recommendedResources = await aiClient.recommendResources({
        sessionId: session.id,
        userId,
        interviewId: interview.id,
        skillGaps
      })
    } catch (e) {
      console.error("Failed to recommend resources", e)
    }

    await interviewSessionRepository.update(session.id, {
      status: 'completed',
      endedAt,
      durationSeconds,
      overallScore: String(overallScore),
    })

    await interviewRepository.update(interview.id, { status: 'completed' })

    const [report] = await reportRepository.create({
      sessionId: session.id,
      userId,
      overallScore: String(overallScore),
      technicalScore:
        reportPayload.technicalScore != null ? String(reportPayload.technicalScore) : null,
      communicationScore:
        reportPayload.communicationScore != null ? String(reportPayload.communicationScore) : null,
      confidenceScore:
        reportPayload.confidenceScore != null ? String(reportPayload.confidenceScore) : null,
      strengths: reportPayload.strengths,
      weaknesses: reportPayload.weaknesses,
      suggestions: reportPayload.suggestions,
      detailedSummary: reportPayload.detailedSummary,
      metadata: { learning_resources: recommendedResources },
      interviewType: interview.interviewType,
    })

    await this.refreshAnalytics(userId)

    await notificationRepository.create({
      userId,
      type: 'report_ready',
      title: 'Your Interview Report is Ready',
      message: `View your detailed feedback${interview.company ? ` for the ${interview.company}` : ''} interview.`,
      relatedId: report.id,
      relatedType: 'report',
    })

    await auditRepository.create({
      userId,
      action: 'INTERVIEW_FINISH',
      resourceType: 'interview',
      resourceId: interview.id,
      metadata: { reportId: report.id, overallScore: reportPayload.overallScore },
    })

    return {
      reportId: report.id,
      message: 'Interview completed. Report is being generated.',
      overallScore: reportPayload.overallScore,
    }
  }

  private async refreshAnalytics(userId: string) {
    const history = await analyticsRepository.scoreHistory(userId)
    const topics = await analyticsRepository.topicPerformance(userId)
    const scores = history
      .map((h) => Number(h.score))
      .filter((n) => !Number.isNaN(n))

    const averageScore = scores.length
      ? scores.reduce((a, b) => a + b, 0) / scores.length
      : 0
    const bestScore = scores.length ? Math.max(...scores) : 0

    await analyticsRepository.upsert(userId, {
      totalInterviews: history.length,
      completedInterviews: history.length,
      averageScore: averageScore.toFixed(2),
      bestScore: bestScore.toFixed(2),
      totalPracticeTimeS: 0,
      strongestTopic: topics[0]?.topic ?? null,
      weakestTopic: topics.length ? topics[topics.length - 1]?.topic ?? null : null,
    })

    // Invalidate cached dashboard and reports to fetch instantly next time
    await cacheService.del(`user:${userId}:analytics:dashboard`)
    await cacheService.invalidatePattern(`user:${userId}:reports:*`)
  }
}

export const interviewService = new InterviewService()
