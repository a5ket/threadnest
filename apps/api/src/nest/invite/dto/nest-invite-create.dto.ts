import { IsUUID } from 'class-validator'

export class NestInviteCreateDto {
  @IsUUID()
  userId!: string
}
