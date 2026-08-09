import { Module } from '@nestjs/common';
import { PaymentTransactionModule } from './payment-transaction/payment-transaction.module';
import { UserModule } from './user/user.module';
import { NotificationModule } from './notification/notification.module';

@Module({
  imports: [
    PaymentTransactionModule,
    UserModule,
    NotificationModule,
  ],
})
export class AdminModule {}
 