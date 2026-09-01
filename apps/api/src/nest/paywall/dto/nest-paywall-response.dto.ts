import { ApiProperty } from '@nestjs/swagger'

export class NestPaywallResponseDto {
  @ApiProperty({ description: 'Whether the nest currently requires a subscription' })
  isPaywalled!: boolean

  @ApiProperty({ description: 'Subscription price in cents', nullable: true })
  priceAmountCents!: number | null
}
