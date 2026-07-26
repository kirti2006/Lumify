import { describe, expect, it } from 'vitest'
import {
  interviewSchema,
  loginSchema,
  signupSchema,
  updateUserSchema,
} from '../src/validators/schemas.js'
import { AppError, parsePagination } from '../src/utils/http.js'

describe('auth validators', () => {
  it('accepts a valid signup payload', () => {
    const parsed = signupSchema.parse({
      fullName: 'Arjun Mehta',
      email: 'arjun@example.com',
      password: 'Secure@123',
      experienceLevel: 'junior',
    })
    expect(parsed.email).toBe('arjun@example.com')
  })

  it('rejects weak passwords', () => {
    expect(() =>
      signupSchema.parse({
        fullName: 'Arjun Mehta',
        email: 'arjun@example.com',
        password: 'weak',
      }),
    ).toThrow()
  })

  it('accepts login credentials', () => {
    const parsed = loginSchema.parse({ email: 'a@b.com', password: 'x' })
    expect(parsed.email).toBe('a@b.com')
  })
})

describe('interview validators', () => {
  it('applies default totalQuestions', () => {
    const parsed = interviewSchema.parse({
      interviewType: 'technical',
      experienceLevel: 'mid',
    })
    expect(parsed.totalQuestions).toBe(10)
  })
})

describe('user validators', () => {
  it('allows partial updates', () => {
    const parsed = updateUserSchema.parse({ fullName: 'New Name' })
    expect(parsed.fullName).toBe('New Name')
  })
})

describe('http utils', () => {
  it('creates typed application errors', () => {
    const error = new AppError(404, 'Missing', 'NOT_FOUND')
    expect(error.statusCode).toBe(404)
    expect(error.code).toBe('NOT_FOUND')
  })

  it('parses pagination with defaults and clamps', () => {
    expect(parsePagination({})).toEqual({ page: 1, pageSize: 10, offset: 0 })
    expect(parsePagination({ page: '2', pageSize: '200' })).toEqual({
      page: 2,
      pageSize: 100,
      offset: 100,
    })
  })
})
