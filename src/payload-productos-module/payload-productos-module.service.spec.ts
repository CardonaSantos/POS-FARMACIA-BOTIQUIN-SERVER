import { Test, TestingModule } from '@nestjs/testing';
import { PayloadProductosModuleService } from './payload-productos-module.service';

describe('PayloadProductosModuleService', () => {
  let service: PayloadProductosModuleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PayloadProductosModuleService],
    }).compile();

    service = module.get<PayloadProductosModuleService>(PayloadProductosModuleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
