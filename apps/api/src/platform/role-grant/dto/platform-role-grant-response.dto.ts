import { ApiProperty } from '@nestjs/swagger'
import { PlatformRole } from 'generated/prisma/enums'

export class PlatformRoleGrantResponseDto {
  @ApiProperty({ description: 'The user this role was granted to' })
  userId!: string

  @ApiProperty({ enum: PlatformRole, description: 'The granted role' })
  role!: PlatformRole

  @ApiProperty({ description: 'The admin who granted this role, if granted through the platform rather than the bootstrap CLI', nullable: true })
  grantedById!: string | null

  @ApiProperty({ description: 'When the role was granted' })
  createdAt!: Date
}
