import { Router } from 'express'
import {
  analyticsController,
  authController,
  healthController,
  interviewController,
  jdController,
  notificationController,
  reportController,
  resumeController,
  userController,
} from '../controllers/index.js'
import {
  authenticate,
  authorize,
  uploadAudio,
  uploadImage,
  uploadPdf,
  validateBody,
  validateQuery,
} from '../middleware/core.js'
import { asyncHandler } from '../utils/http.js'
import {
  interviewSchema,
  listQuerySchema,
  loginSchema,
  signupSchema,
  verifyEmailSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  submitAnswerSchema,
  updateInterviewSchema,
  updateUserSchema,
} from '../validators/schemas.js'

export const api = Router()

api.get('/health', asyncHandler(healthController.check))

api.post('/auth/signup', validateBody(signupSchema), asyncHandler(authController.signup))
api.post('/auth/verify-email', validateBody(verifyEmailSchema), asyncHandler(authController.verifyEmail))
api.post('/auth/resend-verification', validateBody(forgotPasswordSchema), asyncHandler(authController.resendVerificationEmail))
api.post('/auth/login', validateBody(loginSchema), asyncHandler(authController.login))
api.post('/auth/forgot-password', validateBody(forgotPasswordSchema), asyncHandler(authController.forgotPassword))
api.post('/auth/reset-password', validateBody(resetPasswordSchema), asyncHandler(authController.resetPassword))
api.post('/auth/refresh', asyncHandler(authController.refresh))
api.post('/auth/logout', authenticate, asyncHandler(authController.logout))
api.get('/auth/profile', authenticate, asyncHandler(authController.profile))

api.get(
  '/users',
  authenticate,
  authorize('admin'),
  validateQuery(listQuerySchema),
  asyncHandler(userController.list),
)
api.post(
  '/users/avatar',
  authenticate,
  uploadImage.single('avatar'),
  asyncHandler(userController.uploadAvatar),
)
api.get('/users/:id', authenticate, asyncHandler(userController.getById))
api.delete('/users/:id', authenticate, asyncHandler(userController.deleteAccount))
api.patch(
  '/users/:id',
  authenticate,
  validateBody(updateUserSchema),
  asyncHandler(userController.update),
)

api.post(
  '/interviews',
  authenticate,
  validateBody(interviewSchema),
  asyncHandler(interviewController.create),
)
api.get(
  '/interviews',
  authenticate,
  validateQuery(listQuerySchema),
  asyncHandler(interviewController.list),
)
api.get('/interviews/:id', authenticate, asyncHandler(interviewController.getById))
api.patch(
  '/interviews/:id',
  authenticate,
  validateBody(updateInterviewSchema),
  asyncHandler(interviewController.update),
)
api.delete('/interviews/:id', authenticate, asyncHandler(interviewController.remove))
api.post('/interviews/:id/start', authenticate, asyncHandler(interviewController.start))
api.post('/interviews/:id/finish', authenticate, asyncHandler(interviewController.finish))
api.post(
  '/sessions/:sessionId/answer',
  authenticate,
  validateBody(submitAnswerSchema),
  asyncHandler(interviewController.submitAnswer),
)

api.post(
  '/sessions/:sessionId/finish',
  authenticate,
  asyncHandler(interviewController.finishSession),
)
api.post(
  '/sessions/:sessionId/terminate',
  authenticate,
  asyncHandler(interviewController.terminateSession),
)

api.post(
  '/resume/upload',
  authenticate,
  uploadPdf.single('resume'),
  asyncHandler(resumeController.upload),
)
api.get('/resume/:id', authenticate, asyncHandler(resumeController.getById))

api.post('/jd/upload', authenticate, uploadPdf.single('jd'), asyncHandler(jdController.upload))
api.get('/jd/:id', authenticate, asyncHandler(jdController.getById))

api.get('/reports', authenticate, validateQuery(listQuerySchema), asyncHandler(reportController.list))
api.get('/reports/:id', authenticate, asyncHandler(reportController.getById))

api.get('/analytics/dashboard', authenticate, asyncHandler(analyticsController.dashboard))
api.get('/analytics/trends', authenticate, asyncHandler(analyticsController.trends))
api.get('/analytics/performance', authenticate, asyncHandler(analyticsController.performance))
api.get('/analytics/skill-growth', authenticate, asyncHandler(analyticsController.skillGrowth))

api.get(
  '/notifications',
  authenticate,
  validateQuery(listQuerySchema),
  asyncHandler(notificationController.list),
)
api.patch('/notifications/read-all', authenticate, asyncHandler(notificationController.markAllRead))
api.patch('/notifications/:id/read', authenticate, asyncHandler(notificationController.markRead))
