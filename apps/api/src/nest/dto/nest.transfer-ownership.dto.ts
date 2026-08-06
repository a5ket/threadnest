import { IsUUID } from 'class-validator'

export class NestTransferOwnershipDto {
  @IsUUID()
  userId!: string
}
