// Tipos de retorno para la página de edición de stock

export type StockKind = 'PRODUCTO' | 'PRESENTACION';

export interface StockToEditResponseBase {
  kind: StockKind;
  id: number;

  // Datos de producto / sucursal
  productoId: number;
  productoNombre: string;
  codigoProducto?: string;

  sucursalId: number;
  sucursalNombre: string;

  // Solo lectura (UI muestra pero no edita)
  cantidad: number;
  precioCosto?: number;

  // Fechas editables
  fechaIngreso: string; // ISO
  fechaVencimiento?: string | null; // ISO | null
}

export interface StockToEditProducto extends StockToEditResponseBase {
  kind: 'PRODUCTO';
}

export interface StockToEditPresentacion extends StockToEditResponseBase {
  kind: 'PRESENTACION';
  presentacionId: number;
  presentacionNombre: string;
}

export type StockToEditResponse = StockToEditProducto | StockToEditPresentacion;
