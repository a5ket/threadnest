import { IsInt, Max, Min } from 'class-validator'

export class NestPaywallSetPriceDto {
  /**
   * Subscription price in cents
   * @example 500
   */
  @IsInt()
  @Min(100)
  @Max(100000)
  amountCents!: number
}
