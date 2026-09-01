import { Module } from '@nestjs/common'
import { BlockModule } from 'src/block/block.module'
import { EventModule } from 'src/event/event.module'
import { PrismaModule } from 'src/prisma/prisma.module'
import { SecurityModule } from 'src/security/security.module'
import { UserModule } from 'src/user/user.module'
import { ChatAccess } from './chat.access'
import { ChatController } from './chat.controller'
import { ChatPolicy } from './chat.policy'
import { ChatPresenter } from './chat.presenter'
import { ChatRepository } from './chat.repository'
import { ChatService } from './chat.service'
import { MessageController } from './message/message.controller'
import { MessagePresenter } from './message/message.presenter'
import { MessageRepository } from './message/message.repository'
import { MessageService } from './message/message.service'

@Module({
  imports: [
    PrismaModule,
    SecurityModule,
    UserModule,
    BlockModule,
    EventModule,
  ],
  providers: [
    ChatRepository,
    ChatAccess,
    ChatPolicy,
    ChatPresenter,
    ChatService,
    MessageRepository,
    MessagePresenter,
    MessageService,
  ],
  controllers: [
    ChatController,
    MessageController,
  ],
  exports: [ChatRepository, ChatAccess, ChatPolicy, ChatService]
})
export class ChatModule { }
