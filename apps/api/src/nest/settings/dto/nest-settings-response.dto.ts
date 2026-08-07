import { ApiProperty } from '@nestjs/swagger'
import { NestJoinPolicy, NestVisibility } from 'generated/prisma/enums'

export class NestSettingsResponseDto {
  @ApiProperty({ enum: NestVisibility, description: 'Who can view the nest' })
  visibility!: NestVisibility

  @ApiProperty({ enum: NestJoinPolicy, description: 'How users can join the nest' })
  joinPolicy!: NestJoinPolicy

  @ApiProperty({ description: 'Minimum level required to create a thread — see the nest\'s roles list' })
  minThreadCreationLevel!: number

  @ApiProperty({ description: 'Minimum level required to comment' })
  minCommentCreationLevel!: number

  @ApiProperty({ description: 'Minimum level required to edit the nest' })
  minNestEditLevel!: number

  @ApiProperty({ description: 'Minimum level required to lock/unlock threads' })
  minThreadLockManageLevel!: number

  @ApiProperty({ description: 'Minimum level required to pin/unpin threads' })
  minThreadPinManageLevel!: number

  @ApiProperty({ description: 'Minimum level required to pin/unpin comments' })
  minCommentPinManageLevel!: number

  @ApiProperty({ description: 'Minimum level required to moderate content' })
  minContentModerateLevel!: number

  @ApiProperty({ description: 'Minimum level required to view the member list' })
  minMemberViewLevel!: number

  @ApiProperty({ description: 'Minimum level required to manage invites' })
  minInviteManageLevel!: number

  @ApiProperty({ description: 'Minimum level required to remove members' })
  minMemberRemoveLevel!: number

  @ApiProperty({ description: 'Minimum level required to manage join requests' })
  minJoinRequestManageLevel!: number

  @ApiProperty({ description: 'Minimum level required to manage bans' })
  minBanManageLevel!: number
}
