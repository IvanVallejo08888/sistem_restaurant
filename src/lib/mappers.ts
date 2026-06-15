// Mapeo entre filas de Postgres (snake_case) y el modelo de dominio (camelCase).
// Postgres devuelve los "numeric" como string, por eso se convierten con Number().

import {
  Local, Producto, Domiciliario, Mesa, Factura, Gasto,
} from "@/types";

// ---------- Locales ----------

export const rowToLocal = (r: any): Local => ({
  id: r.id,
  nombre: r.nombre,
  direccion: r.direccion,
  password: r.password,
  activo: r.activo,
  creadoEn: r.creado_en,
});

export const localToRow = (l: Local) => ({
  id: l.id,
  nombre: l.nombre,
  direccion: l.direccion,
  password: l.password,
  activo: l.activo,
  creado_en: l.creadoEn,
});

export const localPatchToRow = (p: Partial<Local>) => {
  const row: Record<string, unknown> = {};
  if (p.nombre !== undefined) row.nombre = p.nombre;
  if (p.direccion !== undefined) row.direccion = p.direccion;
  if (p.password !== undefined) row.password = p.password;
  if (p.activo !== undefined) row.activo = p.activo;
  return row;
};

// ---------- Productos ----------

export const rowToProducto = (r: any): Producto => ({
  id: r.id,
  localId: r.local_id,
  nombre: r.nombre,
  valor: Number(r.valor),
  creadoEn: r.creado_en,
});

export const productoToRow = (p: Producto) => ({
  id: p.id,
  local_id: p.localId,
  nombre: p.nombre,
  valor: p.valor,
  creado_en: p.creadoEn,
});

export const productoPatchToRow = (p: Partial<Producto>) => {
  const row: Record<string, unknown> = {};
  if (p.localId !== undefined) row.local_id = p.localId;
  if (p.nombre !== undefined) row.nombre = p.nombre;
  if (p.valor !== undefined) row.valor = p.valor;
  return row;
};

// ---------- Domiciliarios ----------

export const rowToDomiciliario = (r: any): Domiciliario => ({
  id: r.id,
  localId: r.local_id,
  nombreCompleto: r.nombre_completo,
  correo: r.correo,
  whatsapp: r.whatsapp,
  identificacion: r.identificacion,
  fotoUrl: r.foto_url,
  creadoEn: r.creado_en,
});

export const domiciliarioToRow = (d: Domiciliario) => ({
  id: d.id,
  local_id: d.localId,
  nombre_completo: d.nombreCompleto,
  correo: d.correo,
  whatsapp: d.whatsapp,
  identificacion: d.identificacion,
  foto_url: d.fotoUrl,
  creado_en: d.creadoEn,
});

export const domiciliarioPatchToRow = (d: Partial<Domiciliario>) => {
  const row: Record<string, unknown> = {};
  if (d.localId !== undefined) row.local_id = d.localId;
  if (d.nombreCompleto !== undefined) row.nombre_completo = d.nombreCompleto;
  if (d.correo !== undefined) row.correo = d.correo;
  if (d.whatsapp !== undefined) row.whatsapp = d.whatsapp;
  if (d.identificacion !== undefined) row.identificacion = d.identificacion;
  if (d.fotoUrl !== undefined) row.foto_url = d.fotoUrl;
  return row;
};

// ---------- Mesas ----------

export const rowToMesa = (r: any): Mesa => ({
  id: r.id,
  localId: r.local_id,
  nombre: r.nombre,
  creadoEn: r.creado_en,
});

export const mesaToRow = (m: Mesa) => ({
  id: m.id,
  local_id: m.localId,
  nombre: m.nombre,
  creado_en: m.creadoEn,
});

export const mesaPatchToRow = (m: Partial<Mesa>) => {
  const row: Record<string, unknown> = {};
  if (m.localId !== undefined) row.local_id = m.localId;
  if (m.nombre !== undefined) row.nombre = m.nombre;
  return row;
};

// ---------- Facturas ----------

