import type { Request, Response } from 'express'
import { clearRefreshCookie, setRefreshCookie } from '../utils/cookies.js'
import { created, noContent, ok, pathParam } from '../utils/http.js'
import { authService } from '../services/auth.service.js'
import { userService } from '../services/user.service.js'
import { interviewService } from '../services/interview.service.js'
import { jdService, resumeService } from '../services/file.service.js'
import {
  analyticsService,
  notificationService,
  reportService,
} from '../services/report.service.js'
import { healthService } from '../services/health.service.js'
import type { UserRole } from '../types/index.js'
import { jdUploadSchema } from '../validators/schemas.js'

export const authController = {
  signup: async (req: Request, res: Response) => {
    created(res, await authService.signup(req.body), 'Account created')
  },
  verifyEmail: async (req: Request, res: Response) => {
    const result = await authService.verifyEmail(req.body.email, req.body.code);
    setRefreshCookie(res, result.refreshToken);
    ok(res, result.payload, 'Email verified successfully')
  },
  resendVerificationEmail: async (req: Request, res: Response) => {
    ok(res, await authService.resendVerificationEmail(req.body.email), 'Verification email sent if account exists and is not verified.')
  },
  forgotPassword: async (req: Request, res: Response) => {
    ok(res, await authService.sendPasswordResetEmail(req.body.email), 'If an account exists, a reset link has been sent.')
  },
  resetPassword: async (req: Request, res: Response) => {
    ok(res, await authService.resetPassword(req.body), 'Password reset successfully. You can now login.')
  },
  login: async (req: Request, res: Response) => {
    const result = await authService.login(req.body)
    setRefreshCookie(res, result.refreshToken)
    ok(res, result.payload, 'Login successful')
  },
  refresh: async (req: Request, res: Response) => {
    const result = await authService.refresh(req.cookies?.refreshToken)
    setRefreshCookie(res, result.refreshToken)
    ok(res, result.payload, 'Token refreshed')
  },
  logout: async (req: Request, res: Response) => {
    await authService.logout(req.auth!.userId, req.cookies?.refreshToken)
    clearRefreshCookie(res)
    noContent(res)
  },
  profile: async (req: Request, res: Response) => {
    ok(res, await authService.profile(req.auth!.userId))
  },
}

export const userController = {
  list: async (req: Request, res: Response) => {
    const result = await userService.list(req.query as Record<string, unknown>)
    ok(res, result.data, '', result.meta)
  },
  getById: async (req: Request, res: Response) => {
    ok(
      res,
      await userService.getById(
        pathParam(req.params.id),
        req.auth!.userId,
        req.auth!.role as UserRole,
      ),
    )
  },
  update: async (req: Request, res: Response) => {
    ok(
      res,
      await userService.update(
        pathParam(req.params.id),
        req.auth!.userId,
        req.auth!.role as UserRole,
        req.body,
      ),
      'Profile updated',
    )
  },
  uploadAvatar: async (req: Request, res: Response) => {
    ok(
      res,
      await userService.uploadAvatar(req.auth!.userId, req.file!),
      'Avatar uploaded',
    )
  },
  deleteAccount: async (req: Request, res: Response) => {
    ok(
      res,
      await userService.deleteAccount(
        pathParam(req.params.id),
        req.auth!.userId,
        req.auth!.role as UserRole,
      ),
      'Account deleted successfully'
    )
  },
}

