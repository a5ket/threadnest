import { Transform } from 'class-transformer'
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator'
import type { CommentSortBy } from '../types/comment'


const MAX_TREE_NODES = 500

@ValidatorConstraint({ name: 'boundedFanOut', async: false })
class BoundedFanOutConstraint implements ValidatorConstraintInterface {
  validate(_: unknown, args: ValidationArguments) {
    const obj = args.object as CommentQueryDto
    const worstCase = Math.pow(obj.replyLimit, obj.maxDepth)
    return worstCase <= MAX_TREE_NODES
  }

  defaultMessage() {
    return `replyLimit and maxDepth combination exceeds the maximum tree size (${MAX_TREE_NODES} nodes)`
  }
}

export class CommentQueryDto {
  @IsInt()
  @Min(1)
  @Max(100)
  @Transform(({ value }) => parseInt(String(value ?? '20'), 10))
  @IsOptional()
  limit!: number

  @IsInt()
  @Min(1)
  @Max(20)
  @Transform(({ value }) => parseInt(String(value ?? '5'), 10))
  @Validate(BoundedFanOutConstraint)
  @IsOptional()
  replyLimit!: number

  @IsInt()
  @Min(1)
  @Max(6)
  @Transform(({ value }) => parseInt(String(value ?? '3'), 10))
  @IsOptional()
  maxDepth!: number

  @IsIn(['createdAt', 'updatedAt'] as const)
  @Transform(({ value }) => (value ?? 'createdAt') as CommentSortBy)
  @IsOptional()
  sortBy!: CommentSortBy

  @IsBoolean()
  @Transform(({ value }) => value === undefined ? false : value === 'true' || value === true)
  @IsOptional()
  sortAscending!: boolean

  @IsString()
  @IsOptional()
  cursor?: string
}