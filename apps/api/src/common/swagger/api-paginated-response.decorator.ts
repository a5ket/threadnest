import { applyDecorators, Type } from '@nestjs/common'
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger'
import { PaginationDto } from './pagination.dto'

interface ApiPaginatedResponseOptions {
  status: number
  description: string
  type: Type<unknown>
  metaType?: Type<unknown>
}

// Documents ResponseInterceptor's wrap of a paginated result: `{ data: { items: T[], meta } }`.
export function ApiPaginatedResponse({ status, description, type, metaType = PaginationDto }: ApiPaginatedResponseOptions) {
  return applyDecorators(
    ApiExtraModels(type, metaType),
    ApiResponse({
      status,
      description,
      schema: {
        type: 'object',
        properties: {
          data: {
            type: 'object',
            properties: {
              items: { type: 'array', items: { $ref: getSchemaPath(type) } },
              meta: { $ref: getSchemaPath(metaType) }
            },
            required: ['items', 'meta']
          }
        },
        required: ['data']
      }
    })
  )
}
