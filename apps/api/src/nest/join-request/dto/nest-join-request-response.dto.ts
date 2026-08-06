import { ApiProperty } from '@nestjs/swagger'
import { NestJoinRequestStatus } from 'generated/prisma/enums'
import { UserReferenceDto } from 'src/user/dto/user-reference.dto'

export class NestJoinRequestResponseDto {
  @ApiProperty({ description: 'Join request ID' })
  id!: string

  @ApiProperty({ type: UserReferenceDto, description: 'The user requesting to join' })
  user!: UserReferenceDto

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
