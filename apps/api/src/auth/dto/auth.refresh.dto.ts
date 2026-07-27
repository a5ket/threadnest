import { IsOptional, IsString, Length } from 'class-validator'

export class RefreshDto {
  @IsOptional()
  @IsString()
  @Length(128, 128)
  refreshToken?: string
}