import { ReportReason, ReportStatus, ReportTargetType } from 'generated/prisma/enums'
import { UserPresenter } from 'src/user/user.presenter'
import { ReportPresenter } from './report.presenter'
import { ReportSummary } from './types/report.summary'

describe('ReportPresenter', () => {
  const presenter = new ReportPresenter(new UserPresenter())

  const baseReport = (overrides: Partial<ReportSummary> = {}): ReportSummary => ({
    id: 'report-1',
    targetType: ReportTargetType.THREAD,
    reason: ReportReason.SPAM,
    details: null,
    status: ReportStatus.PENDING,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    resolvedAt: null,
    reporter: { id: 'reporter-1', profile: { username: 'reporter', displayName: null, avatarUrl: null } },
    resolvedBy: null,
    thread: { id: 'thread-1', slug: 'thread-slug', title: 'Thread title' },
    comment: null,
    ...overrides,
  })

  it('maps reporter through the user presenter', () => {
    const view = presenter.toSummaryView(baseReport())

    expect(view.reporter).toEqual({ id: 'reporter-1', username: 'reporter', displayName: null, avatarUrl: null })
  })

  it('maps a thread target and leaves comment null', () => {
    const view = presenter.toSummaryView(baseReport({
      targetType: ReportTargetType.THREAD,
      thread: { id: 'thread-1', slug: 'thread-slug', title: 'Thread title' },
      comment: null,
    }))

    expect(view.thread).toEqual({ id: 'thread-1', slug: 'thread-slug', title: 'Thread title' })
    expect(view.comment).toBeNull()
  })

  it('maps a comment target (including its parent thread) and leaves thread null', () => {
    const view = presenter.toSummaryView(baseReport({
      targetType: ReportTargetType.COMMENT,
      thread: null,
      comment: { id: 'comment-1', content: 'hello', thread: { slug: 'thread-slug', title: 'Thread title' } },
    }))

    expect(view.thread).toBeNull()
    expect(view.comment).toEqual({
      id: 'comment-1',
      content: 'hello',
      threadSlug: 'thread-slug',
      threadTitle: 'Thread title',
    })
  })

  it('leaves resolvedBy null when the report is still pending', () => {
    const view = presenter.toSummaryView(baseReport({ status: ReportStatus.PENDING, resolvedBy: null, resolvedAt: null }))

    expect(view.resolvedBy).toBeNull()
    expect(view.resolvedAt).toBeNull()
  })

  it('maps resolvedBy through the user presenter once the report has been reviewed', () => {
    const view = presenter.toSummaryView(baseReport({
      status: ReportStatus.RESOLVED,
      resolvedAt: new Date('2024-01-02T00:00:00.000Z'),
      resolvedBy: { id: 'mod-1', profile: { username: 'mod', displayName: 'Mod', avatarUrl: null } },
    }))

    expect(view.resolvedBy).toEqual({ id: 'mod-1', username: 'mod', displayName: 'Mod', avatarUrl: null })
    expect(view.resolvedAt).toEqual(new Date('2024-01-02T00:00:00.000Z'))
  })

  it('passes reason, status and details through unchanged', () => {
    const view = presenter.toSummaryView(baseReport({ reason: ReportReason.HARASSMENT, status: ReportStatus.DISMISSED, details: 'not cool' }))

    expect(view.reason).toBe(ReportReason.HARASSMENT)
    expect(view.status).toBe(ReportStatus.DISMISSED)
    expect(view.details).toBe('not cool')
  })
})
