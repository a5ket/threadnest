import { VoteType } from 'generated/prisma/enums'
import { IsEnum } from 'class-validator'

export class ThreadVoteDto {
  @IsEnum(VoteType)
  type!: VoteType
}
