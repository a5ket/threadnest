import { Transform } from 'class-transformer'
import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'

export class UserQueryDto {
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(String(value ?? '20'), 10))
  @IsOptional()
  limit: number = 20

  @IsOptional()
  @IsString()
  cursor?: string

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string
}
