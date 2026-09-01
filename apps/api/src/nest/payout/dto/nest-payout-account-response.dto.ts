import { ApiProperty } from '@nestjs/swagger'

export class NestPayoutAccountResponseDto {
  @ApiProperty({ description: 'Whether this nest has a connected payout account' })
  isConnected!: boolean

  @ApiProperty({ description: 'Whether the connected account can currently receive charges' })
  chargesEnabled!: boolean

  @ApiProperty({ description: 'Whether the connected account can currently receive payouts' })
  payoutsEnabled!: boolean

  @ApiProperty({ description: 'This nest\'s current withdrawable balance in cents' })
  balanceCents!: number
}
