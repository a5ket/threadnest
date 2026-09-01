import { ConfigService } from '@nestjs/config'
import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import { ValidationPipe } from '@nestjs/common'
import { Logger } from 'nestjs-pino'
import { AppModule } from './app.module'
import { ValidationException } from './common/exceptions/validation.exception'
import { AppConfig } from './app.config'
import { RedisIoAdapter } from './realtime/redis-io.adapter'

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true })

  app.useLogger(app.get(Logger))

  const configService = app.get(ConfigService<AppConfig>)

  app.enableCors({
    origin: configService.getOrThrow('webAppUrl', { infer: true }),
    credentials: true
  })

  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    exceptionFactory: (errors) => new ValidationException(errors)
  }))

  const config = new DocumentBuilder()
    .setTitle('ThreadNest API')
    .addBearerAuth()
    .build()
  const documentFactory = () => SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('docs', app, documentFactory)

  const redisIoAdapter = new RedisIoAdapter(app)
  await redisIoAdapter.connectToRedis()
  app.useWebSocketAdapter(redisIoAdapter)

  const port = configService.getOrThrow('port', { infer: true })

  await app.listen(port)
}

void bootstrap()
