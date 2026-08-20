import { Module } from '@nestjs/common'
import { SecurityModule } from 'src/security/security.module'
import { AttachmentController } from './attachment.controller'
import { AttachmentService } from './attachment.service'

@Module({
  imports: [SecurityModule],
  controllers: [AttachmentController],
  providers: [AttachmentService],
  exports: [AttachmentService]
})
export class AttachmentModule { }
