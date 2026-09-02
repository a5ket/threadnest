import { createMockStorageService } from 'test/factories/storage-service.mock-factory'
import { createNestAccessContext } from 'test/factories/nest-access-context.factory'
import { createNestDiscovery } from 'test/factories/nest-discovery.factory'
import { createNestSummary } from 'test/factories/nest-summary.factory'
import { ROLE_HIERARCHY } from './constants/nest-access-level'
import { NestPresenter } from './nest.presenter'

describe('NestPresenter', () => {
  const storage = createMockStorageService()
  const presenter = new NestPresenter(storage as any)

  describe('toDiscoveryView', () => {
    it('resolves the icon as a public URL when present', () => {
      const nest = createNestDiscovery({ iconKey: 'icons/nest-1/a.webp' })

      const view = presenter.toDiscoveryView(nest)

      expect(view.iconUrl).toBe('https://cdn.test/icons/nest-1/a.webp')
    })

    it('returns a null icon URL when there is none', () => {
      const nest = createNestDiscovery({ iconKey: null })

      const view = presenter.toDiscoveryView(nest)

      expect(view.iconUrl).toBeNull()
    })

    it('carries membership and pending-request flags through', () => {
      const nest = createNestDiscovery({ isMember: true, hasPendingJoinRequest: true })

      const view = presenter.toDiscoveryView(nest)

      expect(view.isMember).toBe(true)
      expect(view.hasPendingJoinRequest).toBe(true)
    })
  })

  describe('toSummaryView', () => {
    it('resolves the icon as a public URL when present', () => {
      const nest = createNestSummary({ iconKey: 'icons/nest-1/a.webp' })

      const view = presenter.toSummaryView(nest)

      expect(view.iconUrl).toBe('https://cdn.test/icons/nest-1/a.webp')
    })
  })

  describe('toDetailView', () => {
    it('always includes name, slug, access, and isDeleted', () => {
      const nest = createNestSummary({ name: 'Nest', slug: 'nest-slug', deletedAt: null })
      const ctx = createNestAccessContext({ canViewNestMetadata: false, canModerateContent: false })

      const view = presenter.toDetailView(nest, ctx)

      expect(view).toEqual({ name: 'Nest', slug: 'nest-slug', access: ctx, isDeleted: false })
    })

    it('reports isDeleted as true when the nest has a deletedAt', () => {
      const nest = createNestSummary({ deletedAt: new Date() })
      const ctx = createNestAccessContext({ canViewNestMetadata: false, canModerateContent: false })

      const view = presenter.toDetailView(nest, ctx)

      expect(view.isDeleted).toBe(true)
    })

    it('includes metadata fields only when the viewer can view nest metadata', () => {
      const nest = createNestSummary({ description: 'A nest', memberCount: 5, threadCount: 10 })
      const ctx = createNestAccessContext({ canViewNestMetadata: true, canModerateContent: false })

      const view = presenter.toDetailView(nest, ctx)

      expect(view).toMatchObject({ description: 'A nest', memberCount: 5, threadCount: 10 })
    })

    it('omits metadata fields entirely when the viewer cannot view nest metadata', () => {
      const nest = createNestSummary({ description: 'A nest' })
      const ctx = createNestAccessContext({ canViewNestMetadata: false, canModerateContent: false })

      const view = presenter.toDetailView(nest, ctx)

      expect(view).not.toHaveProperty('description')
      expect(view).not.toHaveProperty('memberCount')
      expect(view).not.toHaveProperty('iconUrl')
    })

    it('includes the role hierarchy only for moderators', () => {
      const nest = createNestSummary()
      const modView = presenter.toDetailView(nest, createNestAccessContext({ canModerateContent: true }))
      const memberView = presenter.toDetailView(nest, createNestAccessContext({ canModerateContent: false }))

      expect(modView).toMatchObject({ roles: ROLE_HIERARCHY })
      expect(memberView).not.toHaveProperty('roles')
    })
  })

  describe('toReferenceView', () => {
    it('resolves the icon as a public URL when present', () => {
      const view = presenter.toReferenceView({ name: 'Nest', slug: 'nest-slug', iconKey: 'icons/nest-1/a.webp' })

      expect(view).toEqual({ name: 'Nest', slug: 'nest-slug', iconUrl: 'https://cdn.test/icons/nest-1/a.webp' })
    })

    it('returns a null icon URL when there is none', () => {
      const view = presenter.toReferenceView({ name: 'Nest', slug: 'nest-slug', iconKey: null })

      expect(view.iconUrl).toBeNull()
    })
  })
})
