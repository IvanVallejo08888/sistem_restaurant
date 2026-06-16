// Cálculos de reportes, caja y cajero. Reglas de negocio centralizadas.

import { Factura, Gasto, MetodoPago, Producto } from "@/types";
import { esTransferencia } from "./factura";

// ── Filtros de fecha ──────────────────────────────────────────────────────────

export const esDeHoy = (iso: string) => {
  const d = new Date(iso);
  const h = new Date();
  return d.getFullYear() === h.getFullYear() &&
    d.getMonth() === h.getMonth() &&
    d.getDate() === h.getDate();
};

export const facturasDelDia = (facturas: Factura[], localId: string) =>
  facturas.filter((f) => f.localId === localId && esDeHoy(f.creadoEn));

export const gastosDelDia = (gastos: Gasto[], localId: string) =>
  gastos.filter((g) => g.localId === localId && esDeHoy(g.creadoEn));

// ── Resumen por los 5 métodos estándar (mixto-aware) ─────────────────────────

export type ResumenMetodos = {
  efectivo: number;
  nequi: number;
  bancolombia: number;
  daviplata: number;
  datafono: number;
};

export const resumenMetodosVacio = (): ResumenMetodos => ({
  efectivo: 0, nequi: 0, bancolombia: 0, daviplata: 0, datafono: 0,
});

// Suma UNA factura al resumen por método.
// - mixto → valorEfectivo va a efectivo, valorTransferencia va al medioTransferencia.
// - domiciliario → excluido (el domiciliario lo paga de su propio bolsillo).
// - cualquier otro → f.total va al método correspondiente.
const _agregarAlResumen = (r: ResumenMetodos, f: Factura) => {
  if (f.metodoPago === "domiciliario") return;
  if (f.metodoPago === "mixto") {
    r.efectivo += f.valorEfectivo ?? 0;
    const m = f.medioTransferencia as keyof ResumenMetodos | undefined;
    if (m && m in r) r[m] += f.valorTransferencia ?? 0;
    return;
  }
  const m = f.metodoPago as keyof ResumenMetodos;
  if (m in r) r[m] += f.total;
};

export const cajaPorMetodosCompleto = (facturas: Factura[]): ResumenMetodos => {
  const r = resumenMetodosVacio();
  facturas.forEach((f) => _agregarAlResumen(r, f));
  return r;
};

export const totalResumen = (r: ResumenMetodos) =>
  r.efectivo + r.nequi + r.bancolombia + r.daviplata + r.datafono;

export const transferenciaResumen = (r: ResumenMetodos) =>
  r.nequi + r.bancolombia + r.daviplata + r.datafono;

// ── Totales globales ──────────────────────────────────────────────────────────

export const cajaTotal = (facturas: Factura[]) => totalResumen(cajaPorMetodosCompleto(facturas));

// Retrocompatibilidad: efectivo vs transferencias (usado en DetalleCajero)
export const cajaEfectivoVsTransferencia = (facturas: Factura[]) => {
  const r = cajaPorMetodosCompleto(facturas);
  const efectivo = r.efectivo;
  const transferencia = transferenciaResumen(r);
  const porMetodoTransferencia: Partial<Record<MetodoPago, number>> = {};
  if (r.nequi > 0) porMetodoTransferencia.nequi = r.nequi;
  if (r.bancolombia > 0) porMetodoTransferencia.bancolombia = r.bancolombia;
  if (r.daviplata > 0) porMetodoTransferencia.daviplata = r.daviplata;
  if (r.datafono > 0) porMetodoTransferencia.datafono = r.datafono;
  return { efectivo, transferencia, porMetodoTransferencia };
};

export const cajaPorMetodo = (facturas: Factura[]) => {
  const r = cajaPorMetodosCompleto(facturas);
  const acc: Partial<Record<MetodoPago, number>> = {};
  (Object.entries(r) as [MetodoPago, number][]).forEach(([k, v]) => { if (v > 0) acc[k] = v; });
  return acc;
};

// ── Gastos ────────────────────────────────────────────────────────────────────

export const totalGastos = (gastos: Gasto[]) => gastos.reduce((a, g) => a + g.valor, 0);
export const totalGastosEfectivo = (gastos: Gasto[]) =>
  gastos.filter((g) => g.medioPago === "efectivo").reduce((a, g) => a + g.valor, 0);

// ── Utilidad del día ──────────────────────────────────────────────────────────

