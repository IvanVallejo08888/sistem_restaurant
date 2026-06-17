// Generación del "Reporte del mes" en Excel (.xlsx) con exceljs.
// Reutiliza las agregaciones de caja/categoría ya existentes en reportes.ts
// (cajaPorMetodosCompleto, cajaPorCategoria) para que los totales coincidan
// exactamente con lo que el admin ya ve en Reportes/Cajero; solo agrega las
// agregaciones que faltaban (rankings con valor en pesos, no solo conteo).
import ExcelJS from "exceljs";
import { Factura, Gasto, Local, Producto, Domiciliario } from "@/types";
import { cajaPorMetodosCompleto, cajaPorCategoria, totalResumen, totalGastos } from "./reportes";
import { folio, esDomicilioLike } from "./factura";

// ── Paleta (mismos tokens de tailwind.config.ts) ──────────────────────────────
const COLOR_RASPBERRY = "FFD63B6A";
const COLOR_COCOA = "FF4A3B38";
const COLOR_CREAM = "FFFBF6EF";
const COLOR_WHITE = "FFFFFFFF";
const COLOR_SAND = "FFF3E9DC";

const ENCABEZADO_NOMBRE = "Heladería Antojos";

export type RangoMes = { mes: number; anio: number }; // mes: 1-12

export const rangoFechasMes = ({ mes, anio }: RangoMes) => {
  const desde = new Date(anio, mes - 1, 1);
  const hasta = new Date(anio, mes, 1); // primer día del mes siguiente (exclusivo)
  return { desde: desde.toISOString(), hasta: hasta.toISOString() };
};

const NOMBRES_MES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const TIPO_LABEL: Record<string, string> = {
  mesa: "Mesa", domicilio: "Domicilio", favor: "Favor",
  "reserva-domicilio": "Reserva Domicilio", "reserva-mesa": "Reserva Mesa",
  regalo: "Regalo", "reserva-regalo": "Reserva Regalo",
};

const nombreFactura = (f: Factura) => {
  if (f.tipo === "mesa" || f.tipo === "reserva-mesa") return f.mesaNombre ?? "";
  if (f.tipo === "favor") return f.nombreFavor ?? "";
  return f.clienteNombre ?? "";
};

// ── Agregaciones específicas del reporte (con valor en pesos, no solo conteo) ─

function topBarrios(facturas: Factura[], n = 10) {
  const m = new Map<string, { pedidos: number; total: number }>();
  facturas.filter((f) => esDomicilioLike(f.tipo) && f.barrio).forEach((f) => {
    const prev = m.get(f.barrio!) ?? { pedidos: 0, total: 0 };
    m.set(f.barrio!, { pedidos: prev.pedidos + 1, total: prev.total + f.total });
  });
  return [...m.entries()]
    .map(([barrio, v]) => ({ barrio, ...v }))
    .sort((a, b) => b.pedidos - a.pedidos)
    .slice(0, n);
}

function topProductos(facturas: Factura[], productos: Producto[], n = 10) {
  const catProducto = new Map(productos.map((p) => [p.id, p.categoria]));
  const m = new Map<string, { categoria: string; cantidad: number; total: number }>();
  facturas.filter((f) => f.tipo !== "favor").forEach((f) => {
    f.items.forEach((it) => {
      const prev = m.get(it.nombre) ?? { categoria: catProducto.get(it.productoId) ?? "—", cantidad: 0, total: 0 };
      m.set(it.nombre, {
        categoria: prev.categoria,
        cantidad: prev.cantidad + it.cantidad,
        total: prev.total + it.valor * it.cantidad,
      });
    });
  });
  const todos = [...m.entries()].map(([producto, v]) => ({ producto, ...v }));
  return {
    masVendidos: [...todos].sort((a, b) => b.cantidad - a.cantidad).slice(0, n),
    menosVendidos: [...todos].sort((a, b) => a.cantidad - b.cantidad).slice(0, n),
  };
}

