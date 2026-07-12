import { IsUUID } from 'class-validator'
import { Exclude } from 'class-transformer'

@Exclude()
export class NestTransferOwnershipDto {
  @IsUUID()
  userId!: string
}
