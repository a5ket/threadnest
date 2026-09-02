import { ExecutionContext } from '@nestjs/common'

export const createExecutionContext = (request: Record<string, unknown>): ExecutionContext => ({
  switchToHttp: () => ({
    getRequest: () => request,
    getResponse: () => ({}),
    getNext: () => undefined,
  }),
}) as unknown as ExecutionContext
