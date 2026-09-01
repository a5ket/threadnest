import { Module } from '@nestjs/common'
import { EventModule } from 'src/event/event.module'
import { SecurityModule } from 'src/security/security.module'
import { RealtimeGateway } from './realtime.gateway'
import { NotificationCreatedRealtimeSubscriber } from './subscribers/notification-created.realtime-subscriber'

@Module({
  imports: [SecurityModule, EventModule],
  providers: [RealtimeGateway, NotificationCreatedRealtimeSubscriber],
  exports: [RealtimeGateway]
})
export class RealtimeModule { }
