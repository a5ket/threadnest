import { NestJoinPolicy, NestMemberRole, NestVisibility } from 'generated/prisma/enums'
import { createMockNestBanRepository } from 'test/factories/nest-ban-repository.mock-factory'
import { createMockNestMemberRepository } from 'test/factories/nest-member-repository.mock-factory'
import { createNestMember } from 'test/factories/nest-member.factory'
import { createMockNestSettingsRepository } from 'test/factories/nest-settings-repository.mock-factory'
import { createNestSettings, NestSettingsRecord } from 'test/factories/nest-settings.factory'
import { NEST_ACCESS_LEVEL, NON_MEMBER_LEVEL } from './constants/nest-access-level'
import { NestNotFoundException } from './exceptions/nest-not-found.exception'
import { NestAccess } from './nest.access'
import { NestSettingsNotFoundException } from './settings/exceptions/nest-settings-not-found.exception'
import { NestAccessContext } from './types/nest.access-context'

describe('NestAccess', () => {
  const settingsRepo = createMockNestSettingsRepository()
  const bansRepo = createMockNestBanRepository()
  const membersRepo = createMockNestMemberRepository()
  const nestAccess = new NestAccess(settingsRepo as any, bansRepo as any, membersRepo as any)

  const givenSettings = (overrides: Parameters<typeof createNestSettings>[0] = {}) =>
    settingsRepo.get.mockResolvedValue(createNestSettings(overrides))

  const givenMember = (overrides: Parameters<typeof createNestMember>[0] = {}) =>
    membersRepo.findByUser.mockResolvedValue(createNestMember(overrides))

  const givenNonMember = () =>
    membersRepo.findByUser.mockResolvedValue(null)

  const givenBanned = (banned: boolean) =>
    bansRepo.existsActive.mockResolvedValue(banned)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('visibility', () => {
    it('allows viewing a public nest without membership', async () => {
      givenSettings({ visibility: NestVisibility.PUBLIC })
      givenNonMember()
      givenBanned(false)

      const ctx = await nestAccess.getContext('nest-1', 'user-1')

      expect(ctx.canViewNest).toBe(true)
      expect(ctx.isMember).toBe(false)
      expect(ctx.role).toBeNull()
      expect(ctx.level).toBe(NON_MEMBER_LEVEL)
    })

    it('hides a private nest from a non-member', async () => {
      givenSettings({ visibility: NestVisibility.PRIVATE })
      givenNonMember()
      givenBanned(false)

      const ctx = await nestAccess.getContext('nest-1', 'user-1')

      expect(ctx.canViewNest).toBe(false)
    })

    it('allows a member to view a private nest', async () => {
      givenSettings({ visibility: NestVisibility.PRIVATE })
      givenMember({ role: NestMemberRole.MEMBER })
      givenBanned(false)

      const ctx = await nestAccess.getContext('nest-1', 'user-1')

      expect(ctx.canViewNest).toBe(true)
    })
  })

  describe('membership status', () => {
    it('reports isMember, role, level, and isBanned for a plain member', async () => {
      givenSettings()
      givenMember({ role: NestMemberRole.MEMBER })
      givenBanned(false)

      const ctx = await nestAccess.getContext('nest-1', 'user-1')

      expect(ctx.isMember).toBe(true)
      expect(ctx.role).toBe(NestMemberRole.MEMBER)
      expect(ctx.level).toBe(NEST_ACCESS_LEVEL.MEMBER)
      expect(ctx.isBanned).toBe(false)
      expect(ctx.isOwner).toBe(false)
    })

    it('reports isOwner false for a moderator', async () => {
      givenSettings()
      givenMember({ role: NestMemberRole.MODERATOR })
      givenBanned(false)

      const ctx = await nestAccess.getContext('nest-1', 'user-1')

      expect(ctx.isOwner).toBe(false)
    })
  })

  describe('level-gated permissions', () => {
    // Each flag must read its own settings field — a copy-paste mix-up between two similarly-named min*Level fields wouldn't be caught by testing just one.
    const LEVEL_GATED_FLAGS: [keyof NestAccessContext, keyof NestSettingsRecord][] = [
      ['canCreateThread', 'minThreadCreationLevel'],
      ['canCreateComment', 'minCommentCreationLevel'],
      ['canVoteThread', 'minThreadVoteLevel'],
      ['canVoteComment', 'minCommentVoteLevel'],
      ['canEditNest', 'minNestEditLevel'],
      ['canManageThreadLock', 'minThreadLockManageLevel'],
      ['canManageThreadPin', 'minThreadPinManageLevel'],
      ['canManageCommentPin', 'minCommentPinManageLevel'],
      ['canModerateContent', 'minContentModerateLevel'],
      ['canViewMembers', 'minMemberViewLevel'],
      ['canManageInvites', 'minInviteManageLevel'],
      ['canRemoveMembers', 'minMemberRemoveLevel'],
      ['canManageJoinRequests', 'minJoinRequestManageLevel'],
      ['canManageBans', 'minBanManageLevel'],
    ]

    it.each(LEVEL_GATED_FLAGS)('gates %s on settings.%s', async (flag, settingsField) => {
      givenSettings({ [settingsField]: NEST_ACCESS_LEVEL.MODERATOR })
      givenBanned(false)

      givenMember({ role: NestMemberRole.MEMBER })
      const belowThreshold = await nestAccess.getContext('nest-1', 'user-1')
      expect(belowThreshold[flag]).toBe(false)

      givenMember({ role: NestMemberRole.MODERATOR })
      const atThreshold = await nestAccess.getContext('nest-1', 'user-1')
      expect(atThreshold[flag]).toBe(true)
    })
  })

  describe('bans', () => {
    it('blocks a banned member from level-gated actions even if their role would otherwise qualify', async () => {
      givenSettings({ minThreadCreationLevel: NEST_ACCESS_LEVEL.MEMBER })
      givenMember({ role: NestMemberRole.MEMBER })
      givenBanned(true)

      const ctx = await nestAccess.getContext('nest-1', 'user-1')

      expect(ctx.isBanned).toBe(true)
      expect(ctx.canCreateThread).toBe(false)
    })

    it('does not block viewing for a banned member — only participating', async () => {
      givenSettings({ visibility: NestVisibility.PRIVATE, minThreadCreationLevel: NEST_ACCESS_LEVEL.MEMBER })
      givenMember({ role: NestMemberRole.MEMBER })
      givenBanned(true)

      const ctx = await nestAccess.getContext('nest-1', 'user-1')

      expect(ctx.canViewNest).toBe(true)
      expect(ctx.canCreateThread).toBe(false)
    })

    it('does not gate owner-only actions on ban status', async () => {
      givenSettings()
      givenMember({ role: NestMemberRole.OWNER })
      givenBanned(true)

      const ctx = await nestAccess.getContext('nest-1', 'user-1')

      expect(ctx.canManageSettings).toBe(true)
      expect(ctx.canDeleteNest).toBe(true)
      expect(ctx.canTransferOwnership).toBe(true)
      expect(ctx.canManageMemberRoles).toBe(true)
    })
  })

  describe('owner-only and membership permissions', () => {
    it('grants owner-only actions only to the owner', async () => {
      givenSettings()
      givenMember({ role: NestMemberRole.MODERATOR })
      givenBanned(false)

      const ctx = await nestAccess.getContext('nest-1', 'user-1')

      expect(ctx.canManageSettings).toBe(false)
      expect(ctx.canDeleteNest).toBe(false)
      expect(ctx.canTransferOwnership).toBe(false)
      expect(ctx.canManageMemberRoles).toBe(false)
    })

    it('lets a non-owner member leave the nest', async () => {
      givenSettings()
      givenMember({ role: NestMemberRole.MEMBER })
      givenBanned(false)

      const ctx = await nestAccess.getContext('nest-1', 'user-1')

      expect(ctx.canLeaveNest).toBe(true)
    })

    it('does not let the owner leave the nest', async () => {
      givenSettings()
      givenMember({ role: NestMemberRole.OWNER })
      givenBanned(false)

      const ctx = await nestAccess.getContext('nest-1', 'user-1')

      expect(ctx.canLeaveNest).toBe(false)
    })

    it('does not let a non-member leave the nest', async () => {
      givenSettings()
      givenNonMember()
      givenBanned(false)

      const ctx = await nestAccess.getContext('nest-1', 'user-1')

      expect(ctx.canLeaveNest).toBe(false)
    })
  })

  describe('context fields', () => {
    it('reports role, level, and isOwner for an owner', async () => {
      givenSettings()
      givenMember({ role: NestMemberRole.OWNER })
      givenBanned(false)

      const ctx = await nestAccess.getContext('nest-1', 'user-1')

      expect(ctx.role).toBe(NestMemberRole.OWNER)
      expect(ctx.level).toBe(NEST_ACCESS_LEVEL.OWNER)
      expect(ctx.isOwner).toBe(true)
    })

    it.each([
      [NestVisibility.PUBLIC, NestJoinPolicy.OPEN],
      [NestVisibility.PRIVATE, NestJoinPolicy.BY_REQUEST],
      [NestVisibility.PUBLIC, NestJoinPolicy.BY_INVITE],
    ])('passes visibility %s and joinPolicy %s through from settings', async (visibility, joinPolicy) => {
      givenSettings({ visibility, joinPolicy })
      givenMember({ role: NestMemberRole.MEMBER })
      givenBanned(false)

      const ctx = await nestAccess.getContext('nest-1', 'user-1')

      expect(ctx.visibility).toBe(visibility)
      expect(ctx.joinPolicy).toBe(joinPolicy)
    })
  })

  describe('anonymous viewers', () => {
    it('resolves a non-member context without looking up membership or bans', async () => {
      givenSettings({ visibility: NestVisibility.PUBLIC })

      const ctx = await nestAccess.getContext('nest-1')

      expect(membersRepo.findByUser).not.toHaveBeenCalled()
      expect(bansRepo.existsActive).not.toHaveBeenCalled()
      expect(ctx.isMember).toBe(false)
      expect(ctx.isBanned).toBe(false)
      expect(ctx.role).toBeNull()
    })
  })

  describe('nest not found', () => {
    it('normalizes a missing settings row to NestNotFoundException', async () => {
      settingsRepo.get.mockRejectedValue(new NestSettingsNotFoundException())
      givenNonMember()
      givenBanned(false)

      await expect(nestAccess.getContext('missing-nest')).rejects.toThrow(NestNotFoundException)
    })

    it('propagates unrelated errors from the settings lookup unchanged', async () => {
      const error = new Error('db down')
      settingsRepo.get.mockRejectedValue(error)
      givenNonMember()
      givenBanned(false)

      await expect(nestAccess.getContext('nest-1')).rejects.toThrow(error)
    })
  })
})
