import fs from 'node:fs'
import path from 'node:path'
import winston from 'winston'
import { env } from './env.js'

const logsDir = path.resolve(process.cwd(), 'logs')
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true })
}

const { combine, timestamp, printf, colorize, errors, json } = winston.format

const consoleFormat = printf(({ level, message, timestamp: ts, stack, ...meta }) => {
  const rest = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : ''
  return `${ts} [${level}] ${stack ?? message}${rest}`
})

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  defaultMeta: { service: 'lumify-ms1' },
  format: combine(errors({ stack: true }), timestamp(), json()),
  transports: [
    new winston.transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
    new winston.transports.File({ filename: path.join(logsDir, 'combined.log') }),
  ],
})

if (env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: combine(colorize(), timestamp(), consoleFormat),
    }),
  )
}

export function logRequest(method: string, url: string, status: number, durationMs: number, userId?: string) {
  logger.http('incoming_request', { method, url, status, durationMs, userId })
}

export function logAiCall(endpoint: string, durationMs: number, statusCode?: number, error?: string) {
  if (error) {
    logger.error('fastapi_call_failed', { endpoint, durationMs, statusCode, error })
    return
  }
  logger.info('fastapi_call', { endpoint, durationMs, statusCode })
}

export function logUpload(userId: string, pathName: string, bytes: number) {
  logger.info('file_upload', { userId, path: pathName, bytes })
}
