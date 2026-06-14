// Cálculos de reportes, caja y cajero. Reglas de negocio centralizadas.

import { Factura, MetodoPago } from "@/types";
import { esTransferencia } from "./factura";

// Filtra facturas de un local creadas hoy (zona horaria local del navegador).
export const esDeHoy = (iso: string) => {
  const d = new Date(iso);
  const h = new Date();
  return d.getFullYear() === h.getFullYear() &&
    d.getMonth() === h.getMonth() &&
    d.getDate() === h.getDate();
};

export const facturasDelDia = (facturas: Factura[], localId: string) =>
  facturas.filter((f) => f.localId === localId && esDeHoy(f.creadoEn));

// Caja del día: total por método de pago (solo los métodos usados).
export const cajaPorMetodo = (facturas: Factura[]) => {
  const acc: Partial<Record<MetodoPago, number>> = {};
  facturas.forEach((f) => {
    acc[f.metodoPago] = (acc[f.metodoPago] || 0) + f.total;
  });
  return acc;
};

export const cajaTotal = (facturas: Factura[]) =>
  facturas.reduce((a, f) => a + f.total, 0);

// Utilidad simple del día (sin costos detallados en esta fase): total - gastos.
export const utilidadDia = (facturas: Factura[], gastos = 0) =>
  cajaTotal(facturas) - gastos;

// Ranking de barrios con más pedidos (domicilios).
export const rankingBarrios = (facturas: Factura[]) => {
  const m = new Map<string, number>();
  facturas.filter((f) => f.tipo === "domicilio" && f.barrio).forEach((f) => {
    m.set(f.barrio!, (m.get(f.barrio!) || 0) + 1);
  });
  return [...m.entries()].map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total);
};

// Ranking de clientes (por WhatsApp) con más pedidos.
export const rankingClientes = (facturas: Factura[]) => {
  const m = new Map<string, { nombre: string; total: number }>();
  facturas.filter((f) => f.tipo === "domicilio" && f.clienteWhatsapp).forEach((f) => {
    const k = f.clienteWhatsapp!;
    const prev = m.get(k);
    m.set(k, { nombre: f.clienteNombre || k, total: (prev?.total || 0) + 1 });
  });
  return [...m.entries()].map(([whatsapp, v]) => ({ whatsapp, ...v }))
    .sort((a, b) => b.total - a.total);
};

// Productos más y menos vendidos (por unidades).
export const rankingProductos = (facturas: Factura[]) => {
  const m = new Map<string, number>();
  facturas.forEach((f) => f.items.forEach((it) => {
    m.set(it.nombre, (m.get(it.nombre) || 0) + it.cantidad);
  }));
  const arr = [...m.entries()].map(([nombre, unidades]) => ({ nombre, unidades }))
    .sort((a, b) => b.unidades - a.unidades);
  return arr;
};

// Cajero: efectivo a entregar por un domiciliario.
// Regla: en facturas en efectivo se suma solo productos (subtotal, sin domicilio).
//        en facturas por transferencia se RESTA únicamente el domicilio.
export const efectivoAEntregar = (facturasDomiciliario: Factura[]) => {
  let total = 0;
  facturasDomiciliario.forEach((f) => {
    if (f.metodoPago === "efectivo") {
      total += f.subtotal; // solo productos
    } else {
      total -= f.valorDomicilio || 0; // restar el domicilio
    }
  });
  return total;
};

// Ingresos de mesas separados por método de pago.
export const ingresosMesasPorMetodo = (facturas: Factura[]) =>
  cajaPorMetodo(facturas.filter((f) => f.tipo === "mesa"));

// Ingresos por domiciliario, separando efectivo/transferencia (sin sumar domicilios).
export const ingresosPorDomiciliario = (facturas: Factura[], domiciliarioId: string) => {
  const fs = facturas.filter((f) => f.tipo === "domicilio" && f.domiciliarioId === domiciliarioId);
  let efectivo = 0, transferencia = 0;
  fs.forEach((f) => {
    if (esTransferencia(f.metodoPago)) transferencia += f.subtotal;
    else efectivo += f.subtotal;
  });
  return { efectivo, transferencia, cantidad: fs.length };
};
