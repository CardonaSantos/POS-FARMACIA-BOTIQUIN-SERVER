import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  ParseIntPipe,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  Logger,
  HttpException,
  InternalServerErrorException,
  Query,
  ValidationPipe,
} from '@nestjs/common';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import {
  CreateNewProductDto,
  PresentacionCreateDto,
} from './dto/create-productNew.dto';
import {
  AnyFilesInterceptor,
  FileFieldsInterceptor,
  FilesInterceptor,
} from '@nestjs/platform-express';
import { join } from 'path';
import { RolPrecio } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { validateOrReject } from 'class-validator';
import { QueryParamsInventariado } from './query/query';
import { newQueryDTO } from './query/newQuery';

// ---- DTOS del payload que esperas en tu servicio ----
interface PrecioProductoDto {
  rol: RolPrecio;
  orden: number;
  precio: string; // decimal string
}

interface PrecioPresentacionDto {
  rol: RolPrecio;
  orden: number;
  precio: string; // decimal string
}

export interface PresentacionUpdateDto {
  id: number | null;
  nombre: string;
  codigoBarras?: string;
  esDefault: boolean;
  tipoPresentacionId: number | null;
  costoReferencialPresentacion: string | null;
  descripcion: string | null;
  stockMinimo: number | null;
  categoriaIds: number[];
  preciosPresentacion: PrecioPresentacionDto[];
  activo?: boolean;
}

interface UpdateProductDto {
  nombre: string;
  descripcion: string | null;
  codigoProducto: string;
  codigoProveedor: string | null;
  stockMinimo: number | null;
  precioCostoActual: string | null;
  creadoPorId: number;
  categorias: number[];
  tipoPresentacionId: number | null;
  precioVenta: PrecioProductoDto[];
  presentaciones: PresentacionUpdateDto[];

  //nuevo
  deletedPresentationIds?: number[];
  keepProductImageIds?: number[];
  keepPresentationImageIds?: Record<number, number[]>;
}

// -------- Helpers de parsing/validación --------
const isDecimalStr = (s: string) => /^\d+(\.\d+)?$/.test(s);
const cleanStr = (v: unknown) =>
  v === undefined || v === null ? '' : String(v).trim();

