import { PlatformReportReason, PlatformReportStatus, PlatformReportTargetType } from 'generated/prisma/enums'
import { UserPresenter } from 'src/user/user.presenter'
import { createPlatformReportSummary } from 'test/factories/platform-report-summary.factory'
import { PlatformReportPresenter } from './platform-report.presenter'

describe('PlatformReportPresenter', () => {
  const presenter = new PlatformReportPresenter(new UserPresenter())

  const baseReport = createPlatformReportSummary

  it('maps reporter through the user presenter', () => {
    const view = presenter.toSummaryView(baseReport())

    expect(view.reporter).toEqual({ id: 'reporter-1', username: 'reporter', displayName: null, avatarUrl: null })
  })

  it('maps a nest target and leaves the others null', () => {
    const view = presenter.toSummaryView(baseReport({
      targetType: PlatformReportTargetType.NEST,
      nest: { id: 'nest-1', slug: 'nest-slug', name: 'Nest name' },
      thread: null,
    }))

    expect(view.nest).toEqual({ id: 'nest-1', slug: 'nest-slug', name: 'Nest name' })
    expect(view.thread).toBeNull()
    expect(view.targetUser).toBeNull()
    expect(view.comment).toBeNull()
  })

  it('maps a user target through the user presenter and leaves the others null', () => {
    const view = presenter.toSummaryView(baseReport({
      targetType: PlatformReportTargetType.USER,
      targetUser: { id: 'target-1', profile: { username: 'target', displayName: null, avatarUrl: null } },
      thread: null,
    }))

    expect(view.targetUser).toEqual({ id: 'target-1', username: 'target', displayName: null, avatarUrl: null })
    expect(view.nest).toBeNull()
    expect(view.thread).toBeNull()
    expect(view.comment).toBeNull()
  })

  it('maps a thread target and leaves comment null', () => {
    const view = presenter.toSummaryView(baseReport({
      targetType: PlatformReportTargetType.THREAD,
      thread: { id: 'thread-1', slug: 'thread-slug', title: 'Thread title' },
      comment: null,
    }))

    expect(view.thread).toEqual({ id: 'thread-1', slug: 'thread-slug', title: 'Thread title' })
    expect(view.comment).toBeNull()
  })

  it('maps a comment target (including its parent thread) and leaves thread null', () => {
    const view = presenter.toSummaryView(baseReport({
      targetType: PlatformReportTargetType.COMMENT,
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
    const view = presenter.toSummaryView(baseReport({ status: PlatformReportStatus.PENDING, resolvedBy: null, resolvedAt: null }))

    expect(view.resolvedBy).toBeNull()
    expect(view.resolvedAt).toBeNull()
  })

  it('maps resolvedBy through the user presenter once the report has been reviewed', () => {
    const view = presenter.toSummaryView(baseReport({
      status: PlatformReportStatus.RESOLVED,
      resolvedAt: new Date('2024-01-02T00:00:00.000Z'),
      resolvedBy: { id: 'mod-1', profile: { username: 'mod', displayName: 'Mod', avatarUrl: null } },
    }))

    expect(view.resolvedBy).toEqual({ id: 'mod-1', username: 'mod', displayName: 'Mod', avatarUrl: null })
    expect(view.resolvedAt).toEqual(new Date('2024-01-02T00:00:00.000Z'))
  })

  it('passes reason, status and details through unchanged', () => {
    const view = presenter.toSummaryView(baseReport({ reason: PlatformReportReason.HARASSMENT, status: PlatformReportStatus.DISMISSED, details: 'not cool' }))

    expect(view.reason).toBe(PlatformReportReason.HARASSMENT)
    expect(view.status).toBe(PlatformReportStatus.DISMISSED)
    expect(view.details).toBe('not cool')
  })
})
