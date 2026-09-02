import { applyDecorators, Type } from '@nestjs/common'
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger'

interface ApiDataResponseOptions {
  status: number
  description: string
  type: Type<unknown>
  isArray?: boolean
  nullable?: boolean
}

/**
 * Documents the `{ data: T }` envelope every response gets wrapped in at runtime, without
 * needing a dedicated wrapper DTO class per endpoint.
 *
 * @param options - The response status/description, the wrapped type, and whether it's an array
 * or nullable.
 * @returns The combined `@ApiExtraModels`/`@ApiResponse` decorator to apply to a route handler.
 */
export function ApiDataResponse({ status, description, type, isArray = false, nullable = false }: ApiDataResponseOptions) {
  const refSchema = { $ref: getSchemaPath(type) }
  const dataSchema = isArray
    ? { type: 'array' as const, items: refSchema }
    : nullable
      ? { allOf: [refSchema], nullable: true }
      : refSchema

  return applyDecorators(
    ApiExtraModels(type),
    ApiResponse({
      status,
      description,
      schema: {
        type: 'object',
        properties: { data: dataSchema },
        required: ['data']
      }
    })
  )
}
