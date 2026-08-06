import { ApiProperty } from '@nestjs/swagger'
import { NestJoinRequestStatus } from 'generated/prisma/enums'
import { NestReferencetDto } from 'src/nest/dto/nest-reference.dto'
import { UserReferenceDto } from 'src/user/dto/user-reference.dto'

export class NestJoinRequestPersonalResponseDto {
  @ApiProperty({ description: 'Join request ID' })
  id!: string

  @ApiProperty({ type: NestReferencetDto, description: 'The nest this request is for' })
  nest!: NestReferencetDto

  @ApiProperty({ type: UserReferenceDto, nullable: true, description: 'The user who approved/rejected the request, if resolved' })
  resolvedBy!: UserReferenceDto | null

  @ApiProperty({ description: 'Optional message attached to the request', nullable: true, type: 'string' })
  message!: string | null

  @ApiProperty({ enum: NestJoinRequestStatus, description: 'Join request status' })
  status!: NestJoinRequestStatus

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt!: Date

  @ApiProperty({ description: 'When the request was approved/rejected, if resolved', nullable: true, type: 'string' })
  resolvedAt!: Date | null
}
