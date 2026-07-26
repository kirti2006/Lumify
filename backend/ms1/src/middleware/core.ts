import type { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import multer from 'multer'
import { ZodError, type ZodTypeAny } from 'zod'
import { env } from '../config/env.js'
import { logger } from '../config/logger.js'
import type { UserRole } from '../types/index.js'
import { AppError } from '../utils/http.js'

declare global {
  namespace Express {
    interface Request {
      auth?: { userId: string; role: UserRole }
    }
  }
}

export function validateBody(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body)
      next()
    } catch (error) {
      next(error)
    }
  }
}

export function validateQuery(schema: ZodTypeAny) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.query)
      Object.assign(req.query, parsed)
      next()
    } catch (error) {
      next(error)
    }
  }
}

export function authenticate(req: Request, _res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return next(new AppError(401, 'Authentication required', 'UNAUTHORIZED'))
  }
  
  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as { sub: string; role: string }
    req.auth = { userId: decoded.sub, role: decoded.role as UserRole }
    next()
  } catch (error) {
    next(new AppError(401, 'Invalid or expired token', 'UNAUTHORIZED'))
  }
}

export function authorize(...roles: UserRole[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.auth || !roles.includes(req.auth.role)) {
      next(new AppError(403, 'Insufficient permissions', 'FORBIDDEN'))
      return
    }
    next()
  }
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const started = Date.now()
  res.on('finish', () => {
    logger.http('request_completed', {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs: Date.now() - started,
      userId: req.auth?.userId,
    })
  })
  next()
}

export const uploadPdf = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype !== 'application/pdf') {
      cb(new AppError(400, 'Only PDF files are allowed', 'UPLOAD_ERROR'))
      return
    }
    cb(null, true)
  },
})

export const uploadAudio = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['audio/webm', 'audio/mpeg', 'audio/mp4', 'audio/wav', 'video/webm']
    if (!allowed.includes(file.mimetype)) {
      cb(new AppError(400, 'Unsupported audio format', 'UPLOAD_ERROR'))
      return
    }
    cb(null, true)
  },
})

export const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.mimetype)) {
      cb(new AppError(400, 'Unsupported image format', 'UPLOAD_ERROR'))
      return
    }
    cb(null, true)
  },
})

export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      error: { code: 'VALIDATION_ERROR', details: err.flatten() },
    })
  }

  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error(err.message, { code: err.code, details: err.details, stack: err.stack })
    }
    return res.status(err.statusCode).json({
      success: false,
      message: err.message,
      error: { code: err.code, ...(err.details ? { details: err.details } : {}) },
    })
  }

  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: err.message,
      error: { code: 'UPLOAD_ERROR' },
    })
  }

  logger.error('unhandled_error', {
    message: err instanceof Error ? err.message : 'Unknown error',
    stack: err instanceof Error ? err.stack : undefined,
  })

  return res.status(500).json({
    success: false,
    message: err instanceof Error ? err.message : 'Internal server error',
    stack: err instanceof Error ? err.stack : undefined,
    error: { code: 'INTERNAL_ERROR' },
  })
}
