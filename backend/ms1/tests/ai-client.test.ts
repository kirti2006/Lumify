import { describe, expect, it } from 'vitest'
import { AiClient } from '../src/services/ai-client.js'

describe('AiClient', () => {
  it('exposes all FastAPI gateway methods', () => {
    const client = new AiClient()
    expect(typeof client.analyzeResume).toBe('function')
    expect(typeof client.analyzeJd).toBe('function')
    expect(typeof client.startInterview).toBe('function')
    expect(typeof client.generateQuestion).toBe('function')
    expect(typeof client.evaluateAnswer).toBe('function')
    expect(typeof client.finishInterview).toBe('function')
    expect(typeof client.generateReport).toBe('function')
    expect(typeof client.getRecommendations).toBe('function')
  })
})
