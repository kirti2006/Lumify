import { checkDatabase } from '../database/client.js'
import { aiClient } from './ai-client.js'
import { checkStorage } from '../storage/cloudinary.js'
import { env } from '../config/env.js'

export class HealthService {
  async check() {
    const [database, storage, aiService] = await Promise.all([
      checkDatabase().catch(() => false),
      checkStorage().catch(() => false),
      aiClient.healthCheck().catch(() => false),
    ])

    const healthy = database && storage
    return {
      status: healthy ? 'ok' : 'degraded',
      checks: {
        database: database ? 'up' : 'down',
        cloudinary: env.CLOUDINARY_URL ? 'configured' : 'missing',
        storage: storage ? 'up' : 'down',
        aiService: aiService ? 'up' : 'down',
        aiServiceUrl: env.AI_SERVICE_URL,
      },
    }
  }
}

export const healthService = new HealthService()
