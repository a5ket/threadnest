import { PlatformReportRepository } from 'src/platform/report/platform-report.repository'

export const createMockPlatformReportRepository = (): jest.Mocked<Pick<PlatformReportRepository,
  'targetExists' | 'create' | 'hasPendingReport' | 'list' | 'get' | 'updateStatus'
>> => ({
  targetExists: jest.fn(),
  create: jest.fn(),
  hasPendingReport: jest.fn(),
  list: jest.fn(),
  get: jest.fn(),
  updateStatus: jest.fn(),
})
