import 'dotenv/config'
import { z } from 'zod'

const schema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),
  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  CLOUDINARY_URL: z.string().url(),
  REDIS_URL: z.string().optional(),
  AI_SERVICE_URL: z.string().url().default('http://127.0.0.1:8000'),
  AI_SERVICE_API_KEY: z.string().min(1),
  CORS_ORIGIN: z.string().min(1),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
})

export const env = schema.parse(process.env)
export type Env = z.infer<typeof schema>
