export type UserRole = 'candidate' | 'admin'

export type ExperienceLevel = 'fresher' | 'junior' | 'mid' | 'senior'

export type InterviewType = 'technical' | 'behavioral' | 'hr' | 'mixed'

export type InterviewStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled' | 'terminated'

export type SessionStatus = 'active' | 'completed' | 'aborted'

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface AuthContext {
  userId: string
  role: UserRole
}

export interface ApiSuccess<T> {
  success: true
  message: string
  data: T
  meta?: Record<string, unknown>
}

export interface ApiFailure {
  success: false
  message: string
  error: {
    code: string
    details?: unknown
  }
}

export interface PaginationMeta {
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface AiQuestionPayload {
  questionText: string
  questionType?: string
  topic?: string
  difficulty: string
}

export interface AiEvaluationPayload {
  score: number
  technicalScore?: number
  communicationScore?: number
  confidenceScore?: number
  strengths?: string[]
  weaknesses?: string[]
  detailedFeedback: string
  modelReasoning?: string
  nextDifficulty?: string
}

export interface AiReportPayload {
  overallScore: number
  technicalScore?: number
  communicationScore?: number
  confidenceScore?: number
  strengths?: string[]
  weaknesses?: string[]
  suggestions?: string[]
  detailedSummary: string
}

export interface AiRecommendationItem {
  title: string
  url: string
  resourceType: string
  topic: string
  difficulty?: string
  provider?: string
  reason?: string
  priority?: number
}
