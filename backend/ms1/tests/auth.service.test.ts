import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const requiredEnv = {
  NODE_ENV: 'test',
  PORT: '4000',
  DATABASE_URL: 'postgresql://user:password@localhost:5432/lumify_test',
  JWT_ACCESS_SECRET: '12345678901234567890123456789012',
  JWT_REFRESH_SECRET: '12345678901234567890123456789012',
  CLOUDINARY_URL: 'cloudinary://key:secret@demo',
  AI_SERVICE_URL: 'http://127.0.0.1:8001',
  AI_SERVICE_API_KEY: 'internal-api-key',
  CORS_ORIGIN: '*',
  LOG_LEVEL: 'info',
}

const originalEnv = { ...process.env }

beforeEach(() => {
  Object.assign(process.env, requiredEnv)
})

afterEach(() => {
  vi.resetModules()
  process.env = { ...originalEnv }
})

describe('AuthService email verification toggle', () => {
  it('requires verification by default', async () => {
    delete process.env.SKIP_EMAIL_VERIFICATION
    const { authService } = await import('../src/services/auth.service.js')

    expect(authService.shouldRequireEmailVerification()).toBe(true)
  })

  it('skips verification when the flag is enabled', async () => {
    process.env.SKIP_EMAIL_VERIFICATION = 'true'
    const { authService } = await import('../src/services/auth.service.js')

    expect(authService.shouldRequireEmailVerification()).toBe(false)
  })
})
