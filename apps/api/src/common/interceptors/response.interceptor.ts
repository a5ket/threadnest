import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { map } from 'rxjs'

type PaginatedResponse = { data: unknown; pagination: unknown }

@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(
      map((response: unknown) => {
        if (this.isPaginated(response)) {
          return { data: response.data, pagination: response.pagination }
        }

        return { data: response }
      })
    )
  }

  private isPaginated(response: unknown): response is PaginatedResponse {
    return (
      typeof response === 'object' &&
      response !== null &&
      'pagination' in response &&
      (response as PaginatedResponse).pagination !== undefined
    )
  }
}
