import { Factura, ItemFactura, MetodoPago, TipoFactura } from "@/types";

export const subtotalDe = (items: ItemFactura[]) =>
  items.reduce((acc, it) => acc + it.valor * it.cantidad, 0);

export const totalDe = (items: ItemFactura[], valorDomicilio = 0) =>
  subtotalDe(items) + (valorDomicilio || 0);

export type MetodoPagoEstandar = Exclude<MetodoPago, "mixto" | "domiciliario">;

// Métodos de pago estándar para gastos empresariales (sin mixto ni domiciliario)
export const metodosPago: { value: MetodoPagoEstandar; label: string; grupo: "efectivo" | "transferencia" }[] = [
  { value: "efectivo", label: "Efectivo", grupo: "efectivo" },
  { value: "nequi", label: "Nequi", grupo: "transferencia" },
  { value: "bancolombia", label: "Bancolombia", grupo: "transferencia" },
  { value: "daviplata", label: "Daviplata", grupo: "transferencia" },
  { value: "datafono", label: "Datáfono", grupo: "transferencia" },
];

// Métodos de pago para facturación de órdenes normales (mesa, domicilio, reservas — incluye Mixto)
export const metodosPagoOrden: { value: MetodoPago; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "nequi", label: "Nequi" },
  { value: "bancolombia", label: "Bancolombia" },
  { value: "daviplata", label: "Daviplata" },
  { value: "datafono", label: "Datáfono" },
  { value: "mixto", label: "Mixto" },
];

// Métodos de pago para tipo "favor" (incluye Domiciliario, no incluye Mixto)
export const metodosPagoFavor: { value: MetodoPago; label: string }[] = [
  { value: "efectivo", label: "Efectivo" },
  { value: "nequi", label: "Nequi" },
  { value: "bancolombia", label: "Bancolombia" },
  { value: "daviplata", label: "Daviplata" },
  { value: "datafono", label: "Datáfono" },
  { value: "domiciliario", label: "Domiciliario" },
];

// Sub-medios para pago Mixto (mismo set que transferencias estándar)
export const mediosTransferencia: { value: import("@/types").MedioTransferencia; label: string }[] = [
  { value: "nequi", label: "Nequi" },
  { value: "bancolombia", label: "Bancolombia" },
  { value: "daviplata", label: "Daviplata" },
  { value: "datafono", label: "Datáfono" },
];

const LABELS_METODO: Record<MetodoPago, string> = {
  efectivo: "Efectivo",
  nequi: "Nequi",
  bancolombia: "Bancolombia",
  daviplata: "Daviplata",
  datafono: "Datáfono",
  mixto: "Mixto",
  domiciliario: "Domiciliario",
};

export const labelMetodo = (m: MetodoPago): string => LABELS_METODO[m] ?? m;

export const esTransferencia = (m: MetodoPago) => m !== "efectivo";

const PREFIJOS: Record<TipoFactura, string> = {
  mesa: "M",
  domicilio: "D",
  favor: "F",
  "reserva-domicilio": "RD",
  "reserva-mesa": "RM",
};

export const folio = (f: Factura) =>
  `${PREFIJOS[f.tipo] ?? "?"}-${String(f.consecutivo).padStart(4, "0")}`;
