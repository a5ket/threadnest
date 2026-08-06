import { ApiProperty } from '@nestjs/swagger'
import { NestMemberRole } from 'generated/prisma/enums'

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

  @ApiProperty({ enum: NestMemberRole, nullable: true, description: 'The user\'s role in the nest this reference was resolved for, or null if they are not a member' })
  role!: NestMemberRole | null
}
