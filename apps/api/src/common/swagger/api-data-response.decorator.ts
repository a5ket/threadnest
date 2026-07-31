import { applyDecorators, Type } from '@nestjs/common'
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger'

interface ApiDataResponseOptions {
  status: number
  description: string
  type: Type<unknown>
  isArray?: boolean
}

/**
 * Documents a response wrapped by the global ResponseInterceptor (`{ data: T }`),
 * without requiring a hand-written `{data: T}` wrapper DTO per endpoint.
 */
export function ApiDataResponse({ status, description, type, isArray = false }: ApiDataResponseOptions) {
  const dataSchema = isArray
    ? { type: 'array' as const, items: { $ref: getSchemaPath(type) } }
    : { $ref: getSchemaPath(type) }

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
