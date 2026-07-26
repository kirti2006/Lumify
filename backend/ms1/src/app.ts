import cookieParser from 'cookie-parser'
import cors from 'cors'
import express from 'express'
import rateLimit from 'express-rate-limit'
import helmet from 'helmet'
import swaggerUi from 'swagger-ui-express'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { errorHandler, requestLogger } from './middleware/core.js'
import { api } from './routes/api.js'
import { openApiDocument } from './swagger/openapi.js'

const app = express()

app.set('trust proxy', 1)
app.use(requestLogger)
app.use(helmet())
app.use(
  cors({
    origin: env.CORS_ORIGIN.split(',').map((v) => v.trim()),
    credentials: true,
  }),
)
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    max: env.NODE_ENV === 'production' ? 300 : 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: 'Too many requests',
      error: { code: 'RATE_LIMITED' },
    },
  }),
)
app.use(express.json({ limit: '1mb' }))
app.use(express.urlencoded({ extended: true }))
app.use(cookieParser())

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(openApiDocument))
app.get('/api-docs.json', (_req, res) => res.json(openApiDocument))

app.use('/api/v1', api)

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    error: { code: 'NOT_FOUND' },
  })
})

app.use(errorHandler)

logger.info('express_app_initialized', { env: env.NODE_ENV })

export default app
