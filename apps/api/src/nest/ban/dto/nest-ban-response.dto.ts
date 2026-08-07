import { ApiProperty } from '@nestjs/swagger'
import { UserSummaryResponseDto } from 'src/user/dto/user-summary-response.dto'

export class NestBanResponseDto {
  @ApiProperty({ type: UserSummaryResponseDto, description: 'The banned user' })
  user!: UserSummaryResponseDto

  @ApiProperty({ type: UserSummaryResponseDto, description: 'The user who issued the ban' })
  bannedBy!: UserSummaryResponseDto

  @ApiProperty({ description: 'Optional reason for the ban', nullable: true, type: 'string' })
  reason!: string | null

  @ApiProperty({ description: 'When the ban was issued' })
  bannedAt!: Date
}
