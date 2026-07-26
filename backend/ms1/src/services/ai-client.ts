import axios, { type AxiosInstance } from 'axios'
import { env } from '../config/env.js'
import { logAiCall, logger } from '../config/logger.js'
import { aiLogRepository } from '../repositories/repository.js'
import type {
  AiEvaluationPayload,
  AiQuestionPayload,
  AiRecommendationItem,
  AiReportPayload,
} from '../types/index.js'
import { AppError } from '../utils/http.js'

interface AiEnvelope<T> {
  success: boolean
  data: T
  message?: string
}

interface CircuitState {
  failures: number
  openUntil: number
}

const circuit: CircuitState = { failures: 0, openUntil: 0 }
const FAILURE_THRESHOLD = 5
const OPEN_MS = 30_000
const MAX_RETRIES = 1

export class AiClient {
  private readonly http: AxiosInstance

  constructor() {
    this.http = axios.create({
      baseURL: env.AI_SERVICE_URL,
      timeout: 120_000,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-API-Key': env.AI_SERVICE_API_KEY,
      },
    })
  }

  async analyzeResume(payload: { resumeText: string; userId: string }) {
    return this.post<{
      skills: string[]
      experienceYears: number
      currentRole: string
      education: string
      highlights: string[]
    }>('/ai/resume/analyze', payload, payload.userId)
  }

  async analyzeJd(payload: { jdText: string; userId: string }) {
    return this.post<{
      requiredSkills: string[]
      preferredSkills: string[]
      experienceRequired: string
      roleType: string
      seniorityLevel: string
      responsibilities: string[]
    }>('/ai/jd/analyze', payload, payload.userId)
  }

  async generateQuestion(payload: {
    sessionId: string
    userId: string
    interviewId: string
    resumeText: string
    jdText: string
    questionType?: string
    difficulty?: string
    previousQuestions?: string[]
    conversationHistory?: any[]
  }) {
    // Wrap text inputs into the dict structures MS2 expects
    const apiPayload = {
      session_id: payload.sessionId,
      user_id: payload.userId,
      interview_id: payload.interviewId,
      resume_summary: { raw_text: payload.resumeText || 'None' },
      jd_summary: { raw_text: payload.jdText || 'None' },
      question_type: payload.questionType || 'technical',
      difficulty: payload.difficulty || 'medium',
      previous_questions: payload.previousQuestions || [],
      conversation_history: payload.conversationHistory || []
    }
    
    return this.post<{ session_id: string; question: AiQuestionPayload }>(
      '/api/v1/ai/generate-question',
      apiPayload,
      payload.userId,
      payload.sessionId,
    )
  }

  async generateQuestions(payload: {
    sessionId: string
    userId: string
    interviewId: string
    resumeText: string
    jdText: string
    questionType?: string
    difficulty?: string
    count?: number
    role?: string
    company?: string | null
    experienceLevel?: string
  }) {
    const apiPayload = {
      session_id: payload.sessionId,
      user_id: payload.userId,
      interview_id: payload.interviewId,
      resume_summary: { raw_text: payload.resumeText || 'None' },
      jd_summary: {
        raw_text: payload.jdText || 'None',
        role: payload.role || 'Target role',
        company: payload.company || 'Target company',
        interview_focus: payload.questionType || 'technical',
        experience_level: payload.experienceLevel || payload.difficulty || 'medium',
      },
      question_type: payload.questionType || 'technical',
      difficulty: payload.difficulty || 'medium',
      count: payload.count,
      previous_questions: [],
      conversation_history: []
    }
    
    return this.post<{ session_id: string; questions: AiQuestionPayload[] }>(
      '/api/v1/ai/generate-questions',
      apiPayload,
      payload.userId,
      payload.sessionId,
    )
  }

  async evaluateAnswer(payload: {
    sessionId: string
    userId: string
    interviewId: string
    question: string
    questionType: string
    difficulty: string
    transcript: string
    conversationHistory?: any[]
  }) {
    const apiPayload = {
      session_id: payload.sessionId,
      user_id: payload.userId,
      interview_id: payload.interviewId,
      question: payload.question,
      question_type: payload.questionType,
      difficulty: payload.difficulty,
      answer: payload.transcript,
      conversation_history: payload.conversationHistory || []
    }
    
    const response = await this.post<{ session_id: string; evaluation: AiEvaluationPayload; token_usage: any }>(
      '/api/v1/ai/evaluate-answer',
      apiPayload,
      payload.userId,
      payload.sessionId,
    )
    return { ...response, transcript: payload.transcript }
  }

  async generateFeedback(payload: {
    sessionId: string
    userId: string
    interviewId: string
    allQuestions: string[]
    allAnswers: string[]
    allEvaluations: any[]
    skillScores: Record<string, number>
    role?: string
  }) {
    const apiPayload = {
      session_id: payload.sessionId,
      user_id: payload.userId,
      interview_id: payload.interviewId,
      all_questions: payload.allQuestions,
      all_answers: payload.allAnswers,
      all_evaluations: payload.allEvaluations,
      skill_scores: payload.skillScores,
      role: payload.role,
    }
    const response = await this.post<{ session_id: string; feedback: any; token_usage: any }>(
      '/api/v1/ai/generate-feedback',
      apiPayload,
      payload.userId,
      payload.sessionId,
    )
    
    return {
      overallScore: response.feedback.overall_score || 0,
      technicalScore: null,
      communicationScore: null,
      confidenceScore: null,
      strengths: response.feedback.key_strengths || response.feedback.strong_areas || [],
      weaknesses: response.feedback.areas_for_improvement || [],
      suggestions: response.feedback.next_steps || [],
      detailedSummary: response.feedback.performance_summary || ''
    }
  }

  async recommendResources(payload: {
    sessionId: string
    userId: string
    interviewId: string
    skillGaps: string[]
  }) {
    const apiPayload = {
      session_id: payload.sessionId,
      user_id: payload.userId,
      interview_id: payload.interviewId,
      skill_gaps: payload.skillGaps,
    }
    
    const response = await this.post<{ session_id: string; resources: any[] }>(
      '/api/v1/ai/recommend-resources',
      apiPayload,
      payload.userId,
      payload.sessionId,
    )

    return response.resources || []
  }

  async healthCheck(): Promise<boolean> {
    try {
      await this.http.get('/health', { timeout: 5000 })
      return true
    } catch {
      try {
        await this.http.get('/', { timeout: 5000 })
        return true
      } catch {
        return false
      }
    }
  }

  private async post<T>(
    path: string,
    payload: unknown,
    userId: string,
    sessionId?: string,
  ): Promise<T> {
    if (Date.now() < circuit.openUntil) {
      throw new AppError(503, 'AI service temporarily unavailable', 'AI_SERVICE_UNAVAILABLE')
    }

    let lastError: unknown
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      const started = Date.now()
      try {
        const { data, status } = await this.http.post<AiEnvelope<T> | T>(path, payload)
        const durationMs = Date.now() - started
        circuit.failures = 0
        logAiCall(path, durationMs, status)

        const body = data as AiEnvelope<T>
        const result = body && typeof body === 'object' && 'data' in body ? body.data : (data as T)

        await aiLogRepository.create({
          userId,
          sessionId,
          endpointCalled: path,
          requestPayload: payload as Record<string, unknown>,
          responsePayload: data as Record<string, unknown>,
          statusCode: status,
          durationMs,
        })

        return result
      } catch (error) {
        lastError = error
        const durationMs = Date.now() - started
        const statusCode = axios.isAxiosError(error) ? error.response?.status : undefined
        const message = axios.isAxiosError(error)
          ? error.message
          : error instanceof Error
            ? error.message
            : 'Unknown AI error'

        logAiCall(path, durationMs, statusCode, message)
        await aiLogRepository.create({
          userId,
          sessionId,
          endpointCalled: path,
          requestPayload: payload as Record<string, unknown>,
          statusCode,
          durationMs,
          errorMessage: message,
        })

        if (attempt < MAX_RETRIES - 1) {
          await new Promise((resolve) => setTimeout(resolve, 250 * 2 ** attempt))
          continue
        }
      }
    }

    circuit.failures += 1
    if (circuit.failures >= FAILURE_THRESHOLD) {
      circuit.openUntil = Date.now() + OPEN_MS
      logger.warn('ai_circuit_opened', { openUntil: circuit.openUntil })
    }

    throw new AppError(502, 'AI service request failed', 'AI_SERVICE_ERROR', {
      reason: lastError instanceof Error ? lastError.message : 'unknown',
    })
  }
}

export const aiClient = new AiClient()
