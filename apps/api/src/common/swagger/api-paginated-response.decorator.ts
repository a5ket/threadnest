import { applyDecorators, Type } from '@nestjs/common'
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger'
import { PaginationDto } from './pagination.dto'

interface ApiPaginatedResponseOptions {
  status: number
  description: string
  type: Type<unknown>
  metaType?: Type<unknown>
}

/**
 * Documents the shape a cursor-paginated endpoint's response actually takes at runtime:
 * `{ data: { items: T[], meta } }`.
 *
 * @param options - The response status/description, the item type, and an optional `metaType`
 * override for listings whose pagination metadata isn't the default {@link PaginationDto} shape.
 * @returns The combined `@ApiExtraModels`/`@ApiResponse` decorator to apply to a route handler.
 */
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
