import { IsBoolean, IsOptional } from 'class-validator'

export class UserNestPreferenceUpdateDto {
  @IsOptional()
  @IsBoolean()
  allowInvites?: boolean

  @IsOptional()
  @IsBoolean()
  muted?: boolean
}