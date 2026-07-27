import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common'
import { Request, Response } from 'express'

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const body = exception.getResponse()

      const code = typeof body === 'object' && body !== null && 'code' in body
        ? (body as Record<string, unknown>).code
        : undefined

      const message = typeof body === 'string'
        ? body
        : typeof body === 'object' && body !== null && 'message' in body
          ? (body as Record<string, unknown>).message
          : undefined

      const fields = typeof body === 'object' && body !== null && 'fields' in body
        ? (body as Record<string, unknown>).fields
        : undefined

      return response.status(status).json({
        error: {
          status,
          code,
          message,
          ...(fields !== undefined ? { fields } : {}),
        }
      })
    }

    const status = 500
    const code = 'INTERNAL_SERVER_ERROR'
    const message = exception instanceof Error ? exception.message : 'Internal server error'

    return response.status(status).json({
      error: {
        status,
        code,
        message,
      }
    })
  }
}
