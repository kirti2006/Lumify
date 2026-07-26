import type { CookieOptions, Response } from 'express'
import { env } from '../config/env.js'

const REFRESH_PATH = '/api/v1/auth/refresh'

export function refreshCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: REFRESH_PATH,
    maxAge: 30 * 24 * 60 * 60 * 1000,
  }
}

export function setRefreshCookie(res: Response, token: string) {
  res.cookie('refreshToken', token, refreshCookieOptions())
}

export function clearRefreshCookie(res: Response) {
  res.clearCookie('refreshToken', { path: REFRESH_PATH })
}
