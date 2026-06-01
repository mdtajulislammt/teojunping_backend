import { Test, TestingModule } from '@nestjs/testing';
import { WillController } from './will.controller';
import { WillService } from './will.service';

describe('WillController', () => {
  let controller: WillController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WillController],
      providers: [WillService],
    }).compile();

    controller = module.get<WillController>(WillController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
