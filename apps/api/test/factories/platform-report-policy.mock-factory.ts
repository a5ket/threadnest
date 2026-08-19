import { PlatformReportPolicy } from 'src/platform/report/platform-report.policy'

export const createMockPlatformReportPolicy = (): jest.Mocked<Pick<PlatformReportPolicy, 'assertIsModerator' | 'assertCanReview'>> => ({
  assertIsModerator: jest.fn(),
  assertCanReview: jest.fn(),
})
