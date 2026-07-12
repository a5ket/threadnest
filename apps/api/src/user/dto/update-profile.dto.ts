import { IsOptional, IsString, Length, Matches } from 'class-validator'
import { Trim } from 'src/common/transforms/trim.transform'

export class UpdateProfileDto {
  @Trim()
  @IsString()
  @Length(3, 32)
  @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username can only contain letters, numbers and underscores' })
  @IsOptional()
  username?: string

  @Trim()
  @IsString()
  @Length(0, 64)
  @IsOptional()
  displayName?: string

  @Trim()
  @IsString()
  @Length(0, 500)
  @IsOptional()
  bio?: string

  @Trim()
  @IsString()
  @IsOptional()
  avatarUrl?: string
}
