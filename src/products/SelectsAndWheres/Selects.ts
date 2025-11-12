import { Prisma } from '@prisma/client';

export const productoSelect = {
  id: true,
  nombre: true,
  codigoProducto: true,
  descripcion: true,
  precioCostoActual: true,
  precios: {
    where: {
      estado: 'APROBADO',
      OR: [
        { tipo: { not: 'CREADO_POR_SOLICITUD' } },
        { AND: [{ tipo: 'CREADO_POR_SOLICITUD' }, { usado: false }] }, // temporales solo si no usados
      ],
    },
    select: {
      id: true,
      estado: true,
      precio: true,
      rol: true,
      tipo: true,
      orden: true,
    },
  },
  stock: {
    select: {
      id: true,
      cantidad: true,
      fechaVencimiento: true,
      fechaIngreso: true,
      precioCosto: true,
      sucursal: { select: { id: true, nombre: true } },
      prorrateoDetalles: {
        select: {
          id: true,
          gastoUnitarioBase: true,
          costoFacturaUnitario: true, // cᵢ
          gastoUnitarioAplicado: true, // a_target = a_base * factor
          costoUnitarioResultante: true, // uᵢ = cᵢ + a_target
          inversionLinea: true, // Lᵢ = cantidadTarget * u

          existenciasPrevias: true,
          inversionPrevias: true,
          nuevasExistencias: true,
          costoProrrateadoTotalInversion: true,
          costoUnitarioProrrateado: true, // promedio ponderado final (lo “core”)

          creadoEn: true,
        },
      },
    },
  },
  stockThreshold: { select: { id: true, stockMinimo: true } },
  categorias: { select: { id: true, nombre: true } },
  imagenesProducto: {
    select: {
      url: true,
    },
  },
} satisfies Prisma.ProductoSelect;

export const presentacionSelect = {
  id: true,
  nombre: true,
  codigoBarras: true,
  tipoPresentacion: true,
  creadoEn: true,
  actualizadoEn: true,
  esDefault: true,
  costoReferencialPresentacion: true,
  descripcion: true,
  precios: {
    where: {
      estado: 'APROBADO',
      OR: [
        { tipo: { not: 'CREADO_POR_SOLICITUD' } },
        { AND: [{ tipo: 'CREADO_POR_SOLICITUD' }, { usado: false }] }, // temporales solo si no usados
      ],
    },
    select: {
      id: true,
      estado: true,
      orden: true,
      precio: true,
      rol: true,
      tipo: true,
    },
  },
  //   descripcion: true,
  stockPresentaciones: {
    select: {
      id: true,
      cantidadPresentacion: true,
      fechaVencimiento: true,
      fechaIngreso: true,
      // opcionalmente costo/pc para UI
      costoTotal: true, // si lo vas a mostrar
      precioCosto: true, // si lo vas a mostrar
      sucursal: { select: { id: true, nombre: true } },
      prorrateoDetalles: {
        select: {
          id: true,
          gastoUnitarioBase: true,
          costoFacturaUnitario: true, // cᵢ
          gastoUnitarioAplicado: true, // a_target = a_base * factor
          costoUnitarioResultante: true, // uᵢ = cᵢ + a_target
          inversionLinea: true, // Lᵢ = cantidadTarget * u

          existenciasPrevias: true,
          inversionPrevias: true,
          nuevasExistencias: true,
          costoProrrateadoTotalInversion: true,
          costoUnitarioProrrateado: true, // promedio ponderado final (lo “core”)

          creadoEn: true,
        },
      },
    },
  },
  producto: {
    select: {
      id: true,
      imagenesProducto: {
        select: {
          url: true,
        },
      },
    },
  },
} satisfies Prisma.ProductoPresentacionSelect; //AJUSTAR LA FLAG: los selects internos se tipean

// TYPES BASADOS EN SELECTS
export type ProductoWithSelect = Prisma.ProductoGetPayload<{
  select: typeof productoSelect;
}>;

export type PresentacionWithSelect = Prisma.ProductoPresentacionGetPayload<{
  select: typeof presentacionSelect;
}>;
