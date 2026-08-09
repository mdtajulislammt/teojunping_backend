// external imports
import { MiddlewareConsumer, Module } from '@nestjs/common';
import { RedisModule } from '@nestjs-modules/ioredis';
import { BullModule } from '@nestjs/bullmq';
import { ConfigModule, ConfigService } from '@nestjs/config';

// internal imports
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import appConfig from './config/app.config';
import { AuthModule } from './modules/auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';

import { RepositoryModule } from './common/repository/repository.module';
import { MailModule } from './mail/mail.module';
import { AdminModule } from './modules/admin/admin.module';
import { ApplicationModule } from './modules/application/application.module';
import { RequestModule } from './modules/application/request/request.module';
import { ChatModule } from './modules/chat/chat.module';
import { PaymentModule } from './modules/payment/payment.module';
import { PrometheusModule } from './prometheus/prometheus.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),

    // 🚀 BullMQ Async Config
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('redis.host'),
          password: configService.get<string>('redis.password'),
          port: Number(configService.get<number>('redis.port')),
          maxRetriesPerRequest: null,
          enableReadyCheck: false,
        },
      }),
      inject: [ConfigService],
    }),

    // 🚀 IoRedis Async Config
    RedisModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'single',
        options: {
          host: configService.get<string>('redis.host'),
          password: configService.get<string>('redis.password'),
          port: Number(configService.get<number>('redis.port')),
          maxRetriesPerRequest: 3,
          retryStrategy: (times) => {
            if (times > 3) return null;
            return Math.min(times * 200, 1000);
          },
        },
      }),
      inject: [ConfigService],
    }),

    // General modules
    PrismaModule,
    RepositoryModule,
    AuthModule,
    MailModule,
    ApplicationModule,
    AdminModule,
    ChatModule,
    PaymentModule,
    PrometheusModule,
    RequestModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
