import { Module } from '@nestjs/common';
import { WillService } from './will.service';
import { WillController } from './will.controller';

@Module({
  controllers: [WillController],
  providers: [WillService],
})
export class WillModule {}
