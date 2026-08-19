import { IsEnum } from 'class-validator'
import { PlatformRole } from 'generated/prisma/enums'

export class PlatformRoleGrantCreateDto {
  @IsEnum(PlatformRole)
  role!: PlatformRole
}