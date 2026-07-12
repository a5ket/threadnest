import { NestJoinPolicy, NestMemberRole, NestVisibility } from 'generated/prisma/enums'
import { IsEnum, IsOptional } from 'class-validator'
import { Exclude } from 'class-transformer'

@Exclude()
export class NestSettingsUpdateDto {
  @IsEnum(NestVisibility)
  @IsOptional()
  visibility?: NestVisibility

  @IsEnum(NestJoinPolicy)
  @IsOptional()
  joinPolicy?: NestJoinPolicy

  @IsEnum(NestMemberRole)
  @IsOptional()
  minThreadCreationRole?: NestMemberRole

  @IsEnum(NestMemberRole)
  @IsOptional()
  minCommentCreationRole?: NestMemberRole

  @IsEnum(NestMemberRole)
  @IsOptional()
  minNestEditRole?: NestMemberRole

  @IsEnum(NestMemberRole)
  @IsOptional()
  minThreadLockManageRole?: NestMemberRole

  @IsEnum(NestMemberRole)
  @IsOptional()
  minThreadPinManageRole?: NestMemberRole

  @IsEnum(NestMemberRole)
  @IsOptional()
  minCommentPinManageRole?: NestMemberRole

  @IsEnum(NestMemberRole)
  @IsOptional()
  minContentModerateRole?: NestMemberRole

  @IsEnum(NestMemberRole)
  @IsOptional()
  minMemberViewRole?: NestMemberRole

  @IsEnum(NestMemberRole)
  @IsOptional()
  minInviteManageRole?: NestMemberRole

  @IsEnum(NestMemberRole)
  @IsOptional()
  minMemberRemoveRole?: NestMemberRole

  @IsEnum(NestMemberRole)
  @IsOptional()
  minJoinRequestManageRole?: NestMemberRole

  @IsEnum(NestMemberRole)
  @IsOptional()
  minBanManageRole?: NestMemberRole
}