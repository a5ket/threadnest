import { applyDecorators, HttpException, Type } from '@nestjs/common'
import { ApiExtraModels, ApiResponse, getSchemaPath } from '@nestjs/swagger'
import { ErrorResponse } from './error-response.schema'

type ExceptionConstructor = Type<HttpException> & { new(): HttpException }

type ExceptionExample = {
  name: string
  code: string
  response: Record<string, unknown>
}

export function ApiExceptionResponses(...exceptionTypes: ExceptionConstructor[]) {
  const responses = new Map<number, ExceptionExample[]>()

  for (const ExceptionType of exceptionTypes) {
    const exception = new ExceptionType()
    const body = exception.getResponse()
    const response = typeof body === 'object' && body !== null
      ? body as Record<string, unknown>
      : { message: body }
    const code = typeof response.code === 'string' ? response.code : ExceptionType.name
    const examples = responses.get(exception.getStatus()) ?? []

    examples.push({ name: ExceptionType.name, code, response })
    responses.set(exception.getStatus(), examples)
  }

  return applyDecorators(
    ApiExtraModels(ErrorResponse),
    ...Array.from(responses, ([status, examples]) => ApiResponse({
      status,
      description: examples.map((example) => String(example.response.message)).join(' | '),
      content: {
        'application/json': {
          schema: { $ref: getSchemaPath(ErrorResponse) },
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
    }))
  )
}
