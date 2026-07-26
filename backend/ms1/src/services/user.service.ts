import type { UpdateUserDto } from '../dto/index.js'
import { auditRepository, userRepository } from '../repositories/repository.js'
import { uploadToCloudinary } from './cloudinary.service.js'
import type { UserRole } from '../types/index.js'
import { AppError, parsePagination } from '../utils/http.js'

export class UserService {
  async list(query: Record<string, unknown>) {
    const { page, pageSize, offset } = parsePagination(query)
    const search = typeof query.search === 'string' ? query.search : undefined
    const { rows, total } = await userRepository.list({ offset, limit: pageSize, search })
    return {
      data: rows,
      meta: { total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 1 },
    }
  }

  async getById(id: string, requesterId: string, role: UserRole) {
    if (requesterId !== id && role !== 'admin') {
      throw new AppError(403, 'Forbidden', 'FORBIDDEN')
    }
    const user = await userRepository.findById(id)
    if (!user) throw new AppError(404, 'User not found', 'NOT_FOUND')
    const { passwordHash: _, ...safe } = user
    return safe
  }

  async update(id: string, requesterId: string, role: UserRole, input: UpdateUserDto) {
    if (requesterId !== id && role !== 'admin') {
      throw new AppError(403, 'Forbidden', 'FORBIDDEN')
    }
    const [user] = await userRepository.update(id, input)
    if (!user) throw new AppError(404, 'User not found', 'NOT_FOUND')
    await auditRepository.create({
      userId: requesterId,
      action: 'USER_UPDATED',
      resourceType: 'user',
      resourceId: id,
      metadata: input,
    })
    const { passwordHash: _, ...safe } = user
    return safe
  }
  async uploadAvatar(id: string, file: Express.Multer.File) {
    if (!file) throw new AppError(400, 'No image provided', 'BAD_REQUEST')
    
    // Upload to Cloudinary
    const result = await uploadToCloudinary(file.buffer, 'lumify_avatars')
    
    // Update user
    const [user] = await userRepository.update(id, { avatarUrl: result.secure_url })
    if (!user) throw new AppError(404, 'User not found', 'NOT_FOUND')
    
    await auditRepository.create({
      userId: id,
      action: 'USER_UPDATED',
      resourceType: 'user',
      resourceId: id,
      metadata: { avatarUrl: result.secure_url },
    })
    
    const { passwordHash: _, ...safe } = user
    return safe
  }
  
  async deleteAccount(id: string, requesterId: string, role: UserRole) {
    if (requesterId !== id && role !== 'admin') {
      throw new AppError(403, 'Forbidden', 'FORBIDDEN')
    }
    const [deletedUser] = await userRepository.delete(id)
    if (!deletedUser) throw new AppError(404, 'User not found', 'NOT_FOUND')
    
    await auditRepository.create({
      userId: requesterId,
      action: 'USER_DELETED',
      resourceType: 'user',
      resourceId: id,
    })
    
    return { success: true }
  }
}

export const userService = new UserService()
