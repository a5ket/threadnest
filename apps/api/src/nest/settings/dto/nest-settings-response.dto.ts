import { ApiProperty } from '@nestjs/swagger'
import { NestJoinPolicy, NestMemberRole, NestVisibility } from 'generated/prisma/enums'

export class NestSettingsResponseDto {
  @ApiProperty({ enum: NestVisibility, description: 'Who can view the nest' })
  visibility!: NestVisibility

  @ApiProperty({ enum: NestJoinPolicy, description: 'How users can join the nest' })
  joinPolicy!: NestJoinPolicy

  @ApiProperty({ enum: NestMemberRole, description: 'Minimum role required to create a thread' })
  minThreadCreationRole!: NestMemberRole

  @ApiProperty({ enum: NestMemberRole, description: 'Minimum role required to comment' })
  minCommentCreationRole!: NestMemberRole

  @ApiProperty({ enum: NestMemberRole, description: 'Minimum role required to edit the nest' })
  minNestEditRole!: NestMemberRole

  @ApiProperty({ enum: NestMemberRole, description: 'Minimum role required to lock/unlock threads' })
  minThreadLockManageRole!: NestMemberRole

  @ApiProperty({ enum: NestMemberRole, description: 'Minimum role required to pin/unpin threads' })
  minThreadPinManageRole!: NestMemberRole

  @ApiProperty({ enum: NestMemberRole, description: 'Minimum role required to pin/unpin comments' })
  minCommentPinManageRole!: NestMemberRole

  @ApiProperty({ enum: NestMemberRole, description: 'Minimum role required to moderate content' })
  minContentModerateRole!: NestMemberRole

  @ApiProperty({ enum: NestMemberRole, description: 'Minimum role required to view the member list' })
  minMemberViewRole!: NestMemberRole

  @ApiProperty({ enum: NestMemberRole, description: 'Minimum role required to manage invites' })
  minInviteManageRole!: NestMemberRole

  @ApiProperty({ enum: NestMemberRole, description: 'Minimum role required to remove members' })
  minMemberRemoveRole!: NestMemberRole

  @ApiProperty({ enum: NestMemberRole, description: 'Minimum role required to manage join requests' })
  minJoinRequestManageRole!: NestMemberRole

  @ApiProperty({ enum: NestMemberRole, description: 'Minimum role required to manage bans' })
  minBanManageRole!: NestMemberRole
}
