// Genera el PDF de "Factura electrónica PRO". Import dinámico de jsPDF desde
// el llamador (CompartirFactura) evita que se incluya en el bundle de servidor.
//
// Se dibuja con la API vectorial de jsPDF (texto/líneas) en vez de rasterizar
// el HTML con html2canvas: el resultado es más nítido, el archivo es más
// liviano y no depende de que las fuentes/estilos Tailwind se computen igual
// en el momento de la captura.
import type jsPDF from "jspdf";
import { Factura } from "@/types";
import { folio, labelMetodo } from "./factura";
import { formatCOP, formatFecha, formatHora12 } from "./utils";
import { EMPRESA } from "./configuracionEmpresa";

const ANCHO = 80; // mm, formato ticket
const MARGEN = 5;
const CENTRO = ANCHO / 2;

function nombreDestino(f: Factura): string | null {
  if (f.tipo === "mesa" || f.tipo === "reserva-mesa") return f.mesaNombre ? `Mesa: ${f.mesaNombre}` : null;
  if (f.tipo === "favor") return f.nombreFavor ? `Favor: ${f.nombreFavor}` : null;
  if (f.direccion) return `Domicilio: ${f.direccion}${f.barrio ? ` · ${f.barrio}` : ""}`;
  return null;
}

export const generarFacturaPDF = async (factura: Factura, nombreLocal: string): Promise<File> => {
  const { default: JsPDF } = await import("jspdf");

  // Altura dinámica: cabecera + filas de ítems + totales + pie.
  const alto = 95 + factura.items.length * 6
    + (factura.metodoPago === "mixto" ? 6 : 0)
    + (factura.valorDescuento ? 4 : 0)
    + (factura.valorCostoAdicional ? 4 : 0);
  const doc: jsPDF = new JsPDF({ orientation: "portrait", unit: "mm", format: [ANCHO, alto] });

  let y = 10;
  const linea = () => {
    y += 2;
    doc.setLineDashPattern([0.5, 0.5], 0);
    doc.line(MARGEN, y, ANCHO - MARGEN, y);
    y += 4;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text(nombreLocal, CENTRO, y, { align: "center" });
  y += 5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  if (EMPRESA.nit) { doc.text(`NIT: ${EMPRESA.nit}`, CENTRO, y, { align: "center" }); y += 3.5; }
  if (EMPRESA.ciudad) { doc.text(EMPRESA.ciudad, CENTRO, y, { align: "center" }); y += 3.5; }
  if (EMPRESA.telefono) { doc.text(`Tel: ${EMPRESA.telefono}`, CENTRO, y, { align: "center" }); y += 3.5; }

  linea();

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.text("FACTURA DE VENTA ELECTRÓNICA", CENTRO, y, { align: "center" });
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  doc.text(`No. ${folio(factura)}`, CENTRO, y, { align: "center" });
  y += 3.5;
  doc.text(`Fecha: ${formatFecha(factura.creadoEn)}   Hora: ${formatHora12(factura.creadoEn)}`, CENTRO, y, { align: "center" });
  y += 2;

  const destino = nombreDestino(factura);
  if (destino) {
    linea();
    doc.text(destino, MARGEN, y);
    y += 2;
  }

  linea();
  doc.setFont("helvetica", "bold");
  doc.text("CANT", MARGEN, y);
  doc.text("DESCRIPCIÓN", MARGEN + 10, y);
  doc.text("TOTAL", ANCHO - MARGEN, y, { align: "right" });
  y += 3.5;
  doc.setFont("helvetica", "normal");
  factura.items.forEach((it) => {
    doc.text(String(it.cantidad), MARGEN, y);
    const nombre = it.nombre.length > 22 ? `${it.nombre.slice(0, 21)}…` : it.nombre;
    doc.text(nombre, MARGEN + 10, y);
    doc.text(formatCOP(it.valor * it.cantidad), ANCHO - MARGEN, y, { align: "right" });
    y += 4;
  });

  linea();
  doc.text("Subtotal:", MARGEN, y);
  doc.text(formatCOP(factura.subtotal), ANCHO - MARGEN, y, { align: "right" });
  y += 4;
  if (factura.valorDomicilio) {
    doc.text("Domicilio:", MARGEN, y);
    doc.text(formatCOP(factura.valorDomicilio), ANCHO - MARGEN, y, { align: "right" });
    y += 4;
  }
  if (factura.valorDescuento) {
    const detalle = factura.tipoDescuento === "porcentaje" ? ` (${factura.porcentajeDescuento}%)` : "";
    doc.text(`Descuento${detalle}:`, MARGEN, y);
    doc.text(`-${formatCOP(factura.valorDescuento)}`, ANCHO - MARGEN, y, { align: "right" });
    y += 4;
  }
  if (factura.valorCostoAdicional) {
    const detalle = factura.tipoCostoAdicional === "porcentaje" ? ` (${factura.porcentajeCostoAdicional}%)` : "";
    doc.text(`Costo adicional${detalle}:`, MARGEN, y);
    doc.text(`+${formatCOP(factura.valorCostoAdicional)}`, ANCHO - MARGEN, y, { align: "right" });
    y += 4;
  }
  doc.setFont("helvetica", "bold");
  doc.text("TOTAL:", MARGEN, y);
  doc.text(formatCOP(factura.total), ANCHO - MARGEN, y, { align: "right" });
  y += 4;
  doc.setFont("helvetica", "normal");
  doc.text("Método de pago:", MARGEN, y);
  doc.text(labelMetodo(factura.metodoPago), ANCHO - MARGEN, y, { align: "right" });
  y += 4;
  if (factura.metodoPago === "mixto") {
    doc.setFontSize(6.5);
    doc.text(
      `(Efectivo: ${formatCOP(factura.valorEfectivo ?? 0)} | Transferencia: ${formatCOP(factura.valorTransferencia ?? 0)})`,
      MARGEN,
      y
    );
    doc.setFontSize(7);
    y += 4;
  }

  linea();
  doc.text("Forma de pago: Contado", MARGEN, y);
  y += 3.5;
  if (EMPRESA.resolucionDIAN) {
    doc.text(`Resolución DIAN No. ${EMPRESA.resolucionDIAN}${EMPRESA.resolucionFecha ? ` del ${EMPRESA.resolucionFecha}` : ""}`, MARGEN, y);
    y += 3.5;
  }
  if (EMPRESA.rangoDesde && EMPRESA.rangoHasta) {
    doc.text(`Rango autorizado: del ${EMPRESA.rangoDesde} al ${EMPRESA.rangoHasta}`, MARGEN, y);
    y += 3.5;
  }

  linea();
  doc.setFont("helvetica", "bold");
  doc.text(EMPRESA.mensajePie, CENTRO, y, { align: "center" });

  const blob: Blob = doc.output("blob");
  return new File([blob], `factura-${folio(factura)}.pdf`, { type: "application/pdf" });
};
