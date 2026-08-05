import { applyDecorators, Type } from '@nestjs/common'
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger'

interface ApiDataResponseOptions {
  status: number
  description: string
  type: Type<unknown>
  isArray?: boolean
}

// Documents ResponseInterceptor's `{ data: T }` wrap without a per-endpoint wrapper DTO.
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
