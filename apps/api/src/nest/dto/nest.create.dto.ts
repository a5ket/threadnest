import { NestJoinPolicy, NestVisibility } from 'generated/prisma/enums'
import { IsEnum, IsOptional, IsString, Length, Matches } from 'class-validator'
import { Lowercase } from 'src/common/transforms/lowercase.transform'
import { Trim } from 'src/common/transforms/trim.transform'

export const NEST_SLUG_REGEX = /^[a-z0-9]+(?:-[a-z0-9]+)*$/

export class NestCreateDto {
  @Trim()
  @IsString()
  @Length(3, 128)
  name!: string

  @Trim()
  @Lowercase()
  @IsString()
  @Length(3, 64)
  @Matches(NEST_SLUG_REGEX)
  slug!: string

  @Trim()
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string

  @IsEnum(NestVisibility)
  @IsOptional()
  visibility?: NestVisibility

  @IsEnum(NestJoinPolicy)
  @IsOptional()
  joinPolicy?: NestJoinPolicy
}