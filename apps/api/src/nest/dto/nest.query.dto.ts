import { Transform } from 'class-transformer'
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator'

export enum NestSortBy {
  CREATED_AT = 'createdAt',
  MEMBER_COUNT = 'memberCount'
}

export class NestQueryDto {
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(String(value ?? '20'), 10))
  @IsOptional()
  limit!: number

  @IsOptional()
  @IsString()
  cursor?: string

  @IsEnum(NestSortBy)
  @Transform(({ value }) => (value ?? NestSortBy.CREATED_AT) as NestSortBy)
  @IsOptional()
  sortBy!: NestSortBy

  @IsBoolean()
  @Transform(({ value }) => value === undefined ? false : value === 'true' || value === true)
  @IsOptional()
  sortAscending!: boolean

  @IsOptional()
  @IsString()
  @MaxLength(100)
  search?: string
}
