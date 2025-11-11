import {
  BadRequestException,
  HttpException,
  Injectable,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { CreatePayloadProductosModuleDto } from './dto/create-payload-productos-module.dto';
import { UpdatePayloadProductosModuleDto } from './dto/update-payload-productos-module.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { rawPayloadDataProducts } from 'src/assets/FARMACIA-BOTIQUIN-JSON';
import { ProductoRaw } from './interfaces';
import { Prisma, PrismaClient } from '@prisma/client';
//para meter los precios

function trimOrNull(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length ? s : null;
}

function isNonEmptyString(v: unknown): v is string {
  return typeof v === 'string' && v.trim().length > 0;
}

function splitCategorias(v: unknown): string[] {
  if (Array.isArray(v)) {
    return v
      .flatMap((x) =>
        String(x)
          .split(',')
          .map((p) => p.trim()),
      )
      .filter((s) => s.length > 0);
  }
  if (!isNonEmptyString(v)) return [];
  return String(v)
    .split(',')
    .map((p) => p.trim())
    .filter((s) => s.length > 0);
}

/**
 * Normaliza importes en formatos:
 *  "1.234,56" -> 1234.56
 *  "1,234.56" -> 1234.56
 *  "1234,56"  -> 1234.56
 *  "1234.56"  -> 1234.56
 *  "120"      -> 120
 * Retorna number | null si no parsea.
 */
function parseMoney(input: unknown): number | null {
  if (input === null || input === undefined) return null;
  if (typeof input === 'number' && Number.isFinite(input)) return input;

  let s = String(input).trim();
  if (!s) return null;

  // quita símbolos no numéricos salvo , . y -
  s = s.replace(/[^\d.,-]/g, '');

  const hasComma = s.includes(',');
  const hasDot = s.includes('.');

  if (hasComma && hasDot) {
    const lastComma = s.lastIndexOf(',');
    const lastDot = s.lastIndexOf('.');
    if (lastComma > lastDot) {
      // coma decimal -> quitar puntos de miles, coma -> punto
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      // punto decimal -> quitar comas de miles
      s = s.replace(/,/g, '');
    }
  } else if (hasComma && !hasDot) {
    // asumir coma decimal
    s = s.replace(',', '.');
  } else {
    // punto decimal o entero; quitar comas perdidas
    s = s.replace(/,/g, '');
  }

  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseEntero(input: unknown, defaultValue = 0): number {
  const n = parseMoney(input);
  if (n === null) return defaultValue;
  return Math.trunc(n);
}

function ensurePrecioDecimal(value: number): Prisma.Decimal {
  // Prisma acepta number, pero Decimal te protege de binario
  return new Prisma.Decimal(value.toFixed(2));
}

function normalizeProveedorCode(v: unknown): string | null {
  if (v == null) return null;
  const s = String(v).trim();
  if (!s) return null;
  const low = s.toLowerCase();
  if (
    ['n/a', 'na', 's/n', 'sn', '-', '--', 'sin', 'null', 'none'].includes(low)
  )
    return null;
  return s;
}

@Injectable()
export class PayloadProductosModuleService {
  private readonly logger = new Logger(PayloadProductosModuleService.name);
  constructor(private readonly prisma: PrismaService) {}

  //retorno producto creado
  /**
   * Crea/actualiza 1 producto completo (producto + tipoPresentacion + categorias + precios)
   * en UNA transacción. Retorna el id del producto.
   */
  private async upsertProductoTx(
    tx: PrismaClient | Prisma.TransactionClient,
    p: ProductoRaw,
  ): Promise<number> {
    // -------- Validaciones mínimas
    const codigoProducto = trimOrNull(p.codigoproducto);
    const nombre = trimOrNull(p.nombre);
    const descripcion = trimOrNull(p.descripcion);
    const tipoEmpaque = trimOrNull(p.tipoempaque);
    const categorias = splitCategorias(p.categorias);
    const stockMinimo = parseEntero(p.stockminimo, 0);
    let codigoProveedor = normalizeProveedorCode(p.codigoproveedor);

    if (codigoProveedor) {
      const holder = await tx.producto.findUnique({
        where: { codigoProveedor }, // esto existe porque es único en el schema actual
        select: { id: true, codigoProducto: true },
      });
      if (holder && holder.codigoProducto !== codigoProducto) {
        this.logger.warn(
          `codigoProveedor duplicado "${codigoProveedor}" para codigoProducto=${codigoProducto}. Se guardará como NULL.`,
        );
        codigoProveedor = null;
      }
    }

    if (!codigoProducto) {
      throw new BadRequestException('Falta codigoproducto');
    }
    if (!nombre) {
      throw new BadRequestException(
        `Falta nombre para codigoProducto=${codigoProducto}`,
      );
    }

    // Costo obligatorio:
    const costo = parseMoney(p.preciocosto);
    if (costo === null) {
      throw new BadRequestException(
        `preciocosto inválido para codigoProducto=${codigoProducto}`,
      );
    }

    // -------- Upsert del producto base (idempotente por codigoProducto único)
    const producto = await tx.producto.upsert({
      where: { codigoProducto },
      create: {
        codigoProducto,
        nombre,
        descripcion: descripcion ?? undefined,
        codigoProveedor: codigoProveedor ?? undefined,
        precioCostoActual: costo,
        stockThreshold: {
          create: {
            stockMinimo: stockMinimo,
          },
        },
      },
      update: {
        nombre,
        descripcion: descripcion ?? undefined,
        ...(codigoProveedor ? { codigoProveedor } : {}),
        precioCostoActual: costo,
        stockThreshold: {
          create: {
            stockMinimo: stockMinimo,
          },
        },
      },
      select: { id: true },
    });

    // -------- Tipo de empaque (opcional)
    if (tipoEmpaque) {
      await tx.tipoPresentacion.upsert({
        where: { nombre: tipoEmpaque },
        create: {
          nombre: tipoEmpaque,
          activo: true,
          descripcion: '',
          productos: { connect: { id: producto.id } },
        },
        update: {
          productos: { connect: { id: producto.id } },
        },
      });
    }

    // -------- Categorías (opcionales)
    if (categorias.length > 0) {
      for (const cat of categorias) {
        await tx.categoria.upsert({
          where: { nombre: cat },
          create: {
            nombre: cat,
            productos: { connect: { id: producto.id } },
          },
          update: {
            productos: { connect: { id: producto.id } },
          },
        });
      }
    }

    // -------- Precios (array de strings -> números)
    // Nota: aquí no borramos precios previos; si quieres idempotencia por (producto, rol, orden) usa upsert compuesto.
    const preciosStr: string[] = Array.isArray(p.precios)
      ? (p.precios as string[])
      : isNonEmptyString(p.precios)
        ? String(p.precios)
            .split(',')
            .map((x) => x.trim())
            .filter(Boolean)
        : [];

    for (let i = 0; i < preciosStr.length; i++) {
      const n = parseMoney(preciosStr[i]);
      if (n === null) {
        this.logger.warn(
          `Precio inválido ignorado: "${preciosStr[i]}" para codigoProducto=${codigoProducto}`,
        );
        continue;
      }
      await tx.precioProducto.create({
        data: {
          estado: 'APROBADO',
          orden: i + 1, // 1-based
          precio: ensurePrecioDecimal(n),
          rol: 'PUBLICO',
          tipo: 'ESTANDAR',
          producto: { connect: { id: producto.id } },
        },
      });
    }

    return producto.id;
  }

  /**
   * Carga masiva: procesa cada producto en su **propia transacción**.
   * Devuelve resumen con contadores y errores.
   */
  async cargaMasiva() {
    // Importa tu payload como sea que lo tengas disponible
    // (ej. import productosRaw from 'src/assets/farmacia-botiquin.json')
    // Aquí asumimos una variable global/externa como en tu ejemplo:
    // const rawPayloadDataProducts: ProductoRaw[] = ...
    // @ts-ignore
    const data: ProductoRaw[] = rawPayloadDataProducts;

    try {
      if (!Array.isArray(data)) {
        throw new BadRequestException('Payload inválido: se esperaba un array');
      }

      const total = data.length;
      let successCount = 0;
      const createdIds: number[] = [];
      const failures: Array<{
        index: number;
        codigoProducto?: string | null;
        error: string;
      }> = [];

      for (let index = 0; index < data.length; index++) {
        const p = data[index];
        const codigoProducto = trimOrNull(p?.codigoproducto);

        try {
          const id = await this.prisma.$transaction(async (tx) => {
            return this.upsertProductoTx(tx, p);
          });

          successCount++;
          createdIds.push(id);
          this.logger.log(
            `✔️ Producto procesado OK (index=${index}) codigoProducto=${codigoProducto}`,
          );
        } catch (err: any) {
          const msg =
            err instanceof HttpException
              ? err.message
              : err?.message || 'Error desconocido';

          failures.push({
            index,
            codigoProducto,
            error: msg,
          });

          // Log detallado con stack si existe
          this.logger.error(
            `❌ Falló producto (index=${index}) codigoProducto=${codigoProducto}: ${msg}`,
            err?.stack,
          );
          // Continuamos con el siguiente producto
        }
      }

      const failedCount = failures.length;

      const resumen = {
        total,
        successCount,
        failedCount,
        createdIds,
        failures, // [{index, codigoProducto, error}]
      };

      this.logger.log(
        `Resumen carga masiva -> total=${total}, ok=${successCount}, fail=${failedCount}`,
      );

      return resumen;
    } catch (error) {
      this.logger.error('Error fatal en carga masiva', error?.stack);
      if (error instanceof HttpException) throw error;
      throw new InternalServerErrorException(
        'Fatal error: Error inesperado en módulo carga masiva',
      );
    }
  }

  //Deshacer cambio
  async deleteAllProductos() {
    try {
      await this.prisma.$transaction(async (tx) => {
        // ⚠️ Ajusta la lista con tus tablas “raíz” que quieres vaciar.
        // CASCADE limpia dependientes (precios, stock, joins M2M, etc.)
        await tx.$executeRawUnsafe(`
          TRUNCATE TABLE
            "Producto",
            "Categoria",
            "TipoPresentacion",
            "StockThreshold"
          RESTART IDENTITY CASCADE;
        `);
      });

      this.logger.log('TRUNCATE CASCADE completado (PostgreSQL).');
      return { ok: true };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError) {
        this.logger.error(
          `Prisma ${e.code} meta=${JSON.stringify(e.meta)}`,
          e.stack,
        );
      } else {
        this.logger.error('Error en TRUNCATE CASCADE', (e as any)?.stack);
      }
      throw e;
    }
  }
}
