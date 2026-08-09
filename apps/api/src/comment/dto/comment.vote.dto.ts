import { VoteType } from 'generated/prisma/enums'
import { IsEnum } from 'class-validator'

export class CommentVoteDto {
  @IsEnum(VoteType)
  type!: VoteType
}
