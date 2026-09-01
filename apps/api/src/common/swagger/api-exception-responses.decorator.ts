import { applyDecorators, HttpException, Type } from '@nestjs/common'
import { ApiExtraModels, DECORATORS, getSchemaPath } from '@nestjs/swagger'
import { FieldError } from './error-response.schema'

type ExceptionConstructor = Type<HttpException> & { new(): HttpException }

type ExceptionExample = {
  name: string
  code: string
  response: Record<string, unknown>
}

// @nestjs/swagger's @ApiResponse concatenates repeated calls for the same status instead of
// overwriting, so we track de-duped state per route and replace each status entry ourselves.
const EXCEPTION_RESPONSES_METADATA = Symbol('apiExceptionResponses')

export function ApiExceptionResponses(...exceptionTypes: ExceptionConstructor[]) {
  return (target: object, key?: string | symbol, descriptor?: PropertyDescriptor) => {
    const container = (descriptor?.value ?? target) as object
    const responses: Map<number, Map<string, ExceptionExample>> = (Reflect.getMetadata(EXCEPTION_RESPONSES_METADATA, container) as Map<number, Map<string, ExceptionExample>> | undefined) ?? new Map<number, Map<string, ExceptionExample>>()

    for (const ExceptionType of exceptionTypes) {
      const exception = new ExceptionType()
      const body = exception.getResponse()
      const response = typeof body === 'object' && body !== null
        ? body as Record<string, unknown>
        : { message: body }
      const code = typeof response.code === 'string' ? response.code : ExceptionType.name
      const status = exception.getStatus()

      const examplesByCode = responses.get(status) ?? new Map<string, ExceptionExample>()
      examplesByCode.set(code, { name: ExceptionType.name, code, response })
      responses.set(status, examplesByCode)
    }

    Reflect.defineMetadata(EXCEPTION_RESPONSES_METADATA, responses, container)

    const existingApiResponses = Reflect.getMetadata(DECORATORS.API_RESPONSE, container) as Record<string, unknown> | undefined
    const apiResponses: Record<string, unknown> = { ...existingApiResponses }

    for (const [status, examplesByCode] of responses) {
      const examples = Array.from(examplesByCode.values())

      apiResponses[status] = {
        description: examples.map((example) => String(example.response.message)).join(' | '),
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                error: {
                  type: 'object',
                  properties: {
                    status: { type: 'number', example: status },
                    code: { type: 'string', enum: examples.map((example) => example.code) },
                    message: { type: 'string' },
                    fields: { type: 'array', items: { $ref: getSchemaPath(FieldError) } }
                  },
                  required: ['status', 'code', 'message']
                }
              },
              required: ['error']
            },
            examples: Object.fromEntries(examples.map((example) => [
              example.code,
              {
                summary: example.name,
                value: {
                  error: {
                    status,
                    ...example.response
                  }
                }
              }
            ]))
          }
        }
      }
    }

    Reflect.defineMetadata(DECORATORS.API_RESPONSE, apiResponses, container)

    return applyDecorators(ApiExtraModels(FieldError))(target, key, descriptor)
  }
}
