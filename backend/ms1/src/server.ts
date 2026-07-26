import app from './app.js'
import { env } from './config/env.js'
import { logger } from './config/logger.js'
import { pool } from './database/client.js'

const server = app.listen(env.PORT, () => {
  logger.info(`Lumify MS-1 listening on port ${env.PORT}`)
})

const shutdown = (signal: string) => {
  logger.info('shutdown_started', { signal })
  server.close(() => {
    pool
      .end()
      .catch((error) => logger.error('pool_shutdown_failed', { message: error.message }))
      .finally(() => process.exit(0))
  })
}

process.on('SIGINT', () => shutdown('SIGINT'))
process.on('SIGTERM', () => shutdown('SIGTERM'))
process.on('unhandledRejection', (reason) => {
  logger.error('unhandled_rejection', { reason: String(reason) })
})
process.on('uncaughtException', (error) => {
  logger.error('uncaught_exception', { message: error.message, stack: error.stack })
  shutdown('uncaughtException')
})
