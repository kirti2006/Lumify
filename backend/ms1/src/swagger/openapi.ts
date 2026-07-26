export const openApiDocument = {
  openapi: '3.0.3',
  info: {
    title: 'Lumify MS-1 Business API',
    version: '1.0.0',
    description: 'Business microservice API gateway for Lumify. No AI logic lives in this service.',
  },
  servers: [{ url: '/api/v1', description: 'Version 1' }],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      SuccessResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          message: { type: 'string' },
          data: { type: 'object' },
          meta: { type: 'object' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          message: { type: 'string' },
          error: {
            type: 'object',
            properties: {
              code: { type: 'string' },
              details: { type: 'object' },
            },
          },
        },
      },
      SignupRequest: {
        type: 'object',
        required: ['fullName', 'email', 'password'],
        properties: {
          fullName: { type: 'string' },
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
          targetRole: { type: 'string' },
          experienceLevel: { type: 'string', enum: ['fresher', 'junior', 'mid', 'senior'] },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: { type: 'string', format: 'email' },
          password: { type: 'string' },
        },
      },
      CreateInterviewRequest: {
        type: 'object',
        required: ['interviewType', 'experienceLevel'],
        properties: {
          resumeId: { type: 'string', format: 'uuid' },
          jdId: { type: 'string', format: 'uuid' },
          company: { type: 'string' },
          role: { type: 'string' },
          interviewType: { type: 'string', enum: ['technical', 'behavioral', 'hr', 'mixed'] },
          experienceLevel: { type: 'string', enum: ['fresher', 'junior', 'mid', 'senior'] },
          scheduledAt: { type: 'string', format: 'date-time' },
          totalQuestions: { type: 'integer', minimum: 1, maximum: 30 },
        },
      },
    },
  },
  paths: {
    '/health': {
      get: {
        tags: ['Health'],
        summary: 'Service health check',
        responses: { 200: { description: 'Healthy' }, 503: { description: 'Degraded' } },
      },
    },
    '/auth/signup': {
      post: {
        tags: ['Auth'],
        summary: 'Register a candidate account',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/SignupRequest' } } },
        },
        responses: { 201: { description: 'Created' }, 409: { description: 'Email exists' } },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Auth'],
        summary: 'Login and issue JWT',
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginRequest' } } },
        },
        responses: { 200: { description: 'OK' }, 401: { description: 'Invalid credentials' } },
      },
    },
    '/auth/refresh': {
      post: {
        tags: ['Auth'],
        summary: 'Rotate access token using refresh cookie',
        responses: { 200: { description: 'OK' }, 401: { description: 'Unauthorized' } },
      },
    },
    '/auth/logout': {
      post: {
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        summary: 'Invalidate refresh session',
        responses: { 204: { description: 'No Content' } },
      },
    },
    '/auth/profile': {
      get: {
        tags: ['Auth'],
        security: [{ bearerAuth: [] }],
        summary: 'Get current user profile',
        responses: { 200: { description: 'OK' } },
      },
    },
    '/users': {
      get: {
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        summary: 'List users (admin)',
        responses: { 200: { description: 'OK' }, 403: { description: 'Forbidden' } },
      },
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        summary: 'Get user by id',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'OK' }, 403: { description: 'Forbidden' }, 404: { description: 'Not found' } },
      },
      patch: {
        tags: ['Users'],
        security: [{ bearerAuth: [] }],
        summary: 'Update user profile',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/interviews': {
      get: {
        tags: ['Interviews'],
        security: [{ bearerAuth: [] }],
        summary: 'List interviews',
        responses: { 200: { description: 'OK' } },
      },
      post: {
        tags: ['Interviews'],
        security: [{ bearerAuth: [] }],
        summary: 'Schedule interview',
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CreateInterviewRequest' } },
          },
        },
        responses: { 201: { description: 'Created' } },
      },
    },
    '/interviews/{id}': {
      get: {
        tags: ['Interviews'],
        security: [{ bearerAuth: [] }],
        summary: 'Get interview details',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'OK' }, 404: { description: 'Not found' } },
      },
      patch: {
        tags: ['Interviews'],
        security: [{ bearerAuth: [] }],
        summary: 'Update or cancel interview',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'OK' } },
      },
      delete: {
        tags: ['Interviews'],
        security: [{ bearerAuth: [] }],
        summary: 'Delete scheduled interview',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 204: { description: 'No Content' }, 422: { description: 'Invalid state' } },
      },
    },
    '/interviews/{id}/start': {
      post: {
        tags: ['Interviews'],
        security: [{ bearerAuth: [] }],
        summary: 'Start interview session and fetch first question',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/interviews/{id}/finish': {
      post: {
        tags: ['Interviews'],
        security: [{ bearerAuth: [] }],
        summary: 'Finish interview and generate report',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/sessions/{sessionId}/answer': {
      post: {
        tags: ['Interviews'],
        security: [{ bearerAuth: [] }],
        summary: 'Submit audio answer for current question',
        parameters: [
          { name: 'sessionId', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } },
        ],
        requestBody: {
          required: true,
          content: {
            'multipart/form-data': {
              schema: {
                type: 'object',
                required: ['audio', 'questionId'],
                properties: {
                  audio: { type: 'string', format: 'binary' },
                  questionId: { type: 'string', format: 'uuid' },
                  responseDurationS: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: { 200: { description: 'OK' } },
      },
    },
    '/resume/upload': {
      post: {
        tags: ['Resume'],
        security: [{ bearerAuth: [] }],
        summary: 'Upload resume PDF',
        responses: { 201: { description: 'Created' } },
      },
    },
    '/resume/{id}': {
      get: {
        tags: ['Resume'],
        security: [{ bearerAuth: [] }],
        summary: 'Get resume with signed URL',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/jd/upload': {
      post: {
        tags: ['Job Description'],
        security: [{ bearerAuth: [] }],
        summary: 'Upload JD PDF or save pasted text',
        responses: { 201: { description: 'Created' } },
      },
    },
    '/jd/{id}': {
      get: {
        tags: ['Job Description'],
        security: [{ bearerAuth: [] }],
        summary: 'Get job description',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/reports': {
      get: {
        tags: ['Reports'],
        security: [{ bearerAuth: [] }],
        summary: 'List feedback reports',
        responses: { 200: { description: 'OK' } },
      },
    },
    '/reports/{id}': {
      get: {
        tags: ['Reports'],
        security: [{ bearerAuth: [] }],
        summary: 'Get feedback report',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'OK' } },
      },
    },
    '/analytics/dashboard': {
      get: {
        tags: ['Analytics'],
        security: [{ bearerAuth: [] }],
        summary: 'Dashboard analytics',
        responses: { 200: { description: 'OK' } },
      },
    },
    '/analytics/trends': {
      get: {
        tags: ['Analytics'],
        security: [{ bearerAuth: [] }],
        summary: 'Interview trends',
        responses: { 200: { description: 'OK' } },
      },
    },
    '/analytics/performance': {
      get: {
        tags: ['Analytics'],
        security: [{ bearerAuth: [] }],
        summary: 'Topic performance',
        responses: { 200: { description: 'OK' } },
      },
    },
    '/analytics/skill-growth': {
      get: {
        tags: ['Analytics'],
        security: [{ bearerAuth: [] }],
        summary: 'Skill growth over time',
        responses: { 200: { description: 'OK' } },
      },
    },
    '/notifications': {
      get: {
        tags: ['Notifications'],
        security: [{ bearerAuth: [] }],
        summary: 'List notifications',
        responses: { 200: { description: 'OK' } },
      },
    },
    '/notifications/read-all': {
      patch: {
        tags: ['Notifications'],
        security: [{ bearerAuth: [] }],
        summary: 'Mark all notifications read',
        responses: { 200: { description: 'OK' } },
      },
    },
    '/notifications/{id}/read': {
      patch: {
        tags: ['Notifications'],
        security: [{ bearerAuth: [] }],
        summary: 'Mark notification read',
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string', format: 'uuid' } }],
        responses: { 200: { description: 'OK' } },
      },
    },
  },
} as const
