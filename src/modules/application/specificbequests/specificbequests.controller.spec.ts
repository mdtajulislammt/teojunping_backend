import { Test, TestingModule } from '@nestjs/testing';
import { SpecificbequestsController } from './specificbequests.controller';
import { SpecificbequestsService } from './specificbequests.service';

describe('SpecificbequestsController', () => {
  let controller: SpecificbequestsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SpecificbequestsController],
      providers: [SpecificbequestsService],
    }).compile();

    controller = module.get<SpecificbequestsController>(SpecificbequestsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
