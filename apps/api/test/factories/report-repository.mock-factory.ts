import { ReportRepository } from 'src/report/report.repository'

export const createMockReportRepository = (): jest.Mocked<Pick<ReportRepository,
  'createForThread' | 'createForComment' | 'hasPendingReportForThread' | 'hasPendingReportForComment' | 'listByNest' | 'get' | 'updateStatus'
>> => ({
  createForThread: jest.fn(),
  createForComment: jest.fn(),
  hasPendingReportForThread: jest.fn(),
  hasPendingReportForComment: jest.fn(),
  listByNest: jest.fn(),
  get: jest.fn(),
  updateStatus: jest.fn(),
})
