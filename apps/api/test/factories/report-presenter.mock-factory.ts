import { ReportPresenter } from 'src/report/report.presenter'

export const createMockReportPresenter = (): jest.Mocked<Pick<ReportPresenter, 'toSummaryView'>> => ({
  toSummaryView: jest.fn(),
})
