import { IsUUID } from 'class-validator'

export class ChatStartDto {
  @IsUUID()
  userId!: string
}
