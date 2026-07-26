import bcrypt from 'bcrypt'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'
import type { LoginDto, SignupDto } from '../dto/index.js'
import crypto from 'crypto'
import {
  auditRepository,
  otpRepository,
  sessionRepository,
  userRepository,
} from '../repositories/repository.js'
import { sendEmail } from './email.service.js'
import { EmailTemplates } from '../templates/email.js'
import type { UserRole } from '../types/index.js'
import { AppError } from '../utils/http.js'

export class AuthService {
  private signAccessToken(userId: string, role: string) {
    return jwt.sign({ sub: userId, role }, env.JWT_ACCESS_SECRET, { expiresIn: '15m' })
  }

  private signRefreshToken(userId: string, role: string) {
    return jwt.sign({ sub: userId, role, typ: 'refresh' }, env.JWT_REFRESH_SECRET, {
      expiresIn: '30d',
    })
  }

  private async persistRefreshToken(userId: string, role: string) {
    const refreshToken = this.signRefreshToken(userId, role)
    await sessionRepository.create({
      userId,
      refreshToken: await bcrypt.hash(refreshToken, 12),
      expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    })
    return refreshToken
  }

  private async findMatchingSession(userId: string, rawRefreshToken: string) {
    const sessions = await sessionRepository.findValid(userId)
    for (const session of sessions) {
      if (await bcrypt.compare(rawRefreshToken, session.refreshToken)) {
        return session
      }
    }
    return null
  }

  async signup(input: SignupDto) {
    const existing = await userRepository.findByEmail(input.email.toLowerCase())
    if (existing) {
      throw new AppError(409, 'Email already exists', 'EMAIL_EXISTS')
    }

    const [user] = await userRepository.create({
      fullName: input.fullName,
      email: input.email.toLowerCase(),
      passwordHash: await bcrypt.hash(input.password, 12),
      targetRole: input.targetRole,
      experienceLevel: input.experienceLevel,
    })

    await auditRepository.create({
      userId: user.id,
      action: 'USER_SIGNUP',
      resourceType: 'user',
      resourceId: user.id,
    })

    // Send the verification email in the background (don't await it to block signup response)
    this.sendVerificationEmail(user.id, user.email, user.fullName).catch(err => {
      console.error('Failed to send verification email:', err)
    })

    return {
      message: 'Account created successfully. Please verify your email.',
      user: {
        id: user.id,
        email: user.email,
      }
    }
  }

