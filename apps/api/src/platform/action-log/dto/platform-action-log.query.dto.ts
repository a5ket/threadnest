import { Transform, Type } from 'class-transformer'
import { IsDate, IsEnum, IsInt, IsOptional, IsString, IsUUID, Max, Min } from 'class-validator'
import { PlatformActionType } from 'generated/prisma/enums'

export class PlatformActionLogQueryDto {
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(String(value ?? '20'), 10))
  limit: number = 20

  @IsOptional()
  @IsString()
  cursor?: string

  @IsOptional()
  @IsEnum(PlatformActionType)
  type?: PlatformActionType

  @IsOptional()
  @IsUUID()
  actorId?: string

  @IsOptional()
  @IsUUID()
  targetUserId?: string

  @IsOptional()
  @IsUUID()
  nestId?: string

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdAfter?: Date

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  createdBefore?: Date
}
