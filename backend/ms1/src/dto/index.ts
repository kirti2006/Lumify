import { z } from 'zod'
import {
  interviewSchema,
  jdUploadSchema,
  loginSchema,
  signupSchema,
  updateInterviewSchema,
  updateUserSchema,
} from '../validators/schemas.js'

export type SignupDto = z.infer<typeof signupSchema>
export type LoginDto = z.infer<typeof loginSchema>
export type UpdateUserDto = z.infer<typeof updateUserSchema>
export type CreateInterviewDto = z.infer<typeof interviewSchema>
export type UpdateInterviewDto = z.infer<typeof updateInterviewSchema>
export type JdUploadDto = z.infer<typeof jdUploadSchema>

export interface UserResponseDto {
  id: string
  fullName: string
  email: string
  avatarUrl: string | null
  role: string
  targetRole: string | null
  experienceLevel: string | null
  createdAt: Date
}

export interface AuthTokensDto {
  user: {
    id: string
    fullName: string
    email: string
    role: string
  }
  accessToken: string
}
