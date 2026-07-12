import { Module } from '@nestjs/common'
import { UrlBuilder } from './url.builder'

@Module({
  providers: [UrlBuilder],
  exports: [UrlBuilder]
})
export class UrlModule { }
