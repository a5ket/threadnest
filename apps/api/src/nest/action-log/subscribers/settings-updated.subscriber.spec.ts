import { NestActionType } from 'generated/prisma/enums'
import { createMockNestActionLogService } from 'test/factories/nest-action-log-service.mock-factory'
import { NestSettingsUpdatedEvent } from 'src/nest/settings/events/nest-settings-updated.event'
import { SettingsUpdatedActionLogSubscriber } from './settings-updated.subscriber'

describe('SettingsUpdatedActionLogSubscriber', () => {
  const actionLogs = createMockNestActionLogService()
  const subscriber = new SettingsUpdatedActionLogSubscriber(actionLogs as any)

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('logs the settings update', async () => {
    await subscriber.handle(new NestSettingsUpdatedEvent({
      nestId: 'nest-1',
      userId: 'actor-1'
    }))

    expect(actionLogs.create).toHaveBeenCalledWith('nest-1', 'actor-1', null, NestActionType.SETTINGS_UPDATED, {})
  })
})