const toNullableInt = (v: unknown) => {
  const s = cleanStr(v);
  if (!s || s.toLowerCase() === 'null') return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const toIntOrThrow = (v: unknown, label: string) => {
  const n = Number(v);
  if (!Number.isInteger(n)) {
    throw new BadRequestException(`${label} debe ser entero`);
  }
  return n;
};

const toDecimalStringOrNull = (v: unknown, label: string) => {
  const s = cleanStr(v);
  if (!s || s.toLowerCase() === 'null') return null;
  if (!isDecimalStr(s)) {
    throw new BadRequestException(`${label} debe ser decimal positivo`);
  }
  return s;
};

const safeJsonParse = <T>(raw: unknown, fallback: T, label: string): T => {
  const s = cleanStr(raw);
  if (!s) return fallback;
  try {
    return JSON.parse(s) as T;
  } catch {
    throw new BadRequestException(`${label} tiene un JSON inválido`);
  }
};

const mapPrecioProductoArray = (
  arr: any[],
  label: string,
): PrecioProductoDto[] =>
  (Array.isArray(arr) ? arr : []).map((p, i) => {
    const idx = `${label}[${i}]`;
    const rol = cleanStr(p?.rol) as RolPrecio;
    const orden = toIntOrThrow(p?.orden, `${idx}.orden`);
    const precioStr = cleanStr(p?.precio);
    if (!isDecimalStr(precioStr)) {
      throw new BadRequestException(`${idx}.precio debe ser decimal positivo`);
    }
    return { rol, orden, precio: precioStr };
  });

const mapPrecioPresentacionArray = (
  arr: any[],
  label: string,
): PrecioPresentacionDto[] =>
  (Array.isArray(arr) ? arr : []).map((p, i) => {
    const idx = `${label}[${i}]`;
    const rol = cleanStr(p?.rol) as RolPrecio;
    const orden = toIntOrThrow(p?.orden, `${idx}.orden`);
    const precioStr = cleanStr(p?.precio);
    if (!isDecimalStr(precioStr)) {
      throw new BadRequestException(`${idx}.precio debe ser decimal positivo`);
    }
    return { rol, orden, precio: precioStr };
  });

const mapPresentacionesArrayUpdate = (arr: any[]): PresentacionUpdateDto[] =>
  (arr ?? []).map((p, i) => {
    const preciosPresentacion = mapPrecioPresentacionArray(
      Array.isArray(p?.preciosPresentacion) ? p?.preciosPresentacion : [],
      `presentaciones[${i}].preciosPresentacion`,
    );

    const categoriaIdsRaw = Array.isArray(p?.categoriaIds)
      ? p.categoriaIds
      : [];
    const categoriaIds = categoriaIdsRaw.map((cid, j) =>
      toIntOrThrow(cid, `presentaciones[${i}].categoriaIds[${j}]`),
    );

    return {
      id:
        p?.id == null || p?.id === ''
          ? null
          : toIntOrThrow(p?.id, `presentaciones[${i}].id`),
      nombre: cleanStr(p?.nombre),
      codigoBarras: cleanStr(p?.codigoBarras) || undefined,
      esDefault: !!p?.esDefault,
      tipoPresentacionId: toNullableInt(p?.tipoPresentacionId),
      costoReferencialPresentacion: toDecimalStringOrNull(
        p?.costoReferencialPresentacion,
        `presentaciones[${i}].costoReferencialPresentacion`,
      ),
      descripcion: cleanStr(p?.descripcion) || null,
      stockMinimo: toNullableInt(p?.stockMinimo),
      preciosPresentacion,
      categoriaIds,
      activo: typeof p?.activo === 'boolean' ? p.activo : true,
    };
  });

export function mapPresentacionesArray(arr: any[]): PresentacionCreateDto[] {
  return (arr ?? []).map((p, i) => {
    const preciosPresentacion = mapPrecioPresentacionArray(
      Array.isArray(p?.preciosPresentacion) ? p?.preciosPresentacion : [],
      `presentaciones[${i}].preciosPresentacion`,
    );

    const categoriaIdsRaw = Array.isArray(p?.categoriaIds)
      ? p.categoriaIds
      : [];
    const categoriaIds = categoriaIdsRaw.map((cid, j) =>
      toIntOrThrow(cid, `presentaciones[${i}].categoriaIds[${j}]`),
    );

    return {
      nombre: cleanStr(p?.nombre),
      codigoBarras: cleanStr(p?.codigoBarras) || undefined,
      esDefault: !!p?.esDefault,

      tipoPresentacionId: toNullableInt(p?.tipoPresentacionId),

      costoReferencialPresentacion: toDecimalStringOrNull(
        p?.costoReferencialPresentacion,
        `presentaciones[${i}].costoReferencialPresentacion`,
      )!, // requerido

      descripcion: cleanStr(p?.descripcion) || null,
      stockMinimo: toNullableInt(p?.stockMinimo),

      preciosPresentacion,
      categoriaIds, // ✅ incluir en el DTO resultante
    };
  });
}

@Controller('products')
export class ProductsController {
  private readonly logger = new Logger(ProductsController.name);
  constructor(private readonly productsService: ProductsService) {}

  // ====== CREATE =============================================================
  @Post()
  @UseInterceptors(
    AnyFilesInterceptor({
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async create(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: Record<string, any>,
  ) {
    this.logger.debug(
      'RAW presentaciones:',
      typeof body.presentaciones,
      body.presentaciones?.slice?.(0, 200),
    );

    const parsed = safeJsonParse<any[]>(
      body.presentaciones,
      [],
      'presentaciones',
    );
    this.logger.debug('Parsed p[0] keys:', Object.keys(parsed?.[0] ?? {}));

    const dtoPlain: Partial<CreateNewProductDto> = {
      nombre: cleanStr(body.nombre),
      descripcion: cleanStr(body.descripcion) || null,
      codigoProducto: cleanStr(body.codigoProducto),
      codigoProveedor: cleanStr(body.codigoProveedor) || null,
      stockMinimo: toNullableInt(body.stockMinimo),
      precioCostoActual: toDecimalStringOrNull(
        body.precioCostoActual,
        'precioCostoActual',
      ),
      creadoPorId: toIntOrThrow(body.creadoPorId, 'creadoPorId'),
      categorias: safeJsonParse<number[]>(body.categorias, [], 'categorias'),
      tipoPresentacionId: toNullableInt(body.tipoPresentacionId),
      precioVenta: mapPrecioProductoArray(
        safeJsonParse<any[]>(body.precioVenta, [], 'precioVenta'),
        'precioVenta',
      ),
      presentaciones: mapPresentacionesArray(
        safeJsonParse<any[]>(body.presentaciones, [], 'presentaciones'),
      ),
    };

    const dto = plainToInstance(CreateNewProductDto, dtoPlain);
    await validateOrReject(dto, {
      whitelist: true,
      forbidNonWhitelisted: true,
    });

    const defaults = (dto.presentaciones ?? []).filter(
      (p) => p.esDefault,
    ).length;
    if (defaults > 1) {
      throw new BadRequestException(
        'Solo puede haber una presentación por defecto',
      );
    }

    for (const f of files) {
      this.logger.debug(
        `file field=${f.fieldname} name=${f.originalname} type=${f.mimetype}`,
      );
    }

    const productImages = files.filter((f) => f.fieldname === 'images');

    const presImages = new Map<number, Express.Multer.File[]>();
    for (const f of files) {
      const m = /^presentaciones\[(\d+)\]\.images$/.exec(f.fieldname);
      if (m) {
        const idx = Number(m[1]);
        if (!presImages.has(idx)) presImages.set(idx, []);
        presImages.get(idx)!.push(f);
      }
    }

    return this.productsService.create(dto, productImages, presImages);
  }

  // ====== GETs ESPECÍFICOS (static primero) =================================

  /** POS (búsqueda y filtros) */
  @Get('get-products-presentations-for-pos')
  async findAllProductToSale(
    @Query(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    dto: newQueryDTO,
  ) {
    return await this.productsService.getProductPresentationsForPOS(dto);
  }

  /** Inventario general */
  @Get('products/for-inventary')
  async getAll(
    @Query(
      new ValidationPipe({
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    )
    dto: QueryParamsInventariado,
  ) {
    return await this.productsService.getProductosPresentacionesForInventary(
      dto,
    );
  }

  /** Transferencias por sucursal */
  @Get('products/to-transfer/:id')
  async findAllProductsToTransfer(@Param('id', ParseIntPipe) id: number) {
    return await this.productsService.findAllProductsToTransfer(id);
  }

  /** Set de stock */
  @Get('products/for-set-stock')
  async findAllProductsToStcok() {
    return await this.productsService.findAllProductsToStcok();
  }

  /** Obtener producto para edición (ruta específica de edición) */
  @Get('product/get-one-product/:id')
  async productToEdit(@Param('id', ParseIntPipe) id: number) {
    return await this.productsService.productToEdit(id);
  }

  /** Productos para crédito */
  @Get('products-to-credit')
  async productToCredit() {
    return await this.productsService.productToCredit();
  }

  /** Historial de precios */
  @Get('historial-price')
  async productHistorialPrecios() {
    return await this.productsService.productHistorialPrecios();
  }

  /** Productos para garantía */
  @Get('product-to-warranty')
  async productToWarranty() {
    return await this.productsService.productToWarranty();
  }

  /** Carga masiva (demo) */
  @Get('carga-masiva')
  async makeCargaMasiva() {
    const ruta = join(process.cwd(), 'src', 'assets', 'productos_ejemplo.csv');
    // return await this.productsService.loadCSVandImportProducts(ruta);
  }

  /** Seed */
  @Get('productos-basicos-gt')
  async run(@Query('creadoPorId', ParseIntPipe) creadoPorId = '1') {
    const uid = Number(creadoPorId) || 1;
    return this.productsService.seedProductosBasicos(uid);
  }

  /** Search */
  @Get('search')
  async getBySearchProducts(
    @Query('q') q: string,
    @Query('sucursalId') sucursalId: string,
  ) {
    try {
      return await this.productsService.getBySearchProducts(q, sucursalId);
    } catch (error) {
      this.logger.error('Error generado en search productos: ', error);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Error inesperado al buscar productos',
      );
    }
  }

  // ====== PATCH específicos (antes del catch-all) ============================
  /** PATCH catch-all por id (con FilesInterceptor simple) */
  @Patch(':id')
  @UseInterceptors(
    AnyFilesInterceptor({ limits: { fileSize: 5 * 1024 * 1024 } }),
  )
  async update(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
    @Body() body: Record<string, any>,
  ) {
    this.logger.debug(
      `PATCH /products/${id} files: ${files.length} -> ` +
        files
          .map(
            (f) =>
              `${f.fieldname}=${f.originalname}(${f.mimetype}, ${f.size}b)`,
          )
          .join(', '),
    );
    const has = (k: string) => Object.prototype.hasOwnProperty.call(body, k);

    const dtoPlain: UpdateProductDto = {
      nombre: cleanStr(body.nombre),
      descripcion: cleanStr(body.descripcion) || null,
      codigoProducto: cleanStr(body.codigoProducto),
      codigoProveedor: cleanStr(body.codigoProveedor) || null,
      stockMinimo: toNullableInt(body.stockMinimo),
      precioCostoActual: toDecimalStringOrNull(
        body.precioCostoActual,
        'precioCostoActual',
      ),
      creadoPorId: toIntOrThrow(body.creadoPorId, 'creadoPorId'),
      categorias: safeJsonParse<number[]>(body.categorias, [], 'categorias'),
      tipoPresentacionId: toNullableInt(body.tipoPresentacionId),
      precioVenta: mapPrecioProductoArray(
        safeJsonParse<any[]>(body.precioVenta, [], 'precioVenta'),
        'precioVenta',
      ),
      presentaciones: mapPresentacionesArrayUpdate(
        safeJsonParse<any[]>(body.presentaciones, [], 'presentaciones'),
      ),

      //nuevo imagenes
      keepProductImageIds: has('keepProductImageIds')
        ? safeJsonParse<number[]>(
            body.keepProductImageIds,
            [],
            'keepProductImageIds',
          )
        : undefined,

      keepPresentationImageIds: has('keepPresentationImageIds')
        ? safeJsonParse<Record<number, number[]>>(
            body.keepPresentationImageIds,
            {},
            'keepPresentationImageIds',
          )
        : undefined,

      deletedPresentationIds: has('deletedPresentationIds')
        ? safeJsonParse<number[]>(
            body.deletedPresentationIds,
            [],
            'deletedPresentationIds',
          )
        : undefined,
    };

    // Agrupar archivos
    const productImages = files.filter((f) => f.fieldname === 'images');
    const presImages = new Map<number, Express.Multer.File[]>();
    for (const f of files) {
      const m = /^presentaciones\[(\d+)\]\.images$/.exec(f.fieldname);
      if (m) {
        const idx = Number(m[1]);
        if (!presImages.has(idx)) presImages.set(idx, []);
        presImages.get(idx)!.push(f);
      }
    }

    // Validaciones adicionales (ej: una sola default)
    const defaults = dtoPlain.presentaciones.filter((p) => p.esDefault).length;
    if (defaults > 1)
      throw new BadRequestException(
        'Solo puede haber una presentación por defecto',
      );

    this.logger.debug(`productImages: ${productImages.length}`);
    this.logger.debug(
      `presImages indexes: ${Array.from(presImages.keys()).join(', ') || '(none)'}`,
    );
    for (const [idx, list] of presImages) {
      this.logger.debug(
        `  pres[${idx}] files: ${list.length} -> ` +
          list.map((f) => f.originalname).join(', '),
      );
    }

    // delegar al servicio
    return this.productsService.update(id, dtoPlain, productImages, presImages);
  }

  // ====== GET/PATCH catch-all por :id (al final para no tapar otros paths) ===

  /** GET catch-all por id */
  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return await this.productsService.getProductDetail(id);
  }

  // ====== DELETEs específicos y catch-all al final ===========================

  @Delete('delete-image-from-product/:id/:imageId')
  async removeImageFromProduct(
    @Param('id') id: string,
    @Param('imageId', ParseIntPipe) imageId: number,
  ) {
    const decodedId = decodeURIComponent(id);
    return this.productsService.removeImageFromProduct(decodedId, imageId);
  }

  @Delete('delete-one-price-from-product/:id')
  async removePrice(@Param('id', ParseIntPipe) id: number) {
    this.logger.log('Eliminando el precio: ' + id);
    return await this.productsService.removePrice(id);
  }

  @Delete('delete-all')
  async removeAll() {
    return await this.productsService.removeAll();
  }

  /** DELETE catch-all por id */
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return await this.productsService.remove(id);
  }
}
