import { IsOptional, IsString, Length } from 'class-validator'

export class RefreshDto {
  /**
   * The refresh token. Optional when a valid `refresh_token` cookie is present.
   * @example a1b2c3d4...64bytesHex
   */
  @IsOptional()
  @IsString()
  @Length(128, 128)
  refreshToken?: string
}