  private generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString()
  }

  async sendVerificationEmail(userId: string, email: string, name: string) {
    const code = this.generateOTP()
    await otpRepository.deleteByUserAndType(userId, 'VERIFY_EMAIL')
    await otpRepository.create({
      userId,
      code,
      type: 'VERIFY_EMAIL',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
    })
    
    console.log(`\n========== DEVELOPMENT OTP ==========`)
    console.log(`Email: ${email}`)
    console.log(`Code: ${code}`)
    console.log(`=====================================\n`)
    
    await sendEmail(
      email,
      'Verify your email address - Lumify',
      EmailTemplates.getVerificationEmail(name, code)
    )
  }

  async resendVerificationEmail(email: string) {
    const user = await userRepository.findByEmail(email.toLowerCase())
    if (!user) {
      // Don't leak user existence
      return { success: true }
    }
    if (user.isVerified) {
      throw new AppError(400, 'Email is already verified', 'ALREADY_VERIFIED')
    }
    
    await this.sendVerificationEmail(user.id, user.email, user.fullName)
    return { success: true }
  }

  async verifyEmail(email: string, code: string) {
    const user = await userRepository.findByEmail(email.toLowerCase())
    if (!user) throw new AppError(404, 'User not found', 'NOT_FOUND')

    const otp = await otpRepository.findValid(user.id, code, 'VERIFY_EMAIL')
    if (!otp) throw new AppError(400, 'Invalid or expired verification code', 'INVALID_OTP')

    await userRepository.update(user.id, { isVerified: true })
    await otpRepository.deleteByUserAndType(user.id, 'VERIFY_EMAIL')

    const refreshToken = await this.persistRefreshToken(user.id, user.role)

    await auditRepository.create({
      userId: user.id,
      action: 'USER_LOGIN',
      resourceType: 'user',
      resourceId: user.id,
    })

    return {
      payload: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
        accessToken: this.signAccessToken(user.id, user.role),
      },
      refreshToken,
    }
  }

  async sendPasswordResetEmail(email: string) {
    const user = await userRepository.findByEmail(email.toLowerCase())
    if (!user) {
      // Don't leak if user exists
      return { success: true }
    }

    const code = this.generateOTP()
    await otpRepository.deleteByUserAndType(user.id, 'PASSWORD_RESET')
    await otpRepository.create({
      userId: user.id,
      code,
      type: 'PASSWORD_RESET',
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 mins
    })
    
    console.log(`\n========== DEVELOPMENT OTP ==========`)
    console.log(`Email: ${email}`)
    console.log(`Code: ${code}`)
    console.log(`=====================================\n`)
    
    await sendEmail(
      email,
      'Reset your password - Lumify',
      EmailTemplates.getPasswordResetEmail(user.fullName, code)
    )
    
    return { success: true }
  }

  async resetPassword(input: any) {
    const user = await userRepository.findByEmail(input.email.toLowerCase())
    if (!user) throw new AppError(400, 'Invalid request', 'INVALID_REQUEST')

    const otp = await otpRepository.findValid(user.id, input.code, 'PASSWORD_RESET')
    if (!otp) throw new AppError(400, 'Invalid or expired reset code', 'INVALID_OTP')

    const passwordHash = await bcrypt.hash(input.newPassword, 12)
    await userRepository.update(user.id, { passwordHash })
    await otpRepository.deleteByUserAndType(user.id, 'PASSWORD_RESET')
    
    // Revoke all sessions
    await sessionRepository.deleteByUser(user.id)
    return { success: true }
  }

  async login(input: LoginDto) {
    const user = await userRepository.findByEmail(input.email.toLowerCase())
    if (!user || !(await bcrypt.compare(input.password, user.passwordHash))) {
      throw new AppError(401, 'Invalid email or password', 'INVALID_CREDENTIALS')
    }

    if (!user.isVerified) {
      throw new AppError(403, 'Email not verified. Please verify your email first.', 'UNVERIFIED_EMAIL')
    }

    const refreshToken = await this.persistRefreshToken(user.id, user.role)

    await auditRepository.create({
      userId: user.id,
      action: 'USER_LOGIN',
      resourceType: 'user',
      resourceId: user.id,
    })

    return {
      payload: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role,
        },
        accessToken: this.signAccessToken(user.id, user.role),
      },
      refreshToken,
    }
  }

  async refresh(rawRefreshToken: string | undefined) {
    if (!rawRefreshToken) {
      throw new AppError(401, 'Missing refresh token', 'UNAUTHORIZED')
    }

    let decoded: { sub: string; role: string; typ?: string }
    try {
      decoded = jwt.verify(rawRefreshToken, env.JWT_REFRESH_SECRET) as {
        sub: string
        role: string
        typ?: string
      }
      if (decoded.typ && decoded.typ !== 'refresh') {
        throw new Error('invalid token type')
      }
    } catch {
      throw new AppError(401, 'Invalid refresh token', 'UNAUTHORIZED')
    }

    const session = await this.findMatchingSession(decoded.sub, rawRefreshToken)
    if (!session) {
      throw new AppError(401, 'Invalid refresh token', 'UNAUTHORIZED')
    }

    const user = await userRepository.findById(decoded.sub)
    if (!user) {
      throw new AppError(401, 'Invalid refresh token', 'UNAUTHORIZED')
    }

    await sessionRepository.deleteByTokenHash(session.refreshToken)
    const refreshToken = await this.persistRefreshToken(user.id, user.role)

    return {
      payload: {
        user: {
          id: user.id,
          fullName: user.fullName,
          email: user.email,
          role: user.role as UserRole,
        },
        accessToken: this.signAccessToken(user.id, user.role),
      },
      refreshToken,
    }
  }

  async logout(userId: string, rawRefreshToken?: string) {
    if (rawRefreshToken) {
      const session = await this.findMatchingSession(userId, rawRefreshToken)
      if (session) {
        await sessionRepository.deleteByTokenHash(session.refreshToken)
      }
    } else {
      await sessionRepository.deleteByUser(userId)
    }

    await auditRepository.create({
      userId,
      action: 'USER_LOGOUT',
      resourceType: 'user',
      resourceId: userId,
    })
  }

  async profile(userId: string) {
    const user = await userRepository.findById(userId)
    if (!user) throw new AppError(404, 'User not found', 'NOT_FOUND')
    return {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      role: user.role,
      targetRole: user.targetRole,
      experienceLevel: user.experienceLevel,
      createdAt: user.createdAt,
    }
  }
}

export const authService = new AuthService()
