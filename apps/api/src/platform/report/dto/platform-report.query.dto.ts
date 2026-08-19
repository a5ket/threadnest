import { PlatformReportStatus } from 'generated/prisma/enums'
import { IsEnum, IsOptional } from 'class-validator'

export class PlatformReportQueryDto {
  @IsOptional()
  @IsEnum(PlatformReportStatus)
  status?: PlatformReportStatus
}
