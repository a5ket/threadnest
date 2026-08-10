import { Transform } from 'class-transformer'
import { IsBoolean, IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator'

export enum ThreadSortBy {
  CREATED_AT = 'createdAt',
  UPDATED_AT = 'updatedAt',
  LAST_COMMENT_AT = 'lastCommentAt',
  SCORE = 'score'
}

export class ThreadQueryDto {
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(String(value ?? '20'), 10))
  @IsOptional()
  limit: number = 20

  @IsOptional()
  @IsString()
  cursor?: string

  @IsEnum(ThreadSortBy)
  @Transform(({ value }) => (value ?? ThreadSortBy.CREATED_AT) as ThreadSortBy)
  @IsOptional()
  sortBy!: ThreadSortBy

  @IsBoolean()
  @Transform(({ value }) => value === undefined ? false : value === 'true' || value === true)
  @IsOptional()
  sortAscending!: boolean

  @IsOptional()
  @IsString()
  search?: string
}
