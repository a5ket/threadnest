import { PlatformRole } from 'generated/prisma/enums'
import { createMockPlatformRoleGrantRepository } from 'test/factories/platform-role-grant-repository.mock-factory'
import { PlatformAccess } from './platform.access'

describe('PlatformAccess', () => {
  const grantsRepo = createMockPlatformRoleGrantRepository()
  const access = new PlatformAccess(grantsRepo as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('gives an anonymous viewer level 0 and no authority, without querying for a grant', async () => {
    const ctx = await access.getContext(undefined)

    expect(grantsRepo.getActiveRole).not.toHaveBeenCalled()
    expect(ctx).toEqual({ level: 0, isModerator: false, isAdmin: false })
  })

  it('gives a signed-in user with no active grant level 0 and no authority', async () => {
    grantsRepo.getActiveRole.mockResolvedValue(null)

    const ctx = await access.getContext('user-1')

    expect(grantsRepo.getActiveRole).toHaveBeenCalledWith('user-1')
    expect(ctx).toEqual({ level: 0, isModerator: false, isAdmin: false })
  })

  it('gives a MODERATOR moderator authority but not admin authority', async () => {
    grantsRepo.getActiveRole.mockResolvedValue(PlatformRole.MODERATOR)

    const ctx = await access.getContext('user-1')

    expect(ctx).toEqual({ level: 10, isModerator: true, isAdmin: false })
  })

  it('gives an ADMIN both moderator and admin authority', async () => {
    grantsRepo.getActiveRole.mockResolvedValue(PlatformRole.ADMIN)

    const ctx = await access.getContext('user-1')

    expect(ctx).toEqual({ level: 20, isModerator: true, isAdmin: true })
  })
})
