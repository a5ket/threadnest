import { ApiProperty } from '@nestjs/swagger'
import { NestReferencetDto } from 'src/nest/dto/nest-reference.dto'

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

export class MeBootstrapDataDto {
  @ApiProperty({ type: MeBootstrapUserDto, description: 'Authenticated user profile' })
  user!: MeBootstrapUserDto

  @ApiProperty({ type: [NestReferencetDto], description: 'Nests the user is a member of' })
  nests!: NestReferencetDto[]
}