function reporteDomiciliarios(facturas: Factura[], domiciliarios: Domiciliario[]) {
  const m = new Map<string, { facturas: number; totalProductos: number; gananciaDomicilios: number }>();
  facturas.filter((f) => f.domiciliarioId).forEach((f) => {
    const prev = m.get(f.domiciliarioId!) ?? { facturas: 0, totalProductos: 0, gananciaDomicilios: 0 };
    m.set(f.domiciliarioId!, {
      facturas: prev.facturas + 1,
      totalProductos: prev.totalProductos + f.subtotal,
      gananciaDomicilios: prev.gananciaDomicilios + (f.valorDomicilio ?? 0),
    });
  });
  return [...m.entries()].map(([domiciliarioId, v]) => ({
    nombre: domiciliarios.find((d) => d.id === domiciliarioId)?.nombreCompleto ?? "Domiciliario",
    ...v,
  })).sort((a, b) => b.facturas - a.facturas);
}

function clientesFrecuentes(facturas: Factura[], n = 10) {
  const m = new Map<string, { nombre: string; telefono: string; pedidos: number; total: number }>();
  facturas.filter((f) => esDomicilioLike(f.tipo) && f.clienteWhatsapp).forEach((f) => {
    const k = f.clienteWhatsapp!;
    const prev = m.get(k) ?? { nombre: f.clienteNombre || k, telefono: k, pedidos: 0, total: 0 };
    m.set(k, { ...prev, pedidos: prev.pedidos + 1, total: prev.total + f.total });
  });
  return [...m.entries()].map(([, v]) => v).sort((a, b) => b.total - a.total).slice(0, n);
}

// ── Estilos reutilizables ──────────────────────────────────────────────────────

function estiloEncabezado(ws: ExcelJS.Worksheet, fila: ExcelJS.Row) {
  fila.eachCell((cell) => {
    cell.font = { name: "Calibri", bold: true, color: { argb: COLOR_WHITE } };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_RASPBERRY } };
    cell.alignment = { vertical: "middle", horizontal: "left" };
    cell.border = { bottom: { style: "thin", color: { argb: COLOR_SAND } } };
  });
  fila.height = 22;
  ws.views = [{ state: "frozen", ySplit: fila.number }];
}

function aplicarFilasAlternadas(ws: ExcelJS.Worksheet, desdeFila: number) {
  for (let i = desdeFila; i <= ws.rowCount; i++) {
    const row = ws.getRow(i);
    if ((i - desdeFila) % 2 === 1) {
      row.eachCell((cell) => {
        cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: COLOR_CREAM } };
      });
    }
    row.eachCell((cell) => {
      cell.border = { ...cell.border, bottom: { style: "hair", color: { argb: COLOR_SAND } } };
      cell.font = { ...cell.font, name: cell.font?.name ?? "Calibri" };
    });
  }
}

function ajustarAnchos(ws: ExcelJS.Worksheet) {
  ws.columns.forEach((col) => {
    let max = 10;
    col.eachCell?.({ includeEmpty: false }, (cell) => {
      const len = String(cell.value ?? "").length;
      if (len > max) max = len;
    });
    col.width = Math.min(max + 3, 45);
  });
}

const FORMATO_COP = '"$"#,##0';

function crearHoja(wb: ExcelJS.Workbook, nombre: string, columnas: { header: string; key: string; money?: boolean }[]) {
  const ws = wb.addWorksheet(nombre);
  ws.columns = columnas.map((c) => ({ header: c.header, key: c.key, style: c.money ? { numFmt: FORMATO_COP } : undefined }));
  estiloEncabezado(ws, ws.getRow(1));
  return ws;
}

// ── Construcción del workbook ───────────────────────────────────────────────

export type DatosReporteMensual = {
  rango: RangoMes;
  localId?: string; // si no se pasa, el reporte combina todos los locales
  facturas: Factura[]; // del rango de fechas, INCLUYE canceladas (para la hoja Ventas)
  gastos: Gasto[];     // del rango de fechas
  locales: Local[];
  productos: Producto[];
  domiciliarios: Domiciliario[];
};

