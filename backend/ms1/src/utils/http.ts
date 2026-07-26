import type { NextFunction, Request, Response } from 'express'

export class AppError extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public code = 'INTERNAL_ERROR',
    public details?: unknown,
  ) {
    super(message)
    this.name = 'AppError'
  }
}

export function ok(res: Response, data: unknown, message = '', meta?: Record<string, unknown>) {
  return res.status(200).json({ success: true, message, data, ...(meta ? { meta } : {}) })
}

export function created(res: Response, data: unknown, message = 'Created', meta?: Record<string, unknown>) {
  return res.status(201).json({ success: true, message, data, ...(meta ? { meta } : {}) })
}

export function noContent(res: Response) {
  return res.status(204).send()
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>,
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next)
  }
}

export function pathParam(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value[0] ?? ''
  return value ?? ''
}

export function parsePagination(query: Record<string, unknown>) {
  const page = Math.max(1, Number(query.page) || 1)
  const pageSize = Math.min(100, Math.max(1, Number(query.pageSize) || 10))
  return { page, pageSize, offset: (page - 1) * pageSize }
}