export const interviewController = {
  create: async (req: Request, res: Response) => {
    created(res, await interviewService.create(req.auth!.userId, req.body), 'Interview scheduled')
  },
  list: async (req: Request, res: Response) => {
    const result = await interviewService.list(req.auth!.userId, req.query as Record<string, unknown>)
    ok(res, result.data, '', result.meta)
  },
  getById: async (req: Request, res: Response) => {
    ok(res, await interviewService.getById(pathParam(req.params.id), req.auth!.userId))
  },
  update: async (req: Request, res: Response) => {
    ok(
      res,
      await interviewService.update(pathParam(req.params.id), req.auth!.userId, req.body),
      'Interview updated',
    )
  },
  remove: async (req: Request, res: Response) => {
    await interviewService.remove(pathParam(req.params.id), req.auth!.userId)
    noContent(res)
  },
  start: async (req: Request, res: Response) => {
    ok(
      res,
      await interviewService.start(pathParam(req.params.id), req.auth!.userId),
      'Interview started',
    )
  },
  finish: async (req: Request, res: Response) => {
    ok(
      res,
      await interviewService.finish(pathParam(req.params.id), req.auth!.userId),
      'Interview finished',
    )
  },
  finishSession: async (req: Request, res: Response) => {
    ok(
      res,
      await interviewService.finishSession(pathParam(req.params.sessionId), req.auth!.userId),
      'Session finished',
    )
  },
  terminateSession: async (req: Request, res: Response) => {
    ok(
      res,
      await interviewService.terminateSession(pathParam(req.params.sessionId), req.auth!.userId),
      'Session terminated',
    )
  },
  submitAnswer: async (req: Request, res: Response) => {
    ok(
      res,
      await interviewService.submitAnswer(
        pathParam(req.params.sessionId),
        req.auth!.userId,
        {
          questionId: String(req.body.questionId),
          transcript: req.body.transcript,
          responseDurationS:
            req.body.responseDurationS != null ? Number(req.body.responseDurationS) : undefined,
        }
      ),
      'Answer submitted',
    )
  },
}

export const resumeController = {
  upload: async (req: Request, res: Response) => {
    created(res, await resumeService.upload(req.auth!.userId, req.file), 'Resume uploaded')
  },
  getById: async (req: Request, res: Response) => {
    ok(res, await resumeService.getById(pathParam(req.params.id), req.auth!.userId))
  },
}

export const jdController = {
  upload: async (req: Request, res: Response) => {
    if (req.file) {
      created(
        res,
        await jdService.uploadPdf(req.auth!.userId, req.file, {
          title: req.body.title,
          company: req.body.company,
        }),
        'Job description uploaded',
      )
      return
    }
    const input = jdUploadSchema.parse(req.body)
    created(res, await jdService.uploadText(req.auth!.userId, input), 'Job description saved')
  },
  getById: async (req: Request, res: Response) => {
    ok(res, await jdService.getById(pathParam(req.params.id), req.auth!.userId))
  },
}

export const reportController = {
  list: async (req: Request, res: Response) => {
    const result = await reportService.list(req.auth!.userId, req.query as Record<string, unknown>)
    ok(res, result.data, '', result.meta)
  },
  getById: async (req: Request, res: Response) => {
    ok(res, await reportService.getById(pathParam(req.params.id), req.auth!.userId))
  },
}

export const analyticsController = {
  dashboard: async (req: Request, res: Response) => {
    ok(res, await analyticsService.dashboard(req.auth!.userId))
  },
  trends: async (req: Request, res: Response) => {
    ok(res, await analyticsService.trends(req.auth!.userId))
  },
  performance: async (req: Request, res: Response) => {
    ok(res, await analyticsService.performance(req.auth!.userId))
  },
  skillGrowth: async (req: Request, res: Response) => {
    ok(res, await analyticsService.skillGrowth(req.auth!.userId))
  },
}

export const notificationController = {
  list: async (req: Request, res: Response) => {
    const result = await notificationService.list(
      req.auth!.userId,
      req.query as Record<string, unknown>,
    )
    ok(res, result.data, '', result.meta)
  },
  markRead: async (req: Request, res: Response) => {
    ok(
      res,
      await notificationService.markRead(pathParam(req.params.id), req.auth!.userId),
      'Notification marked as read',
    )
  },
  markAllRead: async (req: Request, res: Response) => {
    ok(res, await notificationService.markAllRead(req.auth!.userId), 'All notifications marked as read')
  },
}

export const healthController = {
  check: async (_req: Request, res: Response) => {
    const result = await healthService.check()
    res.status(result.status === 'ok' ? 200 : 503).json({
      success: result.status === 'ok',
      message: result.status === 'ok' ? 'Healthy' : 'Degraded',
      data: result,
    })
  },
}
