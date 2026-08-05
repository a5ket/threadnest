import { applyDecorators, Type } from '@nestjs/common'
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger'
import { PaginationDto } from './pagination.dto'

interface ApiPaginatedResponseOptions {
  status: number
  description: string
  type: Type<unknown>
}

// Documents ResponseInterceptor's paginated wrap: `{ data: T[], pagination: PaginationDto }`.
export function ApiPaginatedResponse({ status, description, type }: ApiPaginatedResponseOptions) {
  return applyDecorators(
    ApiExtraModels(type, PaginationDto),
    ApiResponse({
      status,
      description,
      schema: {
        type: 'object',
        properties: {
          data: { type: 'array', items: { $ref: getSchemaPath(type) } },
          pagination: { $ref: getSchemaPath(PaginationDto) }
        },
        required: ['data', 'pagination']
      }
    })
  )
}
