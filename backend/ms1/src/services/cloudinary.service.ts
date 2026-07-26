import { v2 as cloudinary } from 'cloudinary'
import streamifier from 'streamifier'
import { env } from '../config/env.js'

// Cloudinary will automatically pick up the CLOUDINARY_URL from env if available.
if (env.CLOUDINARY_URL) {
  cloudinary.config({
    secure: true,
  })
}

/**
 * Uploads a file buffer to Cloudinary.
 * @param fileBuffer The file buffer from multer.
 * @param folder The target folder in Cloudinary.
 * @returns A promise resolving to the Cloudinary UploadApiResponse.
 */
export const uploadToCloudinary = (
  fileBuffer: Buffer,
  folder: string = 'avatars',
): Promise<any> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        tags: ['lumify-avatar-30d'], // Tag added so you can configure auto-delete in Cloudinary based on this tag
      },
      (error, result) => {
        if (error) return reject(error)
        resolve(result)
      },
    )

    streamifier.createReadStream(fileBuffer).pipe(uploadStream)
  })
}
