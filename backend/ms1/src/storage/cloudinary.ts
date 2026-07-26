import { v2 as cloudinary } from 'cloudinary'
import streamifier from 'streamifier'
import { env } from '../config/env.js'
import { logUpload, logger } from '../config/logger.js'
import { AppError } from '../utils/http.js'

// Configure Cloudinary
cloudinary.config({
  // CLOUDINARY_URL is automatically picked up if set in environment,
  // but we can pass it explicitly just to be safe.
  cloudinary_url: env.CLOUDINARY_URL,
})

export const storage = cloudinary

export async function uploadBuffer(
  storagePath: string,
  buffer: Buffer,
  contentType: string,
  userId?: string,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'lumify',
        public_id: storagePath,
        resource_type: 'auto',
        overwrite: true,
      },
      (error, result) => {
        if (error) {
          logger.error('storage_upload_failed', { storagePath, message: error.message })
          return reject(
            new AppError(502, 'Storage upload failed', 'STORAGE_ERROR', { reason: error.message })
          )
        }
        if (result) {
          if (userId) logUpload(userId, storagePath, buffer.length)
          resolve(result.secure_url)
        }
      }
    )

    streamifier.createReadStream(buffer).pipe(uploadStream)
  })
}

export async function uploadFile(
  storagePath: string,
  file: Express.Multer.File,
  userId?: string
): Promise<string> {
  return uploadBuffer(storagePath, file.buffer, file.mimetype, userId)
}

export async function createSignedUrl(storagePath: string, expiresInSeconds = 3600): Promise<string> {
  // Cloudinary URLs returned from upload are already public URLs.
  // If we just have the public_id (storagePath), we can generate a URL for it.
  // We'll assume storagePath is the public_id or the full URL.
  if (storagePath.startsWith('http')) {
    return storagePath
  }
  
  try {
    const url = cloudinary.url(`lumify/${storagePath}`, {
      resource_type: 'auto',
      secure: true,
    })
    return url
  } catch (error: any) {
    throw new AppError(502, 'Unable to create download URL', 'STORAGE_ERROR', { reason: error.message })
  }
}

export async function checkStorage(): Promise<boolean> {
  try {
    // A simple ping to check if credentials are valid
    await cloudinary.api.ping()
    return true
  } catch (error) {
    return false
  }
}

/** @deprecated Use createSignedUrl */
export const signedUrl = createSignedUrl
/** @deprecated Use uploadFile */
export const upload = uploadFile
