import { ApiProperty } from '@nestjs/swagger'

export class UserProfileResponseDto {
  @ApiProperty({ description: 'User ID' })
  userId!: string

  @ApiProperty({ description: 'Unique username' })
  username!: string

  @ApiProperty({ description: 'Display name', nullable: true, type: 'string' })
  displayName!: string | null

  @ApiProperty({ description: 'Bio', nullable: true, type: 'string' })
  bio!: string | null

  @ApiProperty({ description: 'Avatar URL', nullable: true, type: 'string' })
  avatarUrl!: string | null

  @ApiProperty({ description: 'When the profile was created' })
  createdAt!: Date

  @ApiProperty({ description: 'Whether this user\'s authored threads and comments are visible to the current viewer' })
  activityVisible!: boolean
}
