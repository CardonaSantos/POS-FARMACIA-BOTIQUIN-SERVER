import { PartialType } from '@nestjs/mapped-types';
import { CreatePayloadProductosModuleDto } from './create-payload-productos-module.dto';

export class UpdatePayloadProductosModuleDto extends PartialType(CreatePayloadProductosModuleDto) {}