// Ingresos (excluyendo favores) - gastos empresariales - total de favores del día.
// Desglose por método: ingresos[método] - gastos[método].
// Los favores se descuentan globalmente de efectivo como simplificación.
export const utilidadDelDia = (facturas: Factura[], gastos: Gasto[]) => {
  const normales = facturas.filter((f) => f.tipo !== "favor");
  const totalFavores = facturas
    .filter((f) => f.tipo === "favor")
    .reduce((s, f) => s + (f.valorEfectivo ?? (f.metodoPago !== "domiciliario" ? f.total : 0)), 0);

  const ingresos = cajaPorMetodosCompleto(normales);
  const gastosM = resumenMetodosVacio();
  gastos.forEach((g) => {
    const k = g.medioPago as keyof ResumenMetodos;
    if (k in gastosM) gastosM[k] += g.valor;
  });
  // Favores como gasto en efectivo (aproximación: todos restan del efectivo neto)
  gastosM.efectivo += totalFavores;

  const porMetodo: ResumenMetodos = {
    efectivo: ingresos.efectivo - gastosM.efectivo,
    nequi: ingresos.nequi - gastosM.nequi,
    bancolombia: ingresos.bancolombia - gastosM.bancolombia,
    daviplata: ingresos.daviplata - gastosM.daviplata,
    datafono: ingresos.datafono - gastosM.datafono,
  };

  const utilidad = totalResumen(ingresos) - totalResumen(gastosM);
  return { utilidad, porMetodo, totalFavores };
};

// ── Estadísticas de domicilios ────────────────────────────────────────────────

// Total de ingresos de domicilios (domicilio + reserva-domicilio) por domiciliario.
export const cajaDomiciliosPorDomiciliario = (
  facturas: Factura[],
  domiciliarios: { id: string; nombreCompleto: string }[]
) => {
  const domFs = facturas.filter(
    (f) => f.tipo === "domicilio" || f.tipo === "reserva-domicilio"
  );
  const total = totalResumen(cajaPorMetodosCompleto(domFs));
  const porDomiciliario = new Map<string, { nombre: string; total: number }>();
  domFs.forEach((f) => {
    if (!f.domiciliarioId) return;
    const prev = porDomiciliario.get(f.domiciliarioId) ?? { nombre: "", total: 0 };
    const dom = domiciliarios.find((d) => d.id === f.domiciliarioId);
    porDomiciliario.set(f.domiciliarioId, {
      nombre: dom?.nombreCompleto ?? "Domiciliario",
      total: prev.total + f.total,
    });
  });
  return { total, porDomiciliario: [...porDomiciliario.values()] };
};

// Ingresos por concepto de envío (valorDomicilio) desglosados por método.
export const cajaIngresosDomicilios = (facturas: Factura[]): ResumenMetodos & { total: number } => {
  const domFs = facturas.filter(
    (f) => (f.tipo === "domicilio" || f.tipo === "reserva-domicilio") && (f.valorDomicilio ?? 0) > 0
  );
  const r = resumenMetodosVacio();
  domFs.forEach((f) => {
    const vd = f.valorDomicilio ?? 0;
    if (vd === 0 || f.total === 0) return;
    if (f.metodoPago === "domiciliario") return;
    if (f.metodoPago === "mixto") {
      const frac = vd / f.total;
      r.efectivo += Math.round((f.valorEfectivo ?? 0) * frac);
      const m = f.medioTransferencia as keyof ResumenMetodos | undefined;
      if (m && m in r) r[m] += Math.round((f.valorTransferencia ?? 0) * frac);
      return;
    }
    const m = f.metodoPago as keyof ResumenMetodos;
    if (m in r) r[m] += vd;
  });
  return { ...r, total: totalResumen(r) };
};

// Total de mesas (mesa + reserva-mesa) desglosado por método.
export const cajaMesasPorMetodo = (facturas: Factura[]): ResumenMetodos & { total: number } => {
  const mesaFs = facturas.filter((f) => f.tipo === "mesa" || f.tipo === "reserva-mesa");
  const r = cajaPorMetodosCompleto(mesaFs);
  return { ...r, total: totalResumen(r) };
};

// ── Estadísticas por categoría de producto ────────────────────────────────────

type CatStat = ResumenMetodos & { total: number };

