import { ApiProperty } from '@nestjs/swagger'
import { NestJoinPolicy, NestVisibility } from 'generated/prisma/enums'

export class NestDiscoveryResponseDto {
  @ApiProperty({ description: 'Nest ID' })
  id!: string

  @ApiProperty({ description: 'Nest display name' })
  name!: string

  @ApiProperty({ description: 'Unique nest slug' })
  slug!: string

  @ApiProperty({ description: 'Nest description', nullable: true, type: 'string' })
  description!: string | null

  @ApiProperty({ description: 'Nest icon URL', nullable: true, type: 'string' })
  iconUrl!: string | null

  @ApiProperty({ description: 'Number of members' })
  memberCount!: number

  @ApiProperty({ description: 'Number of threads' })
  threadCount!: number

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt!: Date

  @ApiProperty({ enum: NestVisibility, description: 'Who can view the nest' })
  visibility!: NestVisibility

  @ApiProperty({ enum: NestJoinPolicy, description: 'How users can join the nest' })
  joinPolicy!: NestJoinPolicy

  @ApiProperty({ description: 'Whether the current user is already a member' })
  isMember!: boolean

  @ApiProperty({ description: 'Whether the current user has a pending join request' })
  hasPendingJoinRequest!: boolean
}
