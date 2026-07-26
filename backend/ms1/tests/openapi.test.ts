import { describe, expect, it } from 'vitest'
import { openApiDocument } from '../src/swagger/openapi.js'

describe('openapi document', () => {
  it('documents core ms-1 routes', () => {
    const paths = Object.keys(openApiDocument.paths)
    expect(paths).toContain('/auth/signup')
    expect(paths).toContain('/interviews/{id}/start')
    expect(paths).toContain('/sessions/{sessionId}/answer')
    expect(paths).toContain('/analytics/dashboard')
    expect(paths).toContain('/health')
  })
})