// Total por categoría (heladeria / comidas-rapidas) desglosado por método de pago.
// Usa proporción de items para distribuir pagos mixtos entre categorías.
export const cajaPorCategoria = (
  facturas: Factura[],
  productos: Producto[]
): { heladeria: CatStat; comidas: CatStat } => {
  const heladeria: CatStat = { ...resumenMetodosVacio(), total: 0 };
  const comidas: CatStat = { ...resumenMetodosVacio(), total: 0 };

  const catProducto = new Map(productos.map((p) => [p.id, p.categoria]));

  facturas
    .filter((f) => f.tipo !== "favor") // items de favor no están en catálogo
    .forEach((f) => {
      const subtotalTotal = f.items.reduce((s, it) => s + it.valor * it.cantidad, 0);
      if (subtotalTotal === 0) return;

      // Importes del pago desglosados (mixto-aware)
      const pagos: Partial<ResumenMetodos> = {};
      if (f.metodoPago === "domiciliario") return;
      if (f.metodoPago === "mixto") {
        pagos.efectivo = f.valorEfectivo ?? 0;
        const m = f.medioTransferencia as keyof ResumenMetodos | undefined;
        if (m) pagos[m] = f.valorTransferencia ?? 0;
      } else {
        const m = f.metodoPago as keyof ResumenMetodos;
        if (m in heladeria) pagos[m] = f.total;
      }

      f.items.forEach((it) => {
        const cat = catProducto.get(it.productoId);
        if (!cat) return;
        const valorItem = it.valor * it.cantidad;
        const frac = valorItem / subtotalTotal;
        const target = cat === "heladeria" ? heladeria : comidas;

        (Object.entries(pagos) as [keyof ResumenMetodos, number][]).forEach(([mk, mv]) => {
          target[mk] += mv * frac;
          target.total += mv * frac;
        });
      });
    });

  // Redondear para evitar flotantes
  const round = (o: CatStat) => {
    (Object.keys(o) as (keyof CatStat)[]).forEach((k) => {
      o[k] = Math.round(o[k]);
    });
  };
  round(heladeria);
  round(comidas);

  return { heladeria, comidas };
};

// ── Cajero ────────────────────────────────────────────────────────────────────

// Efectivo a entregar por un domiciliario.
// Efectivo: suma solo productos (subtotal, sin domicilio).
// Transferencia: resta el valor del domicilio (la caja no recibió ese dinero).
export const efectivoAEntregar = (facturasDomiciliario: Factura[]) => {
  let total = 0;
  facturasDomiciliario.forEach((f) => {
    if (f.metodoPago === "efectivo") {
      total += f.subtotal;
    } else if (f.metodoPago === "mixto") {
      // El efectivo es lo que el cliente pagó al domiciliario directamente
      total += f.valorEfectivo ?? 0;
    } else {
      total -= f.valorDomicilio || 0;
    }
  });
  return total;
};

export const utilidadDia = (facturas: Factura[], gastos = 0) =>
  cajaTotal(facturas) - gastos;

// ── Reportes de administración ────────────────────────────────────────────────

export const rankingBarrios = (facturas: Factura[]) => {
  const m = new Map<string, number>();
  facturas.filter((f) => f.tipo === "domicilio" && f.barrio).forEach((f) => {
    m.set(f.barrio!, (m.get(f.barrio!) || 0) + 1);
  });
  return [...m.entries()].map(([nombre, total]) => ({ nombre, total }))
    .sort((a, b) => b.total - a.total);
};

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

export const rankingProductos = (facturas: Factura[]) => {
  const m = new Map<string, number>();
  facturas.forEach((f) => f.items.forEach((it) => {
    m.set(it.nombre, (m.get(it.nombre) || 0) + it.cantidad);
  }));
  return [...m.entries()].map(([nombre, unidades]) => ({ nombre, unidades }))
    .sort((a, b) => b.unidades - a.unidades);
};

export const ingresosMesasPorMetodo = (facturas: Factura[]) =>
  cajaPorMetodo(facturas.filter((f) => f.tipo === "mesa"));

export const ingresosPorDomiciliario = (facturas: Factura[], domiciliarioId: string) => {
  const fs = facturas.filter((f) => f.tipo === "domicilio" && f.domiciliarioId === domiciliarioId);
  let efectivo = 0, transferencia = 0;
  fs.forEach((f) => {
    if (esTransferencia(f.metodoPago)) transferencia += f.subtotal;
    else efectivo += f.subtotal;
  });
  return { efectivo, transferencia, cantidad: fs.length };
};
