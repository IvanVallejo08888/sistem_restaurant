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
  deletedAt?: string;
};

export type CategoriaProducto = "heladeria" | "comidas-rapidas";

export type Producto = {
  id: ID;
  localId: ID;
  nombre: string;
  valor: number;
  categoria: CategoriaProducto;
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
  | "datafono"
  | "mixto"
  | "domiciliario";

// Aplica cuando metodoPago === "mixto" (en facturas normales y en favor)
export type MedioTransferencia = "nequi" | "bancolombia" | "daviplata" | "datafono";

export type TipoFactura = "mesa" | "domicilio" | "favor" | "reserva-domicilio" | "reserva-mesa";

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
  domiciliarioId?: ID;
  servida?: boolean;
  // Reservas: fecha (YYYY-MM-DD) y hora (HH:MM) en que se debe preparar.
  // No aparece en Cocina antes de la fecha programada.
  fechaProgramada?: string;
  horaReserva?: string;
  // Favor: campos específicos del tipo "favor"
  nombreFavor?: string;
  medioTransferencia?: MedioTransferencia; // solo si metodoPago === "mixto"
  descuentoDomiciliario?: number; // descuento calculado al domiciliario asignado
  // Pago mixto (efectivo + transferencia en la misma factura)
  valorEfectivo?: number;       // parte pagada en efectivo (solo cuando metodoPago === "mixto")
  valorTransferencia?: number;  // parte pagada por transferencia (solo cuando metodoPago === "mixto")
  // Validaciones de cocina (persisten en Supabase para sobrevivir recargas)
  heladeriaLista?: boolean;  // sección heladería completada por cocina
  comidasListas?: boolean;   // sección comidas rápidas completada por cocina
  // Soft delete: no se elimina físicamente, solo se marca con fecha
  deletedAt?: string;
};

export type Rol = "cocina" | "facturacion" | "despachador" | "admin" | "cajero";
