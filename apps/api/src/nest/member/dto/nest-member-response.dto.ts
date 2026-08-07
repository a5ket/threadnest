import { ApiProperty } from '@nestjs/swagger'
import { NestMemberRole } from 'generated/prisma/enums'
import { UserReferenceDto } from 'src/user/dto/user-reference.dto'

export class NestMemberResponseDto {
  @ApiProperty({ type: UserReferenceDto, description: 'The member' })
  user!: UserReferenceDto

  @ApiProperty({ enum: NestMemberRole, description: 'The member\'s role in the nest' })
  role!: NestMemberRole

  @ApiProperty({ description: 'When the user joined the nest' })
  createdAt!: Date
}
