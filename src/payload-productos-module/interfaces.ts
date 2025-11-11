export interface ProductoRaw {
  codigoproducto: string | null;
  nombre: string | null;
  descripcion: string | null;
  codigoproveedor: string | null;
  categorias: string | null; // coma-separado, p.ej. "Ferretería, Pinturas"
  tipoempaque: string | null;
  stockminimo: number | null;
  stockvencimiento: number | string | null; // puede venir como número o texto
  precios: string[]; // coma-separado, p.ej. "12.50, 15.00"
  preciocosto: string | number;
}

export type ProductosArrayRaw = ProductoRaw[];
