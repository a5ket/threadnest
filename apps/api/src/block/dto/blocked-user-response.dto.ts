import { ApiProperty } from '@nestjs/swagger'
import { UserSummaryResponseDto } from 'src/user/dto/user-summary-response.dto'

export class BlockedUserResponseDto {
  @ApiProperty({ type: UserSummaryResponseDto, description: 'The blocked user' })
  user!: UserSummaryResponseDto

  @ApiProperty({ description: 'When the block was created' })
  blockedAt!: Date
}
