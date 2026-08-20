import { Global, Module } from '@nestjs/common'
import { ImageProcessor } from './image-processor'
import { StorageService } from './storage.service'

@Global()
@Module({
  providers: [StorageService, ImageProcessor],
  exports: [StorageService, ImageProcessor]
})
export class StorageModule { }
