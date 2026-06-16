import { Test, TestingModule } from '@nestjs/testing';
import { AsstesController } from './asstes.controller';
import { AsstesService } from './asstes.service';

describe('AsstesController', () => {
  let controller: AsstesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AsstesController],
      providers: [AsstesService],
    }).compile();

    controller = module.get<AsstesController>(AsstesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
