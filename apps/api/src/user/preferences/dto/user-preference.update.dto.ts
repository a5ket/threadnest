import { IsBoolean, IsOptional } from 'class-validator'

export class UserPreferenceUpdateDto {
  @IsOptional()
  @IsBoolean()
  showActivityOnProfile?: boolean
}