export const rowToFactura = (r: any): Factura => ({
  id: r.id,
  localId: r.local_id,
  consecutivo: r.consecutivo,
  tipo: r.tipo,
  estado: r.estado,
  mesaId: r.mesa_id ?? undefined,
  mesaNombre: r.mesa_nombre ?? undefined,
  clienteNombre: r.cliente_nombre ?? undefined,
  clienteWhatsapp: r.cliente_whatsapp ?? undefined,
  direccion: r.direccion ?? undefined,
  barrio: r.barrio ?? undefined,
  valorDomicilio: r.valor_domicilio != null ? Number(r.valor_domicilio) : undefined,
  items: r.items ?? [],
  metodoPago: r.metodo_pago,
  subtotal: Number(r.subtotal),
  total: Number(r.total),
  creadoEn: r.creado_en,
  despachado: r.despachado,
  domiciliarioId: r.domiciliario_id ?? undefined,
  servida: r.servida ?? undefined,
  fechaProgramada: r.fecha_programada ?? undefined,
});

export const facturaToRow = (f: Factura) => ({
  id: f.id,
  local_id: f.localId,
  consecutivo: f.consecutivo,
  tipo: f.tipo,
  estado: f.estado,
  mesa_id: f.mesaId ?? null,
  mesa_nombre: f.mesaNombre ?? null,
  cliente_nombre: f.clienteNombre ?? null,
  cliente_whatsapp: f.clienteWhatsapp ?? null,
  direccion: f.direccion ?? null,
  barrio: f.barrio ?? null,
  valor_domicilio: f.valorDomicilio ?? null,
  items: f.items,
  metodo_pago: f.metodoPago,
  subtotal: f.subtotal,
  total: f.total,
  creado_en: f.creadoEn,
  despachado: f.despachado,
  domiciliario_id: f.domiciliarioId ?? null,
  servida: f.servida ?? null,
  fecha_programada: f.fechaProgramada ?? null,
});

// ---------- Gastos ----------

export const rowToGasto = (r: any): Gasto => ({
  id: r.id,
  localId: r.local_id,
  descripcion: r.descripcion,
  medioPago: r.medio_pago,
  valor: Number(r.valor),
  creadoEn: r.creado_en,
});

export const gastoToRow = (g: Gasto) => ({
  id: g.id,
  local_id: g.localId,
  descripcion: g.descripcion,
  medio_pago: g.medioPago,
  valor: g.valor,
  creado_en: g.creadoEn,
});

export const facturaPatchToRow = (f: Partial<Factura>) => {
  const row: Record<string, unknown> = {};
  if (f.localId !== undefined) row.local_id = f.localId;
  if (f.consecutivo !== undefined) row.consecutivo = f.consecutivo;
  if (f.tipo !== undefined) row.tipo = f.tipo;
  if (f.estado !== undefined) row.estado = f.estado;
  if (f.mesaId !== undefined) row.mesa_id = f.mesaId;
  if (f.mesaNombre !== undefined) row.mesa_nombre = f.mesaNombre;
  if (f.clienteNombre !== undefined) row.cliente_nombre = f.clienteNombre;
  if (f.clienteWhatsapp !== undefined) row.cliente_whatsapp = f.clienteWhatsapp;
  if (f.direccion !== undefined) row.direccion = f.direccion;
  if (f.barrio !== undefined) row.barrio = f.barrio;
  if (f.valorDomicilio !== undefined) row.valor_domicilio = f.valorDomicilio;
  if (f.items !== undefined) row.items = f.items;
  if (f.metodoPago !== undefined) row.metodo_pago = f.metodoPago;
  if (f.subtotal !== undefined) row.subtotal = f.subtotal;
  if (f.total !== undefined) row.total = f.total;
  if (f.despachado !== undefined) row.despachado = f.despachado;
  if (f.domiciliarioId !== undefined) row.domiciliario_id = f.domiciliarioId;
  if (f.servida !== undefined) row.servida = f.servida;
  if (f.fechaProgramada !== undefined) row.fecha_programada = f.fechaProgramada;
  return row;
};
