import { ApiProperty } from '@nestjs/swagger'
import { PlatformRole } from 'generated/prisma/enums'

export class PlatformRoleActiveResponseDto {
  @ApiProperty({ enum: PlatformRole, nullable: true, description: 'The user\'s currently active platform role, or null if they hold none' })
  role!: PlatformRole | null
}
