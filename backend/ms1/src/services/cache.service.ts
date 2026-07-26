import { Redis } from 'ioredis'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'

class CacheService {
  private client: Redis | null = null

  constructor() {
    if (env.REDIS_URL) {
      try {
        this.client = new Redis(env.REDIS_URL, {
          maxRetriesPerRequest: 1,
          retryStrategy: (times: number) => {
            if (times > 3) {
              return null; // Stop retrying after 3 attempts
            }
            return Math.min(times * 50, 2000);
          }
        })

        this.client.on('error', (err: any) => {
          logger.warn(`Redis connection error: ${err.message}`)
        })

        this.client.on('connect', () => {
          logger.info('Connected to Redis')
        })
      } catch (err) {
        logger.error('Failed to initialize Redis client', err)
      }
    } else {
      logger.warn('No REDIS_URL provided. CacheService is disabled.')
    }
  }

  /**
   * Get parsed JSON from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.client) return null
    try {
      const data = await this.client.get(key)
      return data ? JSON.parse(data) : null
    } catch (err) {
      logger.error(`Cache GET error for key ${key}`, err)
      return null
    }
  }

  /**
   * Set JSON to cache with expiration (default 5 mins)
   */
  async set(key: string, value: any, ttlSeconds: number = 300): Promise<void> {
    if (!this.client) return
    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds)
    } catch (err) {
      logger.error(`Cache SET error for key ${key}`, err)
    }
  }

  /**
   * Delete a specific key
   */
  async del(key: string): Promise<void> {
    if (!this.client) return
    try {
      await this.client.del(key)
    } catch (err) {
      logger.error(`Cache DEL error for key ${key}`, err)
    }
  }

  /**
   * Invalidate multiple keys using a pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.client) return
    try {
      let cursor = '0'
      do {
        const [nextCursor, keys] = await this.client.scan(cursor, 'MATCH', pattern, 'COUNT', 100)
        cursor = nextCursor
        if (keys.length > 0) {
          await this.client.del(...keys)
        }
      } while (cursor !== '0')
    } catch (err) {
      logger.error(`Cache INVALIDATE error for pattern ${pattern}`, err)
    }
  }
}

export const cacheService = new CacheService()
