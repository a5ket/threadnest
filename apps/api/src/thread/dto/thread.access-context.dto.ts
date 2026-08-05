import { ApiProperty } from '@nestjs/swagger'

export class ThreadAccessContextDto {
  @ApiProperty({ description: 'Whether the current user authored this thread' })
  isAuthor!: boolean

  @ApiProperty({ description: 'Whether the thread has been deleted' })
  isDeleted!: boolean

  @ApiProperty({ description: 'Whether the thread is locked' })
  isLocked!: boolean

  @ApiProperty({ description: 'Whether the thread is pinned' })
  isPinned!: boolean

  @ApiProperty({ description: 'Whether the current user can view the thread' })
  canViewThread!: boolean

  @ApiProperty({ description: 'Whether the current user can read the thread\'s content' })
  canReadContent!: boolean

  @ApiProperty({ description: 'Whether the current user can edit the thread' })
  canEditThread!: boolean

  @ApiProperty({ description: 'Whether the current user can delete the thread' })
  canDeleteThread!: boolean

  @ApiProperty({ description: 'Whether the current user can comment on the thread' })
  canCommentThread!: boolean

  @ApiProperty({ description: 'Whether the current user can moderate content on the thread' })
  canModerateContent!: boolean

  @ApiProperty({ description: 'Whether the current user can lock/unlock the thread' })
  canManageThreadLock!: boolean

  @ApiProperty({ description: 'Whether the current user can pin/unpin the thread' })
  canManageThreadPin!: boolean
}
