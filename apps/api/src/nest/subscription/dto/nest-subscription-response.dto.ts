import { ApiProperty } from '@nestjs/swagger'
import { NestSubscriptionStatus } from 'generated/prisma/enums'

export class NestSubscriptionResponseDto {
  @ApiProperty({ enum: NestSubscriptionStatus })
  status!: NestSubscriptionStatus

  @ApiProperty({ description: 'When the current billing period ends' })
  currentPeriodEnd!: Date

  @ApiProperty({ description: 'Whether the subscription will cancel at the end of the current period' })
  cancelAtPeriodEnd!: boolean

  @ApiProperty({ description: 'Subscription price in cents', nullable: true })
  priceAmountCents!: number | null
}
