import { PlatformReportReason, PlatformReportTargetType } from 'generated/prisma/enums'
import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator'

export class PlatformReportCreateDto {
  @IsEnum(PlatformReportTargetType)
  targetType!: PlatformReportTargetType

  @IsUUID()
  targetId!: string

  @IsEnum(PlatformReportReason)
  reason!: PlatformReportReason

  @IsOptional()
  @IsString()
  @MaxLength(500)
  details?: string
}
