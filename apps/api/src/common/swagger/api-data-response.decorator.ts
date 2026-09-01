import { applyDecorators, Type } from '@nestjs/common'
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger'

interface ApiDataResponseOptions {
  status: number
  description: string
  type: Type<unknown>
  isArray?: boolean
  nullable?: boolean
}

// Documents ResponseInterceptor's `{ data: T }` wrap without a per-endpoint wrapper DTO.
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
