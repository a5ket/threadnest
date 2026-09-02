import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common'
import { map } from 'rxjs'

/**
 * Wraps every successful response body in `{ data: ... }`, so the API has one consistent success
 * envelope — a paginated endpoint's `meta` sits alongside `data` rather than needing its own
 * separate schema. Applied per-controller via `@UseInterceptors(ResponseInterceptor)`.
 */
@Injectable()
export class ResponseInterceptor implements NestInterceptor {
  intercept(_context: ExecutionContext, next: CallHandler) {
    return next.handle().pipe(map((response: unknown) => ({ data: response })))
  }
}
