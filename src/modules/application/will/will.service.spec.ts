import { Test, TestingModule } from '@nestjs/testing';
import { WillService } from './will.service';

describe('WillService', () => {
  let service: WillService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WillService],
    }).compile();

    service = module.get<WillService>(WillService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
