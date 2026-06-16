import { Test, TestingModule } from '@nestjs/testing';
import { AsstesService } from './asstes.service';

describe('AsstesService', () => {
  let service: AsstesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AsstesService],
    }).compile();

    service = module.get<AsstesService>(AsstesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
