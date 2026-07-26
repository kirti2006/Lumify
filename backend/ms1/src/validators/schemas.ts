import { z } from 'zod'

export const experienceLevelSchema = z.enum(['fresher', 'junior', 'mid', 'senior'])
export const interviewTypeSchema = z.enum(['technical', 'behavioral', 'hr', 'mixed'])
export const interviewStatusSchema = z.enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'terminated'])

export const signupSchema = z.object({
  fullName: z.string().min(2).max(100),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain a special character'),
  targetRole: z.string().max(100).optional(),
  experienceLevel: experienceLevelSchema.optional(),
})

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
})

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  code: z.string().length(6),
  newPassword: z
    .string()
    .min(8)
    .regex(/[A-Z]/, 'Password must contain an uppercase letter')
    .regex(/[0-9]/, 'Password must contain a number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain a special character'),
})

export const updateUserSchema = z.object({
  fullName: z.string().min(2).max(100).optional(),
  targetRole: z.string().max(100).optional(),
  experienceLevel: experienceLevelSchema.optional(),
  avatarUrl: z.string().url().optional(),
})

export const interviewSchema = z.object({
  resumeId: z.string().uuid().optional(),
  jdId: z.string().uuid().optional(),
  company: z.string().max(255).optional(),
  role: z.string().max(255).optional(),
  interviewType: interviewTypeSchema,
  experienceLevel: experienceLevelSchema,
  scheduledAt: z.string().datetime().optional(),
  totalQuestions: z.number().int().min(1).max(100).default(10),
})

export const updateInterviewSchema = z.object({
  status: interviewStatusSchema.optional(),
  scheduledAt: z.string().datetime().optional(),
  company: z.string().max(255).optional(),
  role: z.string().max(255).optional(),
  totalQuestions: z.number().int().min(1).max(100).optional(),
})

export const jdUploadSchema = z.object({
  title: z.string().min(1).max(255),
  company: z.string().min(1).max(255),
  rawText: z.string().min(20),
})

export const submitAnswerSchema = z.object({
  questionId: z.string(),
  transcript: z.string().optional().default(""),
  responseDurationS: z.coerce.number().int().min(0).optional(),
})

export const listQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional(),
  pageSize: z.coerce.number().int().min(1).max(100).optional(),
  status: interviewStatusSchema.optional(),
  sortBy: z.enum(['scheduledAt', 'createdAt', 'status']).optional(),
  order: z.enum(['asc', 'desc']).optional(),
  isRead: z
    .enum(['true', 'false'])
    .optional()
    .transform((v) => (v === undefined ? undefined : v === 'true')),
  search: z.string().optional(),
})
