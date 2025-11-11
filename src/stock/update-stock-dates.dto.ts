import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsISO8601, IsOptional } from 'class-validator';

export enum StockKindEnum {
  PRODUCTO = 'PRODUCTO',
  PRESENTACION = 'PRESENTACION',
}

export class UpdateStockDatesDto {
  @IsInt()
  id: number;

  @IsEnum(StockKindEnum, { message: 'kind debe ser PRODUCTO o PRESENTACION' })
  kind: StockKindEnum;

  @IsISO8601({}, { message: 'fechaIngreso debe ser ISO-8601' })
  fechaIngreso: string;

  @IsOptional()
  // Permitimos null o ISO, transformando "" -> null
  @Transform(({ value }) =>
    value === '' || value === undefined ? null : value,
  )
  @IsISO8601({}, { message: 'fechaVencimiento debe ser ISO-8601', each: false })
  fechaVencimiento?: string | null;
}
