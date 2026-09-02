import { applyDecorators, HttpException, Type } from '@nestjs/common'
import { ApiExtraModels, DECORATORS, getSchemaPath } from '@nestjs/swagger'
import { FieldError } from './error-response.schema'

type ExceptionConstructor = Type<HttpException> & { new(): HttpException }

type ExceptionExample = {
  name: string
  code: string
  response: Record<string, unknown>
}

/**
 * `@nestjs/swagger`'s `@ApiResponse` concatenates repeated calls for the same status instead of
 * overwriting, so this decorator tracks its own de-duped state per route (keyed under this
 * symbol) and replaces each status entry itself rather than relying on `@ApiResponse` stacking.
 */
const EXCEPTION_RESPONSES_METADATA = Symbol('apiExceptionResponses')

/**
 * Documents every exception a route can throw as a proper OpenAPI response — one entry per
 * distinct HTTP status, with every exception sharing that status folded into a single response
 * whose `code` is an enum of all of them and whose `examples` show each one concretely. Each
 * exception's example body is derived by actually instantiating it and reading its real
 * `getResponse()`/`getStatus()`, so the documented shape can't drift out of sync with what the
 * exception class actually produces. Safe to call multiple times on the same route (e.g. once per
 * layer of a shared base method) — later calls merge into the existing per-status metadata rather
 * than overwriting it.
 *
 * @param exceptionTypes - The exception classes this route can throw, each with a no-arg
 * constructor so an example instance can be built without real failure data.
 * @returns The combined `@ApiExtraModels`/metadata decorator to apply to a route handler.
 */
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
