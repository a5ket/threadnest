import { Module } from '@nestjs/common'
import { EventModule } from 'src/event/event.module'
import { PrismaModule } from 'src/prisma/prisma.module'
import { UserModule } from 'src/user/user.module'
import { BlockPresenter } from './block.presenter'
import { BlockRepository } from './block.repository'
import { BlockService } from './block.service'

@Module({
  imports: [PrismaModule, EventModule, UserModule],
  providers: [BlockService, BlockRepository, BlockPresenter],
  exports: [BlockService]
})
export class BlockModule { }