export async function generarReporteMensualWorkbook(datos: DatosReporteMensual): Promise<ExcelJS.Workbook> {
  const { rango, localId, facturas, gastos, locales, productos, domiciliarios } = datos;
  const activas = facturas.filter((f) => !f.deletedAt);
  const nombreLocalRow = (id: string) => locales.find((l) => l.id === id)?.nombre ?? "—";
  const periodo = `${NOMBRES_MES[rango.mes - 1]} ${rango.anio}`;
  const alcance = localId ? (nombreLocalRow(localId)) : "Todos los locales";

  const wb = new ExcelJS.Workbook();
  wb.creator = ENCABEZADO_NOMBRE;
  wb.created = new Date();

  // ── Resumen ──────────────────────────────────────────────────────────────
  const wsResumen = wb.addWorksheet("Resumen");
  wsResumen.getCell("A1").value = ENCABEZADO_NOMBRE;
  wsResumen.getCell("A1").font = { name: "Georgia", bold: true, size: 18, color: { argb: COLOR_RASPBERRY } };
  wsResumen.getCell("A2").value = `Reporte del mes · ${periodo}`;
  wsResumen.getCell("A2").font = { name: "Georgia", bold: true, size: 13, color: { argb: COLOR_COCOA } };
  wsResumen.getCell("A3").value = `Local: ${alcance}`;
  wsResumen.getCell("A3").font = { name: "Calibri", italic: true, color: { argb: COLOR_COCOA } };
  wsResumen.addRow([]);

  const filaTituloResumen = wsResumen.addRow(["Concepto", "Valor"]);
  estiloEncabezado(wsResumen, filaTituloResumen);

  const ingresosTotales = totalResumen(cajaPorMetodosCompleto(activas));
  const { heladeria, comidas } = cajaPorCategoria(activas, productos);
  const gastosTotales = totalGastos(gastos);
  const utilidadNeta = ingresosTotales - gastosTotales;

  const filaInicioDatos = wsResumen.rowCount + 1;
  [
    ["Ingresos totales", ingresosTotales],
    ["Ingresos por heladería", heladeria.total],
    ["Ingresos por comidas rápidas", comidas.total],
    ["Gastos totales", gastosTotales],
    ["Utilidad neta", utilidadNeta],
  ].forEach((row) => wsResumen.addRow(row));
  for (let i = filaInicioDatos; i <= wsResumen.rowCount; i++) {
    wsResumen.getCell(`B${i}`).numFmt = FORMATO_COP;
  }

  if (!localId && locales.length > 1) {
    wsResumen.addRow([]);
    const filaPorLocal = wsResumen.addRow(["Desglose por local", "Ingresos", "Gastos", "Utilidad"]);
    estiloEncabezado(wsResumen, filaPorLocal);
    const inicioPorLocal = wsResumen.rowCount + 1;
    locales.forEach((l) => {
      const fL = activas.filter((f) => f.localId === l.id);
      const gL = gastos.filter((g) => g.localId === l.id);
      const ing = totalResumen(cajaPorMetodosCompleto(fL));
      const gas = totalGastos(gL);
      wsResumen.addRow([l.nombre, ing, gas, ing - gas]);
    });
    for (let i = inicioPorLocal; i <= wsResumen.rowCount; i++) {
      wsResumen.getCell(`B${i}`).numFmt = FORMATO_COP;
      wsResumen.getCell(`C${i}`).numFmt = FORMATO_COP;
      wsResumen.getCell(`D${i}`).numFmt = FORMATO_COP;
    }
  }
  ajustarAnchos(wsResumen);

  // ── Ventas (todas las facturas, incluye canceladas) ─────────────────────
  const wsVentas = crearHoja(wb, "Ventas", [
    { header: "Local", key: "local" },
    { header: "# Factura", key: "folio" },
    { header: "Fecha", key: "fecha" },
    { header: "Hora", key: "hora" },
    { header: "Tipo", key: "tipo" },
    { header: "Cliente", key: "cliente" },
    { header: "Teléfono", key: "telefono" },
    { header: "Valor", key: "valor", money: true },
    { header: "Estado", key: "estado" },
    { header: "Domiciliario", key: "domiciliario" },
  ]);
  facturas
    .sort((a, b) => +new Date(a.creadoEn) - +new Date(b.creadoEn))
    .forEach((f) => {
      const fecha = new Date(f.creadoEn);
      wsVentas.addRow({
        local: nombreLocalRow(f.localId),
        folio: folio(f),
        fecha: fecha.toLocaleDateString("es-CO"),
        hora: fecha.toLocaleTimeString("es-CO", { hour: "2-digit", minute: "2-digit" }),
        tipo: TIPO_LABEL[f.tipo] ?? f.tipo,
        cliente: nombreFactura(f),
        telefono: f.clienteWhatsapp ?? "",
        valor: f.total,
        estado: f.deletedAt ? "Cancelada" : "Completada",
        domiciliario: f.domiciliarioId ? (domiciliarios.find((d) => d.id === f.domiciliarioId)?.nombreCompleto ?? "") : "",
      });
    });
  aplicarFilasAlternadas(wsVentas, 2);
  ajustarAnchos(wsVentas);

  // ── Top 10 barrios ────────────────────────────────────────────────────────
  const wsBarrios = crearHoja(wb, "Top 10 barrios", [
    { header: "Barrio", key: "barrio" },
    { header: "# de pedidos", key: "pedidos" },
    { header: "Total vendido", key: "total", money: true },
  ]);
  topBarrios(activas, 10).forEach((b) => wsBarrios.addRow(b));
  aplicarFilasAlternadas(wsBarrios, 2);
  ajustarAnchos(wsBarrios);

  // ── Productos más / menos vendidos ──────────────────────────────────────
  const { masVendidos, menosVendidos } = topProductos(activas, productos, 10);
  const colsProductos = [
    { header: "Producto", key: "producto" },
    { header: "Categoría", key: "categoria" },
    { header: "Cantidad vendida", key: "cantidad" },
    { header: "Total generado", key: "total", money: true },
  ];
  const wsMas = crearHoja(wb, "Más vendidos", colsProductos);
  masVendidos.forEach((p) => wsMas.addRow(p));
  aplicarFilasAlternadas(wsMas, 2);
  ajustarAnchos(wsMas);

  const wsMenos = crearHoja(wb, "Menos vendidos", colsProductos);
  menosVendidos.forEach((p) => wsMenos.addRow(p));
  aplicarFilasAlternadas(wsMenos, 2);
  ajustarAnchos(wsMenos);

  // ── Domiciliarios ────────────────────────────────────────────────────────
  const wsDom = crearHoja(wb, "Domiciliarios", [
    { header: "Domiciliario", key: "nombre" },
    { header: "# Facturas", key: "facturas" },
    { header: "Total generado en productos", key: "totalProductos", money: true },
    { header: "Ganancia en domicilios", key: "gananciaDomicilios", money: true },
  ]);
  reporteDomiciliarios(activas, domiciliarios).forEach((d) => wsDom.addRow(d));
  aplicarFilasAlternadas(wsDom, 2);
  ajustarAnchos(wsDom);

  // ── Clientes frecuentes ──────────────────────────────────────────────────
  const wsClientes = crearHoja(wb, "Clientes frecuentes", [
    { header: "Nombre", key: "nombre" },
    { header: "Teléfono", key: "telefono" },
    { header: "# de pedidos", key: "pedidos" },
    { header: "Total comprado", key: "total", money: true },
  ]);
  clientesFrecuentes(activas, 50).forEach((c) => wsClientes.addRow(c));
  aplicarFilasAlternadas(wsClientes, 2);
  ajustarAnchos(wsClientes);

  return wb;
}
