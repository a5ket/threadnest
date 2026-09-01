import { Module } from '@nestjs/common'
import { ChatModule } from 'src/chat/chat.module'
import { EventModule } from 'src/event/event.module'
import { SecurityModule } from 'src/security/security.module'
import { RealtimeGateway } from './realtime.gateway'
import { MessageCreatedRealtimeSubscriber } from './subscribers/message-created.realtime-subscriber'
import { NotificationCreatedRealtimeSubscriber } from './subscribers/notification-created.realtime-subscriber'

@Module({
  imports: [SecurityModule, EventModule, ChatModule],
  providers: [RealtimeGateway, NotificationCreatedRealtimeSubscriber, MessageCreatedRealtimeSubscriber],
  exports: [RealtimeGateway]
})
export class RealtimeModule { }
