import request from 'supertest'
import { describe, expect, it } from 'vitest'
import app from '../src/app.js'

describe('API integration', () => {
  it('serves OpenAPI JSON', async () => {
    const response = await request(app).get('/api-docs.json')
    expect(response.status).toBe(200)
    expect(response.body.openapi).toBe('3.0.3')
    expect(response.body.paths['/auth/login']).toBeDefined()
  })

  it('returns standardized 404 payload', async () => {
    const response = await request(app).get('/api/v1/unknown-route')
    expect(response.status).toBe(404)
    expect(response.body.success).toBe(false)
    expect(response.body.error.code).toBe('NOT_FOUND')
  })

  it('validates signup payload', async () => {
    const response = await request(app).post('/api/v1/auth/signup').send({
      fullName: 'A',
      email: 'not-an-email',
      password: 'weak',
    })
    expect(response.status).toBe(400)
    expect(response.body.error.code).toBe('VALIDATION_ERROR')
  })
})
