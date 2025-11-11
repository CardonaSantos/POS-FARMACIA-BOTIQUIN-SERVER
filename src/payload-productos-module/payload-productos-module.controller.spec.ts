import { Test, TestingModule } from '@nestjs/testing';
import { PayloadProductosModuleController } from './payload-productos-module.controller';
import { PayloadProductosModuleService } from './payload-productos-module.service';

describe('PayloadProductosModuleController', () => {
  let controller: PayloadProductosModuleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PayloadProductosModuleController],
      providers: [PayloadProductosModuleService],
    }).compile();

    controller = module.get<PayloadProductosModuleController>(PayloadProductosModuleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
