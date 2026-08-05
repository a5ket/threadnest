import { ApiProperty } from '@nestjs/swagger'

export class UserReferenceProfileDto {
  @ApiProperty({ description: 'Unique username' })
  username!: string

  @ApiProperty({ description: 'Display name', nullable: true, type: 'string' })
  displayName!: string | null

  @ApiProperty({ description: 'Avatar URL', nullable: true, type: 'string' })
  avatarUrl!: string | null
}

export class UserReferenceDto {
  @ApiProperty({ description: 'User ID' })
  id!: string

  @ApiProperty({ type: UserReferenceProfileDto, nullable: true, description: 'Null if the user has no profile' })
  profile!: UserReferenceProfileDto | null
}
