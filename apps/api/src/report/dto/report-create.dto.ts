import { ReportReason } from 'generated/prisma/enums'
import { IsEnum, IsOptional, IsString, MaxLength } from 'class-validator'

export class ReportCreateDto {
  @IsEnum(ReportReason)
  reason!: ReportReason

  @IsOptional()
  @IsString()
  @MaxLength(500)
  details?: string
}
