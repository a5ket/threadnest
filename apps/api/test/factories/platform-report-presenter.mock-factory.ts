import { PlatformReportPresenter } from 'src/platform/report/platform-report.presenter'

export const createMockPlatformReportPresenter = (): jest.Mocked<Pick<PlatformReportPresenter, 'toSummaryView'>> => ({
  toSummaryView: jest.fn(),
})
