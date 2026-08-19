import { IsNotEmpty, IsString, MaxLength } from 'class-validator'

export class UserSuspensionCreateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  reason!: string
}
