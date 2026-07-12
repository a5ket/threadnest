import { NestMemberRole } from 'generated/prisma/enums'
import { IsEnum } from 'class-validator'

export class NestMemberUpdateRoleDto {
  @IsEnum(NestMemberRole)
  role!: NestMemberRole
}
