import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { PayloadProductosModuleService } from './payload-productos-module.service';
import { CreatePayloadProductosModuleDto } from './dto/create-payload-productos-module.dto';
import { UpdatePayloadProductosModuleDto } from './dto/update-payload-productos-module.dto';

@Controller('payload-productos-module')
export class PayloadProductosModuleController {
  constructor(
    private readonly payloadProductosModuleService: PayloadProductosModuleService,
  ) {}

  @Get('make-upload')
  cargaMasiva() {
    return this.payloadProductosModuleService.cargaMasiva();
  }

  @Delete('delete-all-inventary')
  deleteAllProductos() {
    return this.payloadProductosModuleService.deleteAllProductos();
  }
}
