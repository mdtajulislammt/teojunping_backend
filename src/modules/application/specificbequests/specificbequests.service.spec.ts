import { Test, TestingModule } from '@nestjs/testing';
import { SpecificbequestsService } from './specificbequests.service';

describe('SpecificbequestsService', () => {
  let service: SpecificbequestsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SpecificbequestsService],
    }).compile();

    service = module.get<SpecificbequestsService>(SpecificbequestsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
