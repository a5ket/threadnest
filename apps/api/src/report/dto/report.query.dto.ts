import { ReportStatus } from 'generated/prisma/enums'
import { IsEnum, IsOptional } from 'class-validator'

export class ReportQueryDto {
  @IsOptional()
  @IsEnum(ReportStatus)
  status?: ReportStatus
}
