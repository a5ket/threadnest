import { ApiProperty } from '@nestjs/swagger'
import { NestInviteStatus } from 'generated/prisma/enums'
import { NestReferencetDto } from 'src/nest/dto/nest-reference.dto'
import { UserReferenceDto } from 'src/user/dto/user-reference.dto'

export class NestInvitePersonalResponseDto {
  @ApiProperty({ description: 'Invite ID' })
  id!: string

  @ApiProperty({ type: NestReferencetDto, description: 'The nest this invite is for' })
  nest!: NestReferencetDto

  @ApiProperty({ type: UserReferenceDto, description: 'The user who sent the invite' })
  invitedBy!: UserReferenceDto

  @ApiProperty({ type: UserReferenceDto, nullable: true, description: 'The user who accepted/declined/revoked the invite, if resolved' })
  resolvedBy!: UserReferenceDto | null

  @ApiProperty({ description: 'Optional message attached to the invite', nullable: true, type: 'string' })
  message!: string | null

  @ApiProperty({ enum: NestInviteStatus, description: 'Invite status' })
  status!: NestInviteStatus

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date

  @ApiProperty({ description: 'When the invite was accepted/declined/revoked, if resolved', nullable: true, type: 'string' })
  resolvedAt!: Date | null
}
