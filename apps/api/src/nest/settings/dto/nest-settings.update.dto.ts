import { NestJoinPolicy, NestVisibility } from 'generated/prisma/enums'
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator'
import { NEST_ACCESS_LEVEL, NON_MEMBER_LEVEL } from 'src/nest/constants/nest-access-level'

export class NestSettingsUpdateDto {
  @IsEnum(NestVisibility)
  @IsOptional()
  visibility?: NestVisibility

  @IsEnum(NestJoinPolicy)
  @IsOptional()
  joinPolicy?: NestJoinPolicy

  // Participation thresholds — may be lowered to NON_MEMBER_LEVEL to let non-members interact.
  @IsInt()
  @Min(NON_MEMBER_LEVEL)
  @Max(NEST_ACCESS_LEVEL.OWNER)
  @IsOptional()
  minThreadCreationLevel?: number

  @IsInt()
  @Min(NON_MEMBER_LEVEL)
  @Max(NEST_ACCESS_LEVEL.OWNER)
  @IsOptional()
  minCommentCreationLevel?: number

  @IsInt()
  @Min(NON_MEMBER_LEVEL)
  @Max(NEST_ACCESS_LEVEL.OWNER)
  @IsOptional()
  minThreadVoteLevel?: number

  @IsInt()
  @Min(NON_MEMBER_LEVEL)
  @Max(NEST_ACCESS_LEVEL.OWNER)
  @IsOptional()
  minCommentVoteLevel?: number

  // Moderation/management thresholds — always require real membership.
  @IsInt()
  @Min(NEST_ACCESS_LEVEL.MEMBER)
  @Max(NEST_ACCESS_LEVEL.OWNER)
  @IsOptional()
  minNestEditLevel?: number

  @IsInt()
  @Min(NEST_ACCESS_LEVEL.MEMBER)
  @Max(NEST_ACCESS_LEVEL.OWNER)
  @IsOptional()
  minThreadLockManageLevel?: number

  @IsInt()
  @Min(NEST_ACCESS_LEVEL.MEMBER)
  @Max(NEST_ACCESS_LEVEL.OWNER)
  @IsOptional()
  minThreadPinManageLevel?: number

  @IsInt()
  @Min(NEST_ACCESS_LEVEL.MEMBER)
  @Max(NEST_ACCESS_LEVEL.OWNER)
  @IsOptional()
  minCommentPinManageLevel?: number

  @IsInt()
  @Min(NEST_ACCESS_LEVEL.MEMBER)
  @Max(NEST_ACCESS_LEVEL.OWNER)
  @IsOptional()
  minContentModerateLevel?: number

  @IsInt()
  @Min(NEST_ACCESS_LEVEL.MEMBER)
  @Max(NEST_ACCESS_LEVEL.OWNER)
  @IsOptional()
  minMemberViewLevel?: number

  @IsInt()
  @Min(NEST_ACCESS_LEVEL.MEMBER)
  @Max(NEST_ACCESS_LEVEL.OWNER)
  @IsOptional()
  minInviteManageLevel?: number

  @IsInt()
  @Min(NEST_ACCESS_LEVEL.MEMBER)
  @Max(NEST_ACCESS_LEVEL.OWNER)
  @IsOptional()
  minMemberRemoveLevel?: number

  @IsInt()
  @Min(NEST_ACCESS_LEVEL.MEMBER)
  @Max(NEST_ACCESS_LEVEL.OWNER)
  @IsOptional()
  minJoinRequestManageLevel?: number

  @IsInt()
  @Min(NEST_ACCESS_LEVEL.MEMBER)
  @Max(NEST_ACCESS_LEVEL.OWNER)
  @IsOptional()
  minBanManageLevel?: number

  // Action log access is never opened below moderator, even though other thresholds can be.
  @IsInt()
  @Min(NEST_ACCESS_LEVEL.MODERATOR)
  @Max(NEST_ACCESS_LEVEL.OWNER)
  @IsOptional()
  minActionLogViewLevel?: number
}
