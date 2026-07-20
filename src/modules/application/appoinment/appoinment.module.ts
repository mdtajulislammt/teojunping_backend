import { Module } from '@nestjs/common';
import { AppointmentsService } from './appoinment.service';
import { AppointmentsController } from './appoinment.controller';

@Module({
  controllers: [AppointmentsController],
  providers: [AppointmentsService],
})
export class AppoinmentModule {}
