import crypto from 'node:crypto'
import type { JdUploadDto } from '../dto/index.js'
import { auditRepository, jdRepository, resumeRepository } from '../repositories/repository.js'
import { aiClient } from './ai-client.js'
import { createSignedUrl, uploadFile } from '../storage/cloudinary.js'
import { AppError } from '../utils/http.js'

export class ResumeService {
  async upload(userId: string, file: Express.Multer.File | undefined) {
    if (!file) throw new AppError(400, 'A PDF resume is required', 'UPLOAD_ERROR')

    await resumeRepository.deactivateOthers(userId)
    const storagePath = `resumes/${userId}/${crypto.randomUUID()}-${file.originalname}`
    await uploadFile(storagePath, file, userId)

    const [resume] = await resumeRepository.create({
      userId,
      fileName: file.originalname,
      fileSizeBytes: file.size,
      storagePath,
      isActive: true,
    })

    await auditRepository.create({
      userId,
      action: 'RESUME_UPLOAD',
      resourceType: 'resume',
      resourceId: resume.id,
    })

    // Best-effort analysis; never block upload on AI availability
    try {
      const signed = await createSignedUrl(storagePath)
      await aiClient.analyzeResume({
        resumeText: `Resume file: ${file.originalname}. Download: ${signed}`,
        userId,
      })
    } catch {
      // Upload remains successful even if AI analysis is unavailable
    }

    return {
      id: resume.id,
      fileName: resume.fileName,
      fileSizeBytes: resume.fileSizeBytes,
      isActive: resume.isActive,
      uploadedAt: resume.uploadedAt,
    }
  }

  async getById(id: string, userId: string) {
    const resume = await resumeRepository.findById(id, userId)
    if (!resume) throw new AppError(404, 'Resume not found', 'NOT_FOUND')
    return {
      ...resume,
      signedUrl: await createSignedUrl(resume.storagePath),
    }
  }
}

export class JobDescriptionService {
  async uploadPdf(
    userId: string,
    file: Express.Multer.File,
    meta: { title?: string; company?: string },
  ) {
    await jdRepository.deactivateOthers(userId)
    const storagePath = `job-descriptions/${userId}/${crypto.randomUUID()}-${file.originalname}`
    await uploadFile(storagePath, file, userId)

    const [jd] = await jdRepository.create({
      userId,
      title: meta.title,
      company: meta.company,
      fileName: file.originalname,
      storagePath,
      rawText: `Uploaded PDF: ${file.originalname}`,
      isActive: true,
    })

    await auditRepository.create({
      userId,
      action: 'JD_UPLOAD',
      resourceType: 'job_description',
      resourceId: jd.id,
    })

    return jd
  }

  async uploadText(userId: string, input: JdUploadDto) {
    await jdRepository.deactivateOthers(userId)
    const [jd] = await jdRepository.create({
      userId,
      title: input.title,
      company: input.company,
      rawText: input.rawText,
      isActive: true,
    })

    try {
      await aiClient.analyzeJd({ jdText: input.rawText, userId })
    } catch {
      // Text JD is still usable without AI analysis
    }

    await auditRepository.create({
      userId,
      action: 'JD_UPLOAD',
      resourceType: 'job_description',
      resourceId: jd.id,
    })

    return jd
  }

  async getById(id: string, userId: string) {
    const jd = await jdRepository.findById(id, userId)
    if (!jd) throw new AppError(404, 'Job description not found', 'NOT_FOUND')
    return jd
  }
}

export const resumeService = new ResumeService()
export const jdService = new JobDescriptionService()
