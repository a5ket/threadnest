import { InsufficientPermissionsException } from 'src/common/exceptions/insufficient-permissions.exception'
import { createNestAccessContext } from 'test/factories/nest-access-context.factory'
import { createMockNestAccess } from 'test/factories/nest-access.mock-factory'
import { NestSettingsPolicy } from './nest-settings.policy'

describe('NestSettingsPolicy', () => {
  const nestAccess = createMockNestAccess()
  const policy = new NestSettingsPolicy(nestAccess as any)

  const givenContext = (overrides: Parameters<typeof createNestAccessContext>[0]) =>
    nestAccess.getContext.mockResolvedValue(createNestAccessContext(overrides))

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('assertCanViewSettings', () => {
    it('allows when canManageSettings is true', async () => {
      givenContext({ canManageSettings: true })

      await expect(
        policy.assertCanViewSettings('nest-1', 'user-1'),
      ).resolves.toBeUndefined()
    })

    it('throws InsufficientPermissionsException when canManageSettings is false', async () => {
      givenContext({ canManageSettings: false })

      await expect(
        policy.assertCanViewSettings('nest-1', 'user-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })
  })

  describe('assertCanUpdateSettings', () => {
    it('allows when canManageSettings is true', async () => {
      givenContext({ canManageSettings: true })

      await expect(
        policy.assertCanUpdateSettings('nest-1', 'user-1'),
      ).resolves.toBeUndefined()
    })

    it('throws InsufficientPermissionsException when canManageSettings is false', async () => {
      givenContext({ canManageSettings: false })

      await expect(
        policy.assertCanUpdateSettings('nest-1', 'user-1'),
      ).rejects.toThrow(InsufficientPermissionsException)
    })
  })
})
