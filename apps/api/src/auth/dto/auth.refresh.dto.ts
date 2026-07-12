import { IsString, Length } from 'class-validator'

export class RefreshDto {
  @IsString()
  @Length(128, 128)
  refreshToken!: string
}