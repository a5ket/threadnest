import { ApiProperty } from '@nestjs/swagger'

export class MeBootstrapUserDto {
  @ApiProperty({ description: 'User ID' })
  id!: string

  @ApiProperty({ description: 'User email address' })
  email!: string

  @ApiProperty({ description: 'Unique username' })
  username!: string

  @ApiProperty({ description: 'Avatar URL', nullable: true, type: 'string' })
  avatarUrl!: string | null

  @ApiProperty({ description: 'Whether the email has been verified' })
  emailVerified!: boolean
}

export class MeBootstrapNestDto {
  @ApiProperty({ description: 'Nest ID' })
  id!: string

  @ApiProperty({ description: 'Nest display name' })
  name!: string

  @ApiProperty({ description: 'Unique nest slug' })
  slug!: string
}

export class MeBootstrapDataDto {
  @ApiProperty({ type: MeBootstrapUserDto, description: 'Authenticated user profile' })
  user!: MeBootstrapUserDto

  @ApiProperty({ type: [MeBootstrapNestDto], description: 'Nests the user is a member of' })
  nests!: MeBootstrapNestDto[]
}
