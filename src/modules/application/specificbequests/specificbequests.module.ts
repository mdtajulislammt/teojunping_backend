import { Module } from '@nestjs/common';
import { SpecificbequestsService } from './specificbequests.service';
import { SpecificbequestsController } from './specificbequests.controller';

@Module({
  controllers: [SpecificbequestsController],
  providers: [SpecificbequestsService],
})
export class SpecificbequestsModule {}
