import { Module } from '@nestjs/common';
import { PayloadProductosModuleService } from './payload-productos-module.service';
import { PayloadProductosModuleController } from './payload-productos-module.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [PayloadProductosModuleController],
  providers: [PayloadProductosModuleService],
})
export class PayloadProductosModuleModule {}
