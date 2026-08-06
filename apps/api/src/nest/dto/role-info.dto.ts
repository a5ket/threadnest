import { ApiProperty } from '@nestjs/swagger'
import { NestMemberRole } from 'generated/prisma/enums'

export class RoleInfoDto {
  @ApiProperty({ enum: NestMemberRole, description: 'Role identifier' })
  role!: NestMemberRole

  @ApiProperty({ description: 'Relative permission level — higher means more privileged' })
  level!: number
}
