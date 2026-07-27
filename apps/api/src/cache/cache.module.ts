import { Global, Module } from '@nestjs/common'
import { CacheRedisService } from './cache.redis.service'
import { CacheService } from './cache.service'

@Global()
@Module({
  providers: [
    {
      provide: CacheService,
      useClass: CacheRedisService
    }
  ],
  exports: [CacheService]
})
export class CacheModule { }
