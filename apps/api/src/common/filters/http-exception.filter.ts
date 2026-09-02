import { ArgumentsHost, Catch, ExceptionFilter, HttpException, Injectable } from '@nestjs/common'
import { Request, Response } from 'express'
import { PinoLogger } from 'nestjs-pino'

const INTERNAL_SERVER_ERROR_CODE = 'INTERNAL_SERVER_ERROR'

/**
 * Global exception filter — normalizes every error response (thrown `HttpException` or anything
 * else) into the API's uniform `{ error: { status, code, message, ...extra } }` shape, and logs
 * every 5xx as an unhandled exception worth investigating.
 */
@Injectable()
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(HttpExceptionFilter.name)
  }

  /**
   * @param exception - The thrown value — a domain `HttpException` in the normal case, but
   * `unknown` since JavaScript allows throwing anything.
   * @param host - Nest's request context, used to reach the underlying Express response.
   * @returns The Express response, with the normalized error body written and sent.
   */
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp()
    const response = ctx.getResponse<Response>()

    if (exception instanceof HttpException) {
      const status = exception.getStatus()
      const body = exception.getResponse()

      if (status >= 500) {
        this.logger.error({ err: exception }, 'Unhandled exception')
      }

      if (typeof body !== 'object' || body === null) {
        return response.status(status).json({
          error: { status, code: undefined, message: body }
        })
      }

      // Any field beyond code/message (e.g. ValidationException's `fields`,
      // UserSuspendedException's `reason`) passes through as-is.
      const { code, message, ...extra } = body as Record<string, unknown>

      return response.status(status).json({
        error: { status, code, message, ...extra }
      })
    }

    this.logger.error({ err: exception }, 'Unhandled exception')

    const status = 500
    const code = INTERNAL_SERVER_ERROR_CODE
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
