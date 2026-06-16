import { Module } from '@nestjs/common';
import { AssetService } from './asstes.service';
import { AssetController } from './asstes.controller';

@Module({
  controllers: [AssetController],
  providers: [AssetService],
})
export class AsstesModule {}
