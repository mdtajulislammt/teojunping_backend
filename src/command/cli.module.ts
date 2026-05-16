// src/command/cli.module.ts
// Lightweight module for CLI commands — avoids Redis/BullMQ/external connections
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import appConfig from '../config/app.config';
import { PrismaModule } from '../prisma/prisma.module';
import { SeedCommand } from './seed.command';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
    }),
    PrismaModule,
  ],
  providers: [SeedCommand],
})
export class CliModule {}
