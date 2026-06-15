// Modelo de dominio. Fuente única de verdad para toda la app.
// Diseñado para mapear 1:1 con tablas de PostgreSQL en Fase 2.

export type ID = string;

export type Local = {
  id: ID;
  nombre: string;
  direccion: string;
  password: string;
  activo: boolean;
  creadoEn: string;
};

export type Producto = {
  id: ID;
  localId: ID;
  nombre: string;
  valor: number;
  creadoEn: string;
};

export type Domiciliario = {
  id: ID;
  localId: ID;
  nombreCompleto: string;
  correo: string;
  whatsapp: string;
  identificacion: string;
  fotoUrl: string; // dataURL o URL
  creadoEn: string;
};

export type Mesa = {
  id: ID;
  localId: ID;
  nombre: string; // p.ej. "Mesa 1"
  creadoEn: string;
};

export type Gasto = {
  id: ID;
  localId: ID;
  descripcion: string;
  medioPago: MetodoPago;
  valor: number;
  creadoEn: string;
};

export type MetodoPago =
  | "efectivo"
  | "nequi"
  | "bancolombia"
  | "daviplata"
  | "datafono";

export type TipoFactura = "mesa" | "domicilio";

export type EstadoFactura = "pendiente" | "listo" | "completado";

export type ItemFactura = {
  productoId: ID;
  nombre: string;
  valor: number;
  cantidad: number;
  observacion?: string;
  // Edición inteligente (Fase 2): marca productos agregados tras la preparación.
  nuevo?: boolean;
};

export type Factura = {
  id: ID;
  localId: ID;
  consecutivo: number;
  tipo: TipoFactura;
  estado: EstadoFactura;
  // Mesa
  mesaId?: ID;
  mesaNombre?: string;
  // Domicilio
  clienteNombre?: string;
  clienteWhatsapp?: string;
  direccion?: string;
  barrio?: string;
  valorDomicilio?: number;
  // Comunes
  items: ItemFactura[];
  metodoPago: MetodoPago;
  subtotal: number;
  total: number;
  creadoEn: string;
  // Despacho
  despachado: boolean;
  // Fase 2: asignación de domicilio a un domiciliario
  domiciliarioId?: ID;
  // Fase 2: mesa ya servida (cajón tipo playlist en despachador)
  servida?: boolean;
  // Fase 2: reserva de domicilio para preparar en una fecha futura (YYYY-MM-DD).
  // Mientras la fecha no llegue, no aparece en Cocina.
  fechaProgramada?: string;
};

export type Rol = "cocina" | "facturacion" | "despachador" | "admin" | "cajero";
