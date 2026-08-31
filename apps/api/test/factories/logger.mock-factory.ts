import { PinoLogger } from 'nestjs-pino'

export const createMockLogger = (): jest.Mocked<Pick<PinoLogger, 'setContext' | 'info' | 'warn' | 'error' | 'debug'>> => ({
  setContext: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  debug: jest.fn(),
})
